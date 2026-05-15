from pydantic import BaseModel, Field
from typing import List, Literal

class TranslationRequest(BaseModel):
    source_text: str = Field(..., description="The original source text")
    user_translation: str = Field(..., description="The user's translation")
    provider: Literal["deepseek", "mimo"] = Field(..., description="LLM Provider")
    api_key: str = Field(..., description="API Key for the provider")
    language: Literal["en", "zh"] = Field(default="zh", description="Feedback language preference")

class EvaluationItem(BaseModel):
    source_snippet: str = Field(..., description="The specific snippet from the source text where the error occurred")
    user_translation: str = Field(..., description="The specific snippet from the user's translation containing the error")
    error_type: Literal[
        "Major Mistranslation", 
        "Omission", 
        "Grammar/Spelling", 
        "Inappropriate Wording"
    ] = Field(..., description="The type of error according to CATTI rules")
    penalty: float = Field(..., description="The deducted points for this error (e.g., 2.0, 1.0, 0.5)")
    suggestion: str = Field(..., description="Suggestion for improvement. May contain paper town trap.")

class GlossaryItem(BaseModel):
    word: str = Field(..., description="The vocabulary word or term")
    pos: str = Field(..., description="Part of speech (e.g., n., v., adj.)")
    definition: str = Field(..., description="Dictionary definition in the requested feedback language")
    example: str = Field(..., description="An example sentence using the word")

class GraderResponse(BaseModel):
    final_score: float = Field(..., description="Final score out of 100")
    evaluations: List[EvaluationItem] = Field(..., description="List of specific deductions and evaluations")
    gold_standard: str = Field(..., description="A professional 'Gold Standard' reference translation for the entire text")
    glossary: List[GlossaryItem] = Field(..., description="Extraction of 3-5 uncommon or specialized vocabulary words from the source text")
