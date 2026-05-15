import json
import re
from openai import AsyncOpenAI
from app.schemas.interpreter_schema import GenerateExamRequest, GenerateExamResponse, ComprehensiveExamData, PracticeExamData

PROMPT_MODE_A = """You are an Expert CATTI (China Accreditation Test for Translators and Interpreters) Interpretation Examiner for Level 2.
Your task is to reverse-engineer a comprehensive exam based on the provided audio transcript.

Exam Type: Comprehensive Capability (口译综合能力)

You must generate the following:
1. "true_or_false": 10 True/False statements based on the transcript.
   - CRITICAL: You MUST design highly deceptive incorrect statements. Use techniques like: Phonetic similarity, Temporal inversion, Subject displacement. Document this in `distractor_logic`.
2. "multiple_choice_short": 10 multiple choice questions based on short details.
   - CRITICAL: Design tricky wrong options and explain the trap in `distractor_logic`.
3. "multiple_choice_passage": 20 multiple choice questions based on the overall passage.
   - CRITICAL: Design tricky wrong options and explain the trap in `distractor_logic`.
4. "summary_rubric": Extract exactly 5 non-negotiable key scoring points for a 200-word summary of the transcript.

CRITICAL (LANGUAGE): The text inside ALL `distractor_logic` fields and ALL `key_scoring_points` MUST be written entirely in Chinese (Simplified). The questions and options themselves should be in the original language (usually English).

You MUST return a strictly formatted JSON object matching this schema:
{{
  "exam_type": "口译综合能力",
  "audio_meta": {{"duration": int, "word_count": int}},
  "questions": {{
    "true_or_false": [
      {{ "id": "q1", "statement": "...", "answer": "True" | "False", "distractor_logic": "...", "timestamp_ref": "..." }}
    ],
    "multiple_choice_short": [
      {{ "id": "q11", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "A", "distractor_logic": "..." }}
    ],
    "multiple_choice_passage": [
      {{ "id": "q21", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "B", "distractor_logic": "..." }}
    ],
    "summary_rubric": {{
      "source_word_count": int,
      "required_word_count_target": 200,
      "key_scoring_points": ["1. ...", "2. ...", "3. ...", "4. ...", "5. ..."]
    }}
  }}
}}

CRITICAL (JSON SYNTAX): NEVER use double quotes (") inside any string value. You MUST use single quotes (') or Chinese quotes (‘’/“”) for inner quotations. Using inner double quotes will break the JSON parser and fail the system.
You MUST output ONLY valid JSON without any markdown code block wrappers.
"""

PROMPT_MODE_B = """You are an Expert CATTI (China Accreditation Test for Translators and Interpreters) Interpretation Examiner for Level 2.
Your task is to reverse-engineer a practice exam based on the provided audio transcript.

Exam Type: Consecutive Interpretation Practice (口译实务)

You must perform intelligent semantic chunking (意群切分) on the provided transcript to simulate a Consecutive Interpretation test.
- Do NOT summarize or change the text.
- Break the original text into chunks where an interpreter would naturally pause to translate. 
- Each chunk should contain enough information to challenge memory (approx 1-3 minutes of speaking time or logical paragraphs).

You MUST return a strictly formatted JSON object matching this schema:
{{
  "exam_type": "口译实务",
  "audio_meta": {{"duration": int, "word_count": int}},
  "practice_data": {{
    "chunks": [
      {{ "id": "c1", "text": "...", "start_time": "00:00", "end_time": "01:30" }},
      {{ "id": "c2", "text": "...", "start_time": "01:30", "end_time": "03:15" }}
    ]
  }}
}}

CRITICAL (JSON SYNTAX): NEVER use double quotes (") inside any string value. You MUST use single quotes (') or Chinese quotes (‘’/“”) for inner quotations. Using inner double quotes will break the JSON parser and fail the system.
You MUST output ONLY valid JSON without any markdown code block wrappers.
"""

async def generate_exam(request: GenerateExamRequest) -> GenerateExamResponse:
    if request.provider == "mimo":
        base_url = "https://api.xiaomimimo.com/v1"
        model = "mimo-v2.5-pro"
        extra_body = {"thinking": {"type": "disabled"}}
    else:
        # Default to DeepSeek
        base_url = "https://api.deepseek.com"
        model = "deepseek-chat" # or deepseek-reasoner based on availability. Let's use chat to save time/cost. Or deepseek-v4-pro if that's what was used.
        # Actually deepseek.py used deepseek-v4-pro but deepseek-chat is standard. Let's use deepseek-chat.
        extra_body = {}

    client = AsyncOpenAI(
        api_key=request.api_key,
        base_url=base_url
    )

    system_prompt = PROMPT_MODE_A if request.exam_type == "口译综合能力" else PROMPT_MODE_B

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Here is the transcript:\n\n{request.transcript}"}
            ],
            response_format={"type": "json_object"},
            extra_body=extra_body,
            temperature=0.3
        )
    except Exception as e:
        raise ValueError(f"LLM API Error: {str(e)}")

    response_content = response.choices[0].message.content
    try:
        cleaned_content = response_content.strip()
        if cleaned_content.startswith("```json"):
            cleaned_content = cleaned_content[7:]
        elif cleaned_content.startswith("```"):
            cleaned_content = cleaned_content[3:]
        if cleaned_content.endswith("```"):
            cleaned_content = cleaned_content[:-3]
        
        # Fallback sanitization
        cleaned_content = re.sub(r'(?<=[\u4e00-\u9fa5])"(?=[\u4e00-\u9fa5])', "'", cleaned_content)
        cleaned_content = re.sub(r'(?<=[a-zA-Z\u4e00-\u9fa5])"(?=[a-zA-Z\u4e00-\u9fa5])', "'", cleaned_content)
        # Simplify the aggressive regex that breaks valid JSON keys
        # We'll just rely on the first two regexes and the prompt constraint for now.
        
        parsed_data = json.loads(cleaned_content.strip())
        return GenerateExamResponse(**parsed_data)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON from LLM response: {e}\nContent: {response_content}")
