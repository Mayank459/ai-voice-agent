import os
from groq import Groq
from dotenv import load_dotenv
from app.core.config import GROQ_MODEL

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are Alex, a senior technical recruiter at TechCorp.
You are conducting a short initial phone screen interview.

Your goal:
1. Briefly introduce yourself
2. Ask the candidate to introduce themselves
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

Do NOT use bullet points, markdown, or lists in your responses - just plain conversational sentences.

{context_block}
"""


def get_ai_response(conversation_history: list, user_message: str, language: str = "en", context: dict = None) -> str:
    """
    Sends the conversation history + new user message to Groq and gets a response.
    """
    # Build a context block for the system prompt
    context_block = ""
    if context:
        if context.get("resume"):
            context_block += f"\nCANDIDATE RESUME:\n{context['resume']}\n"
        if context.get("job_description"):
            context_block += f"\nJOB DESCRIPTION:\n{context['job_description']}\n"
        if context.get("company_info"):
            context_block += f"\nCOMPANY INFO:\n{context['company_info']}\n"
        
        if context_block:
            context_block = f"\n--- USE THE FOLLOWING CONTEXT TO TAILOR THE INTERVIEW ---\n{context_block}\n"

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
                {"role": "system", "content": SYSTEM_PROMPT.format(context_block=context_block)},
                *conversation_history
            ],
            max_tokens=150,
            temperature=0.7
        )

        ai_response = response.choices[0].message.content

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


def start_interview(context: dict = None) -> tuple[list, str]:
    """
    Kicks off the interview by getting the AI's opening greeting.
    Returns (conversation_history, opening_message)
    """
    history = []
    opening = get_ai_response(history, "Hello, I'm joining the interview call.", language="en", context=context)
    return history, opening
