import json
import re
import asyncio
from openai import AsyncOpenAI
import json_repair
from app.schemas.written_comp_schema import (
    GenerateWrittenCompRequest,
    GenerateWrittenCompResponse,
    WrittenCompExamData,
    VocabGrammarData,
    ReadingComprehensionData,
    ClozeTestData
)

def _clean_json_string(raw_text: str) -> str:
    """Extract JSON from markdown code blocks or raw text."""
    match = re.search(r'```(?:json)?(.*?)```', raw_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return raw_text.strip()

async def generate_vocab_grammar(client: AsyncOpenAI, model_name: str, text: str, extra_kwargs: dict) -> VocabGrammarData:
    prompt = f"""
    You are an expert CATTI Level 2 Written Translation Examiner.
    Based on the following text, generate Vocabulary and Grammar multiple-choice questions.
    Generate as many high-quality questions as possible (aim for up to 60, but at least 10 depending on text length).
    
    Each question must have 4 options, only 1 correct answer, and a detailed explanation in Chinese.
    
    Return the result STRICTLY as a JSON object matching this structure:
    {{
      "questions": [
        {{
          "id": 1,
          "type": "vocab_grammar",
          "stem": "The ______ of the new policy was felt across the entire industry.",
          "options": ["affect", "effect", "impact", "influence"],
          "correct": 2,
          "explanation": "此处需要名词形式且意为“影响”，effect符合；affect是动词，impact和influence虽可作名词但语境更常见effect。"
        }}
      ]
    }}
    
    Text:
    {text}
    """
    completion = await client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        **extra_kwargs
    )
    res_text = completion.choices[0].message.content
    parsed_json = json_repair.loads(_clean_json_string(res_text))
    return VocabGrammarData(**parsed_json)

async def generate_reading(client: AsyncOpenAI, model_name: str, text: str, extra_kwargs: dict) -> ReadingComprehensionData:
    prompt = f"""
    You are an expert CATTI Level 2 Written Translation Examiner.
    Based on the following text, generate Reading Comprehension questions.
    Split the text into logical passages (aim for up to 3 passages, 300-500 words each).
    For each passage, generate up to 10 multiple-choice questions.
    
    Return the result STRICTLY as a JSON object matching this structure:
    {{
      "passages": [
        {{
          "passageId": 1,
          "title": "Passage Title",
          "content": "Full passage text...",
          "questions": [
            {{
              "id": 1,
              "stem": "Question stem?",
              "options": ["A", "B", "C", "D"],
              "correct": 0,
              "explanation": "中文解析...",
              "location": "第X段第Y行"
            }}
          ]
        }}
      ]
    }}
    
    Text:
    {text}
    """
    completion = await client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        **extra_kwargs
    )
    res_text = completion.choices[0].message.content
    parsed_json = json_repair.loads(_clean_json_string(res_text))
    return ReadingComprehensionData(**parsed_json)

async def generate_cloze(client: AsyncOpenAI, model_name: str, text: str, extra_kwargs: dict) -> ClozeTestData:
    prompt = f"""
    You are an expert CATTI Level 2 Written Translation Examiner.
    Based on the following text, generate a Cloze Test.
    Select a passage of about 200-250 words from the text, and create up to 20 blanks.
    Replace the blanks in the `content` with "____ (1)", "____ (2)", etc.
    
    Return the result STRICTLY as a JSON object matching this structure:
    {{
      "passage": {{
        "passageId": 1,
        "content": "In recent years, the concept has gained ____ (1) attention. ...",
        "blanks": [
          {{
            "position": 1,
            "options": ["considerable", "few", "little", "no"],
            "correct": 0,
            "explanation": "中文解析..."
          }}
        ]
      }}
    }}
    
    Text:
    {text}
    """
    completion = await client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": "You output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        **extra_kwargs
    )
    res_text = completion.choices[0].message.content
    parsed_json = json_repair.loads(_clean_json_string(res_text))
    return ClozeTestData(**parsed_json)

async def generate_written_comp_exam(request: GenerateWrittenCompRequest) -> GenerateWrittenCompResponse:
    if request.provider == "deepseek":
        client = AsyncOpenAI(api_key=request.api_key, base_url="https://api.deepseek.com")
        model_name = "deepseek-chat"
        extra_kwargs = {
            "response_format": {"type": "json_object"},
            "temperature": 1.0
        }
    elif request.provider == "mimo":
        client = AsyncOpenAI(api_key=request.api_key, base_url="https://api.xiaomimimo.com/v1")
        model_name = "mimo-v2.5-pro"
        extra_kwargs = {
            "temperature": 1.0
        }
    else:
        raise ValueError("Unsupported provider")

    # Run generations concurrently if text is provided for that section
    tasks = []
    
    async def safe_gen(coro):
        try:
            return await coro
        except Exception as e:
            print(f"Error generating section: {e}")
            return None

    vocab_task = safe_gen(generate_vocab_grammar(client, model_name, request.vocab_text, extra_kwargs)) if request.vocab_text.strip() else asyncio.sleep(0)
    reading_task = safe_gen(generate_reading(client, model_name, request.reading_text, extra_kwargs)) if request.reading_text.strip() else asyncio.sleep(0)
    cloze_task = safe_gen(generate_cloze(client, model_name, request.cloze_text, extra_kwargs)) if request.cloze_text.strip() else asyncio.sleep(0)

    vocab_res, reading_res, cloze_res = await asyncio.gather(vocab_task, reading_task, cloze_task)

    if vocab_res is None and reading_res is None and cloze_res is None:
        if request.vocab_text.strip() or request.reading_text.strip() or request.cloze_text.strip():
            raise ValueError("Failed to generate any exam sections. The LLM may have returned malformed data.")

    data = WrittenCompExamData(
        vocab_grammar=vocab_res,
        reading=reading_res,
        cloze=cloze_res
    )

    return GenerateWrittenCompResponse(data=data)
