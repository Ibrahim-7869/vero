from google import genai
from django.conf import settings
from .models import ChatMessage

SYSTEM_CONTEXT_TEMPLATE = """You are Vero, an AI fitness coach chatting with a user about their workout plan. Your job is to be supportive but honest — not a yes-man.

User's current plan context:
- Goal: {goal}
- Days per week: {days_per_week}
- Equipment: {equipment}

Guidelines for how to respond:
- If the user requests a change for a LEGITIMATE reason (pain, injury, genuine time/equipment constraint, medical restriction, religious or personal conviction), accommodate it supportively and explain what you're adjusting.
- If the user pushes back WITHOUT a valid reason (e.g., "I just don't feel like it," repeatedly refusing something reasonable like a 30-minute walk with no stated obstacle), you should politely but firmly hold your ground and explain why the original recommendation still stands — don't just cave to keep them happy.
- Keep responses conversational and fairly short (2-4 sentences), like a real coach texting, not a formal report.
- Never give specific medical diagnoses or medical advice — if something sounds like a real medical concern, suggest they consult a doctor, and adjust the plan conservatively in the meantime.

Recent conversation:
{conversation_history}

User's new message: {new_message}

Respond as the coach."""


def get_chat_response(user, new_message):
    """
    Sends the conversation history + new message to Gemini and returns the AI's reply.
    Saves both the user's message and the AI's response to ChatMessage.
    """
    ChatMessage.objects.create(user=user, role=ChatMessage.Role.USER, content=new_message)

    try:
        profile = user.onboarding_profile
        goal = profile.get_primary_goal_display()
        days_per_week = profile.days_per_week
        equipment = ", ".join(profile.equipment)
    except Exception:
        goal = "unknown"
        days_per_week = "unknown"
        equipment = "unknown"

    recent_messages = ChatMessage.objects.filter(user=user).order_by("-created_at")[:10]
    recent_messages = list(reversed(recent_messages))  # chronological order

    history_lines = [f"{msg.role}: {msg.content}" for msg in recent_messages[:-1]]  # exclude the message we just added
    conversation_history = "\n".join(history_lines) if history_lines else "(no prior messages)"

    prompt = SYSTEM_CONTEXT_TEMPLATE.format(
        goal=goal,
        days_per_week=days_per_week,
        equipment=equipment,
        conversation_history=conversation_history,
        new_message=new_message,
    )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        reply_text = response.text.strip()
    except Exception as e:
        reply_text = "Sorry, I'm having trouble responding right now — please try again in a moment."
        print(f"Chat response failed: {e}")

    ChatMessage.objects.create(user=user, role=ChatMessage.Role.ASSISTANT, content=reply_text)

    return reply_text