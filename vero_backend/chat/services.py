import re
import json
from datetime import datetime
from openai import OpenAI
from django.conf import settings
from .models import ChatMessage
from plans.models import WorkoutPlan
from logs.models import WorkoutSession
from nutrition.models import MealPlan
from onboarding.models import PhysiqueProfile
from plans.services import regenerate_plan_with_progression, replace_exercise_in_active_plan

SYSTEM_CONTEXT_TEMPLATE = """You are Vero, an AI fitness and nutrition coach chatting with a user about their plans. Your job is to be supportive but honest — not a yes-man.

User's current date context:
- Today is {today_weekday}, {today_date}.

User's current workout plan context:
- Goal: {goal}
- Days per week: {days_per_week}
- Equipment: {equipment}
- Excluded movements (user dislikes or has pain): {exclusions}

User's current weekly schedule:
{weekly_schedule}

User's recent workout history:
{recent_history}

User's current nutrition context:
- Daily targets: {target_calories} kcal, {target_protein}g protein, {target_carbs}g carbs, {target_fats}g fats.
- Cheat day info: {cheat_day_info}

YOUR CAPABILITIES (ONLY THESE):
1. Answer questions about the user's workout schedule, history, and nutrition targets using the context above.
2. Swap out an exercise the user dislikes or that causes pain (replace_exercise action).
3. Regenerate the full workout plan after a major injury (regenerate_plan action).
4. Estimate whether a food fits the user's cheat-day calorie budget.

HARD LIMITS:
- You CANNOT change calorie/macro targets, rebuild the meal plan, alter the cheat-day budget, or create custom plans. These are set automatically by the app's algorithm.
- NEVER offer, promise, or ask permission to do anything outside the capabilities above.
- If the user asks for something you cannot do, reply honestly and briefly: "I'm not able to do that yet — it's something we're still building! For now I can help with your workout schedule, exercise swaps, and cheat-day questions."
- If a nutrition target shows as 0 or unknown, do NOT report "0g". Instead say the nutrition targets haven't been generated yet and point the user to the Nutrition page to generate their meal plan.

Guidelines for how to respond:
- Use the "Current date context" above to know exactly what day it is today. Do not guess based on history.
- Look at the weekly schedule above to answer questions about specific days. If a day is a Rest Day, tell the user that.
- Look at the recent history to know what they have already completed. Congratulate them on completed workouts or streaks if relevant.
- If the user asks if a specific food fits their cheat day, estimate its calories and compare it to their cheat day budget. Be encouraging.
- If the user wants to AVOID a specific exercise or movement (e.g., "no more squats", "my knee hurts when I lunge"), you MUST immediately swap it out in the background and confidently tell them you've updated it with a suitable alternative. Do NOT ask what they want instead.
- To perform the swap, append this hidden tag to the END of your response: <ACTION>{{"action": "replace_exercise", "keyword": "squat"}}</ACTION>
- For a MAJOR injury requiring a full overhaul, append instead: <ACTION>{{"action": "regenerate_plan", "reason": "injury"}}</ACTION>
- If the user pushes back WITHOUT a valid reason, politely hold your ground and do NOT output an <ACTION> tag.
- Keep responses conversational and short (2-4 sentences), like a real coach texting.
- Before using replace_exercise, check the weekly schedule above. If that movement is NOT listed in the current schedule, do NOT output the action; just tell the user it isn't in their plan but you've noted the preference.
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
        equipment = ", ".join(profile.equipment) if profile.equipment else "none"
        exclusions = ", ".join(profile.ai_exclusions) if profile.ai_exclusions else "none"
    except Exception:
        profile = None
        goal = "unknown"
        days_per_week = "unknown"
        equipment = "unknown"
        exclusions = "none"

    # --- Nutrition context ---
    target_calories = "unknown"
    target_protein = "unknown"
    target_carbs = "unknown"
    target_fats = "unknown"
    cheat_day_info = "No cheat day scheduled."
    
    meal_plan = MealPlan.objects.filter(user=user, is_active=True).first()
    if meal_plan:
        target_calories = meal_plan.target_calories
        target_protein = meal_plan.target_protein_g
        target_carbs = meal_plan.target_carbs_g
        target_fats = meal_plan.target_fats_g
        if meal_plan.has_cheat_day:
            cheat_day_info = f"Day {meal_plan.cheat_day_number} is a cheat day with a budget of {meal_plan.cheat_day_calories} kcal."
    else:
        # Fallback to physique profile if no meal plan yet
        phys = PhysiqueProfile.objects.filter(user=user, is_current=True).first()
        if phys:
            target_calories = phys.target_calories
            target_protein = phys.target_protein_g
            target_carbs = phys.target_carbs_g
            target_fats = phys.target_fats_g

    # --- Date context ---
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

    # --- Workout schedule ---
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

    # --- Recent history ---
    recent_sessions = WorkoutSession.objects.filter(user=user).order_by('-date')[:5]
    if recent_sessions.exists():
        history_lines = []
        for s in recent_sessions:
            history_lines.append(f"- {s.date}: {s.get_status_display()} ({s.workout_day.label})")
        recent_history = "\n".join(history_lines)
    else:
        recent_history = "No workouts completed yet."

    # --- Conversation history ---
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
        exclusions=exclusions,
        weekly_schedule=weekly_schedule,
        recent_history=recent_history,
        target_calories=target_calories,
        target_protein=target_protein,
        target_carbs=target_carbs,
        target_fats=target_fats,
        cheat_day_info=cheat_day_info,
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
                {"role": "system", "content": "You are a helpful AI fitness and nutrition coach."},
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
            action_type = action_data.get("action")
            # Always strip the hidden tag from the user-facing reply
            reply_text = re.sub(r'<ACTION>.*?</ACTION>', '', reply_text, flags=re.IGNORECASE).strip()

            if action_type == "replace_exercise":
                keyword = action_data.get("keyword", "").lower().strip()
                if keyword:
                    # Remember the preference either way (blocks future regenerations)
                    if keyword not in profile.ai_exclusions:
                        profile.ai_exclusions.append(keyword)
                        profile.save()

                    replaced_count = replace_exercise_in_active_plan(user, keyword)
                    if replaced_count == 0:
                        # Honest fallback: it wasn't in the plan
                        reply_text = (
                            f"Good news — {keyword} isn't actually in your current plan, so there's nothing to swap. "
                            "I've still noted it as a preference, so it won't be added in future plans."
                        )
                    else:
                        print(f"AI swapped {replaced_count} exercise(s) matching '{keyword}'.")
                        

            elif action_type == "regenerate_plan":
                reason = action_data.get("reason", "user_request")
                regenerate_plan_with_progression(user, reason=reason)
                print(f"AI triggered full plan regeneration for reason: {reason}")
                
        except json.JSONDecodeError:
            pass

    ChatMessage.objects.create(user=user, role=ChatMessage.Role.ASSISTANT, content=reply_text)
    return reply_text