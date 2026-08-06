import re
import json
from datetime import datetime
from openai import OpenAI
from django.conf import settings
from .models import ChatMessage
from plans.models import WorkoutPlan
from logs.models import WorkoutSession
from plans.services import regenerate_plan_with_progression, replace_exercise_in_active_plan

SYSTEM_CONTEXT_TEMPLATE = """You are Vero, an AI fitness coach chatting with a user about their workout plan. Your job is to be supportive but honest — not a yes-man.

User's current date context:
- Today is {today_weekday}, {today_date}.

User's current plan context:
- Goal: {goal}
- Days per week: {days_per_week}
- Equipment: {equipment}

User's current weekly schedule:
{weekly_schedule}

User's recent workout history:
{recent_history}

Guidelines for how to respond:
- Use the "Current date context" above to know exactly what day it is today. Do not guess based on history.
- Look at the weekly schedule above to answer questions about specific days. If a day is a Rest Day, tell the user that.
- Look at the recent history to know what they have already completed. Congratulate them on completed workouts or streaks if relevant.
- If the user requests a change for a LEGITIMATE reason (pain, injury, genuine time/equipment constraint, medical restriction, religious or personal conviction), accommodate it supportively.
- If the user wants to AVOID a specific exercise or movement (e.g., "no more squats", "my knee hurts when I lunge", "I hate pushups"), you MUST immediately swap it out in the background. 
- DO NOT ask the user what they want to replace it with. Just make the change and confidently tell them you've updated it with a suitable alternative.
- To perform the swap, you MUST append a hidden JSON action to the END of your response.
- The JSON action must be in this exact format: <ACTION>{{"action": "replace_exercise", "keyword": "squat"}}</ACTION>
- Replace "squat" with the lowercase keyword to avoid.
- If the user pushes back WITHOUT a valid reason, politely hold your ground and DO NOT output the <ACTION> tag.
- Keep responses conversational and fairly short (2-4 sentences), like a real coach texting.
- Never give specific medical diagnoses.

Recent conversation:
{conversation_history}

User's new message: {new_message}

Respond as the coach."""


def get_chat_response(user, new_message, today_date=None):
    ChatMessage.objects.create(user=user, role=ChatMessage.Role.USER, content=new_message)

    try:
        profile = user.onboarding_profile
        goal = profile.get_primary_goal_display()
        days_per_week = profile.days_per_week
        equipment = ", ".join(profile.equipment)
    except Exception:
        profile = None
        goal = "unknown"
        days_per_week = "unknown"
        equipment = "unknown"

    # --- NEW: Figure out the exact weekday based on the frontend date ---
    if today_date:
        try:
            dt = datetime.strptime(today_date, "%Y-%m-%d")
            today_weekday = dt.strftime("%A")
        except ValueError:
            today_weekday = "Unknown"
            today_date = "Unknown"
    else:
        today_weekday = "Unknown"
        today_date = "Unknown"

    weekly_schedule = "No plan found."
    plan = WorkoutPlan.objects.filter(user=user, is_active=True).first()
    
    WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    if plan:
        schedule_lines = []
        for day in plan.days.all().order_by('day_number'):
            weekday_name = WEEKDAYS[day.day_number - 1]
            if day.is_rest_day:
                schedule_lines.append(f"- {weekday_name} (Day {day.day_number}): Rest Day")
            else:
                ex_names = ", ".join([we.exercise.name for we in day.exercises.all()])
                schedule_lines.append(f"- {weekday_name} (Day {day.day_number}): {day.label} (Exercises: {ex_names})")
        weekly_schedule = "\n".join(schedule_lines)

    recent_sessions = WorkoutSession.objects.filter(user=user).order_by('-date')[:5]
    if recent_sessions.exists():
        history_lines = []
        for s in recent_sessions:
            history_lines.append(f"- {s.date}: {s.get_status_display()} ({s.workout_day.label})")
        recent_history = "\n".join(history_lines)
    else:
        recent_history = "No workouts completed yet."

    recent_messages = ChatMessage.objects.filter(user=user).order_by("-created_at")[:10]
    recent_messages = list(reversed(recent_messages))
    history_lines = [f"{msg.role}: {msg.content}" for msg in recent_messages[:-1]]
    conversation_history = "\n".join(history_lines) if history_lines else "(no prior messages)"

    prompt = SYSTEM_CONTEXT_TEMPLATE.format(
        today_weekday=today_weekday,
        today_date=today_date,
        goal=goal,
        days_per_week=days_per_week,
        equipment=equipment,
        weekly_schedule=weekly_schedule,
        recent_history=recent_history,
        conversation_history=conversation_history,
        new_message=new_message,
    )

    # --- GROQ API INTEGRATION ---
    try:
        client = OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1"
        )
        
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful AI fitness coach."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
        )
        reply_text = chat_completion.choices[0].message.content.strip()
    except Exception as e:
        reply_text = "Sorry, I'm having trouble responding right now — please try again in a moment."
        print(f"Chat response failed: {e}")

    # Check for AI command to modify the plan
    action_match = re.search(r'<ACTION>(.*?)</ACTION>', reply_text, re.IGNORECASE)
    if action_match and profile:
        action_json = action_match.group(1)
        try:
            action_data = json.loads(action_json)
            if action_data.get("action") == "replace_exercise":
                keyword = action_data.get("keyword", "").lower().strip()
                if keyword:
                    # 1. Save it to profile exclusions so it never gets added back in future full regenerations
                    if keyword not in profile.ai_exclusions:
                        profile.ai_exclusions.append(keyword)
                        profile.save()
                    
                    # 2. Swap the exercise in the current active plan immediately
                    replaced_count = replace_exercise_in_active_plan(user, keyword)
                    print(f"AI swapped {replaced_count} exercise(s) matching '{keyword}'.")
                    
                    # Strip the JSON tag from the user-facing reply
                    reply_text = re.sub(r'<ACTION>.*?</ACTION>', '', reply_text, flags=re.IGNORECASE).strip()
        except json.JSONDecodeError:
            pass

    ChatMessage.objects.create(user=user, role=ChatMessage.Role.ASSISTANT, content=reply_text)
    return reply_text