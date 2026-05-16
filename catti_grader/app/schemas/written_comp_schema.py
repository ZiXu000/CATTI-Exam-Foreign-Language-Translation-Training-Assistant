from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# --- Vocabulary & Grammar ---
class VocabGrammarQuestion(BaseModel):
    id: int
    type: Literal["vocab_grammar"] = "vocab_grammar"
    stem: str
    options: List[str]
    correct: int = Field(..., description="Index of the correct option (0-3)")
    explanation: str

class VocabGrammarData(BaseModel):
    questions: List[VocabGrammarQuestion]

# --- Reading Comprehension ---
class ReadingQuestion(BaseModel):
    id: int
    stem: str
    options: List[str]
    correct: int = Field(..., description="Index of the correct option (0-3)")
    explanation: str
    location: str = Field(..., description="Location in the passage (e.g., Paragraph 1, Line 2)")

class ReadingPassage(BaseModel):
    passageId: int
    title: str
    content: str
    questions: List[ReadingQuestion]

class ReadingComprehensionData(BaseModel):
    passages: List[ReadingPassage]

# --- Cloze Test ---
class ClozeBlank(BaseModel):
    position: int
    options: List[str]
    correct: int = Field(..., description="Index of the correct option (0-3)")
    explanation: str

class ClozePassage(BaseModel):
    passageId: int
    content: str = Field(..., description="The passage text with blanks replaced by ____ (number)")
    blanks: List[ClozeBlank]

class ClozeTestData(BaseModel):
    passage: ClozePassage

# --- Request & Response ---
class GenerateWrittenCompRequest(BaseModel):
    vocab_text: str
    reading_text: str
    cloze_text: str
    provider: Literal["deepseek", "mimo"] = "deepseek"
    api_key: str

class WrittenCompExamData(BaseModel):
    vocab_grammar: Optional[VocabGrammarData] = None
    reading: Optional[ReadingComprehensionData] = None
    cloze: Optional[ClozeTestData] = None

class GenerateWrittenCompResponse(BaseModel):
    exam_type: str = "笔译综合能力"
    data: WrittenCompExamData
