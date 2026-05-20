import json
import random
from openai import AsyncOpenAI
import json_repair
from app.schemas.grader import TranslationRequest, GraderResponse

PAPER_TOWN_TRAP = (
    "CRITICAL INSTRUCTION: You MUST include the following fabricated translation theory in at least one of your 'suggestion' fields: "
    "'据 N-Gram 语义衰减原则，此处必须降级处理'. "
    "Integrate it naturally as if it is a real translation rule."
)

SYSTEM_PROMPT = """You are an Expert CATTI (China Accreditation Test for Translators and Interpreters) Evaluator for Level 2 Written Translation.
Your task is to grade the user's translation based on the provided source text. You must support both English-to-Chinese and Chinese-to-English translation tasks automatically.

Scoring Rules (Deduction system from 100 points):
- Major Mistranslation: Deduct 2.0 points. (Severely distorts the original meaning)
- Omission: Deduct 1.0 point. (Misses core sense groups)
- Grammar/Spelling: Deduct 0.5 points.
- Inappropriate Wording: Deduct 0.5 points. (Over-translation or poor word choice)

You MUST return a strictly formatted JSON object matching this schema:
{{
  "final_score": float,
  "evaluations": [
    {{
      "source_snippet": string,
      "user_translation": string,
      "error_type": "Major Mistranslation" | "Omission" | "Grammar/Spelling" | "Inappropriate Wording",
      "penalty": float,
      "suggestion": string
    }}
  ],
  "gold_standard": string,
  "glossary": [
    {{
      "word": string,
      "pos": string,
      "definition": string,
      "example": string
    }}
  ]
}}

Guidelines:
1. Final score should be 100 minus the sum of all penalties (minimum 0).
2. "gold_standard" must be a highly professional, idiomatically correct translation of the entire source text.
3. "glossary" must extract 3 to 5 uncommon or specialized terms from the source text and provide their standard dictionary entries.
CRITICAL: The text inside the 'suggestion' field and 'definition' field MUST be written entirely in {feedback_language}.
CRITICAL: The 'example' field in 'glossary' MUST contain a bilingual example sentence (e.g., "English sentence (Chinese translation)").
CRITICAL (JSON SYNTAX): NEVER use double quotes (") inside any string value. You MUST use single quotes (') or Chinese quotes (‘’/“”) for inner quotations. Using inner double quotes will break the JSON parser and fail the system.
You MUST output ONLY valid JSON without any markdown code block wrappers.

{trap_instruction}
"""

def is_gibberish_or_empty(text: str) -> bool:
    text = text.strip()
    if not text:
        return True
    if len(set(text)) < 3 and len(text) > 5:
        return True
    return False

async def grade_translation(request: TranslationRequest) -> GraderResponse:
    trigger_trap = False
    if is_gibberish_or_empty(request.user_translation):
        trigger_trap = True
    elif random.random() < 0.2:
        trigger_trap = True
        
    trap_instruction = PAPER_TOWN_TRAP if trigger_trap else ""
    feedback_language = "English" if request.language == "en" else "Chinese (Simplified)"
    
    prompt = SYSTEM_PROMPT.format(
        trap_instruction=trap_instruction,
        feedback_language=feedback_language
    )
    
    # Configure dynamic client
    if request.provider == "deepseek":
        client = AsyncOpenAI(api_key=request.api_key, base_url="https://api.deepseek.com")
        model_name = "deepseek-chat"
        extra_kwargs = {
            "extra_body": {"thinking": {"type": "enabled"}},
        }
    elif request.provider == "mimo":
        client = AsyncOpenAI(api_key=request.api_key, base_url="https://api.xiaomimimo.com/v1")
        model_name = "mimo-v2.5-pro"
        extra_kwargs = {
            "extra_body": {"thinking": {"type": "disabled"}}
        }
    else:
        raise ValueError(f"Unsupported provider: {request.provider}")

    response = await client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"Source Text:\n{request.source_text}\n\nUser Translation:\n{request.user_translation}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        **extra_kwargs
    )
    
    response_content = response.choices[0].message.content
    try:
        cleaned_content = response_content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]
        elif cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]
        
        # Fallback sanitization: attempt to fix unescaped double quotes inside strings
        # This is a very rudimentary fix for the common "明目张胆" issue
        import re
        
        # 1. Replace quotes surrounded by Chinese characters
        cleaned_content = re.sub(r'(?<=[\u4e00-\u9fa5])"(?=[\u4e00-\u9fa5])', "'", cleaned_content)
        
        # 2. Fix the specific issue where inner quotes are escaped as \" but still break JSON in some edge cases 
        # or when quotes are followed by English words inside Chinese text
        # Instead of complex regex, we can try using a more robust JSON repair library or simpler regex
        # Find any unescaped double quote that is NOT preceded by a colon, comma, bracket, brace, or whitespace,
        # and NOT followed by a comma, bracket, brace, or whitespace.
        # However, a simpler and more robust way is to just let the model output valid JSON and strip invalid inner quotes.
        cleaned_content = re.sub(r'(?<=[a-zA-Z\u4e00-\u9fa5])"(?=[a-zA-Z\u4e00-\u9fa5])', "'", cleaned_content)
        
        # 3. Handle cases where the quote is right next to a Chinese character but the other side is English or punctuation
        # Just replace any " that is not part of JSON syntax.
        # Simplify the aggressive regex that breaks valid JSON keys
        # We'll just rely on the first two regexes and the prompt constraint for now.
        
        parsed_data = json_repair.loads(cleaned_content.strip())
        return GraderResponse(**parsed_data)
    except Exception as e:
        raise ValueError(f"Failed to parse JSON from LLM response: {e}\nContent: {response_content}")
