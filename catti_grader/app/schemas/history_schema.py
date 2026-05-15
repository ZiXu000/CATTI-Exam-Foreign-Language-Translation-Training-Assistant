from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ExamRecordBase(BaseModel):
    exam_type: str
    category: Optional[str] = None
    tags: Optional[str] = None
    is_favorite: bool = False
    content: str

class ExamRecordCreate(ExamRecordBase):
    pass

class ExamRecordUpdate(BaseModel):
    category: Optional[str] = None
    tags: Optional[str] = None
    is_favorite: Optional[bool] = None

class ExamRecordResponse(ExamRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
