import json
import re
import asyncio
from openai import AsyncOpenAI
import json_repair
from app.schemas.interpreter_schema import GenerateExamRequest, GenerateExamResponse, ComprehensiveExamData, PracticeExamData, TrueFalseQuestion, MultipleChoiceQuestion, SummaryRubric

PROMPT_TF = """You are an Expert CATTI Interpretation Examiner for Level 2.
Your task is to generate exactly 10 True/False questions based on the provided transcript.
- CRITICAL: You MUST design highly deceptive incorrect statements. Use techniques like: Phonetic similarity, Temporal inversion, Subject displacement. Document this in `distractor_logic` (in Chinese).
- Output valid JSON only:
{{
  "true_or_false": [
    {{ "id": "q1", "statement": "...", "answer": "True", "distractor_logic": "...", "timestamp_ref": "..." }}
  ]
}}
"""

PROMPT_MC = """You are an Expert CATTI Interpretation Examiner for Level 2.
Your task is to generate exactly 30 multiple choice questions (10 short detail, 20 passage) based on the provided transcript.
- CRITICAL: Design tricky wrong options and explain the trap in `distractor_logic` (in Chinese).
- Output valid JSON only:
{{
  "multiple_choice_short": [
    {{ "id": "mc_s_1", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "A", "distractor_logic": "..." }}
  ],
  "multiple_choice_passage": [
    {{ "id": "mc_p_1", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "B", "distractor_logic": "..." }}
  ]
}}
"""

PROMPT_SUMMARY = """You are an Expert CATTI Interpretation Examiner for Level 2.
Your task is to extract exactly 5 non-negotiable key scoring points for a 200-word summary of the provided transcript.
- CRITICAL: `key_scoring_points` MUST be written in Chinese.
- Output valid JSON only:
{{
  "summary_rubric": {{
    "source_word_count": 500,
    "required_word_count_target": 200,
    "key_scoring_points": ["1. ...", "2. ...", "3. ...", "4. ...", "5. ..."]
  }}
}}
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

def _clean_json_string(raw_text: str) -> str:
    match = re.search(r'```(?:json)?(.*?)```', raw_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return raw_text.strip()

async def safe_call_llm(client: AsyncOpenAI, model: str, system_prompt: str, user_text: str, extra_body: dict):
    if not user_text.strip():
        return {}
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transcript:\n{user_text}"}
            ],
            response_format={"type": "json_object"},
            extra_body=extra_body,
            temperature=0.3
        )
        return json_repair.loads(_clean_json_string(response.choices[0].message.content))
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {}

async def generate_exam(request: GenerateExamRequest) -> GenerateExamResponse:
    if request.provider == "mimo":
        base_url = "https://api.xiaomimimo.com/v1"
        model = "mimo-v2.5-pro"
        extra_body = {"thinking": {"type": "disabled"}}
    else:
        base_url = "https://api.deepseek.com"
        model = "deepseek-chat"
        extra_body = {}

    client = AsyncOpenAI(api_key=request.api_key, base_url=base_url)

    if request.exam_type == "口译实务":
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": PROMPT_MODE_B},
                    {"role": "user", "content": f"Transcript:\n\n{request.transcript}"}
                ],
                response_format={"type": "json_object"},
                extra_body=extra_body,
                temperature=0.3
            )
            parsed_data = json_repair.loads(_clean_json_string(response.choices[0].message.content))
            return GenerateExamResponse(**parsed_data)
        except Exception as e:
            raise ValueError(f"LLM API Error: {str(e)}")
            
    else:
        # Comprehensive Exam: Parallel Calls
        tf_task = safe_call_llm(client, model, PROMPT_TF, request.true_false_transcript, extra_body)
        mc_task = safe_call_llm(client, model, PROMPT_MC, request.multiple_choice_transcript, extra_body)
        sum_task = safe_call_llm(client, model, PROMPT_SUMMARY, request.summary_transcript, extra_body)
        
        tf_res, mc_res, sum_res = await asyncio.gather(tf_task, mc_task, sum_task)
        
        comp_data = ComprehensiveExamData(
            true_or_false=[TrueFalseQuestion(**q) for q in tf_res.get("true_or_false", [])],
            multiple_choice_short=[MultipleChoiceQuestion(**q) for q in mc_res.get("multiple_choice_short", [])],
            multiple_choice_passage=[MultipleChoiceQuestion(**q) for q in mc_res.get("multiple_choice_passage", [])],
            summary_rubric=SummaryRubric(**sum_res.get("summary_rubric", {"source_word_count": 0, "required_word_count_target": 200, "key_scoring_points": []})) if sum_res.get("summary_rubric") else SummaryRubric(source_word_count=0, required_word_count_target=200, key_scoring_points=[])
        )
        
        return GenerateExamResponse(
            exam_type="口译综合能力",
            audio_meta={"duration": 0, "word_count": 0},
            questions=comp_data
        )
