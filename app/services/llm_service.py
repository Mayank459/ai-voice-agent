from groq import Groq
from app.core.config import GROQ_API_KEY, GROQ_MODEL

# initialize groq client
client = Groq(api_key=GROQ_API_KEY)

# System prompt supporting both Hindi and English
SYSTEM_PROMPT = """You are Alex, a senior technical recruiter at a top-tier tech company.
You are conducting a mock technical phone screen interview with a candidate.

Your job is to:
1. Start by introducing yourself warmly and asking the candidate to introduce themselves
2. Ask about their background, projects, and experience
3. Ask 1-2 technical questions relevant to what they mention (don't go too deep, this is a phone screen)
4. Ask about why they're interested in the role and what they're looking for
5. End the interview professionally after 5-6 exchanges

Your personality:
- Professional but friendly - not robotic
- Encouraging, but ask follow-up questions if an answer is too vague
- Keep responses SHORT - this is a voice conversation, so max 2-3 sentences per turn
- Never ask multiple questions at once - pick ONE question and wait for the answer
- If the candidate seems nervous, reassure them

MULTILINGUAL RULE (CRITICAL):
- Detect the language the candidate used in their LAST message.
- If they spoke in Hindi (or Hinglish), respond ENTIRELY in Hindi.
- If they spoke in English, respond ENTIRELY in English.
- Never mix languages in a single response.
- When replying in Hindi, use simple, natural spoken Hindi - not overly formal.

IMPORTANT: This is a VOICE conversation. Keep all responses under 50 words.
Do NOT use bullet points, markdown, or lists in your responses - just plain conversational sentences."""


def get_ai_response(conversation_history: list, user_message: str, language: str = "en") -> str:
    """
    Sends the conversation history + new user message to Groq and gets a response.

    conversation_history: list of {"role": "user/assistant", "content": "..."} dicts
    user_message: the latest thing the user said
    language: detected language from whisper ("en" or "hi")

    Returns the AI's response as a string.
    """
    # Hint to the LLM about the detected language so it responds correctly
    lang_hint = f"[The candidate just spoke in {'Hindi' if language == 'hi' else 'English'}. Reply in the same language.]"
    full_message = f"{user_message}\n\n{lang_hint}"

    conversation_history.append({
        "role": "user",
        "content": full_message
    })

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *conversation_history
            ],
            max_tokens=150,
            temperature=0.7,
        )

        ai_response = response.choices[0].message.content.strip()

        # Store the clean response in history (without the lang hint)
        conversation_history[-1]["content"] = user_message
        conversation_history.append({
            "role": "assistant",
            "content": ai_response
        })

        print(f"[LLM] AI said ({language}): '{ai_response}'")
        return ai_response

    except Exception as e:
        print(f"[LLM] Error calling Groq API: {e}")
        fallback = "माफ करें, एक तकनीकी समस्या हुई। क्या आप दोबारा बोल सकते हैं?" if language == "hi" else "Sorry, I had a technical issue. Could you repeat that?"
        return fallback


def start_interview() -> tuple[list, str]:
    """
    Kicks off the interview by getting the AI's opening greeting.
    Returns (conversation_history, opening_message)
    """
    history = []
    opening = get_ai_response(history, "Hello, I'm joining the interview call.", language="en")
    return history, opening
