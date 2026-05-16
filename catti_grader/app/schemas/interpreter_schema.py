from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TrueFalseQuestion(BaseModel):
    id: str
    statement: str
    answer: Literal["True", "False"]
    distractor_logic: str = Field(..., description="Explain the trap used (e.g., phonetic confusion, subject swap).")
    timestamp_ref: Optional[str] = None

class MultipleChoiceQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: str
    distractor_logic: str = Field(..., description="Explain the trap used for wrong options.")

class SummaryRubric(BaseModel):
    source_word_count: int
    required_word_count_target: int = 200
    key_scoring_points: List[str]

class ComprehensiveExamData(BaseModel):
    true_or_false: List[TrueFalseQuestion]
    multiple_choice_short: List[MultipleChoiceQuestion]
    multiple_choice_passage: List[MultipleChoiceQuestion]
    summary_rubric: SummaryRubric

class Chunk(BaseModel):
    id: str
    text: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class PracticeExamData(BaseModel):
    chunks: List[Chunk]

class GenerateExamRequest(BaseModel):
    exam_type: Literal["口译综合能力", "口译实务"]
    transcript: str = ""
    true_false_transcript: str = ""
    multiple_choice_transcript: str = ""
    summary_transcript: str = ""
    provider: Literal["deepseek", "mimo"] = "deepseek"
    api_key: str

class GenerateExamResponse(BaseModel):
    exam_type: str
    audio_meta: dict
    questions: Optional[ComprehensiveExamData] = None
    practice_data: Optional[PracticeExamData] = None
