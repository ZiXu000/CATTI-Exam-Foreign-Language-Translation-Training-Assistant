from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db import Base

class ExamRecord(Base):
    __tablename__ = "exam_records"

    id = Column(Integer, primary_key=True, index=True)
    exam_type = Column(String, index=True) # "written", "口译综合能力", "口译实务"
    category = Column(String, index=True, nullable=True) # User defined category
    tags = Column(String, nullable=True) # Comma separated tags
    is_favorite = Column(Boolean, default=False)
    content = Column(Text) # JSON string of the exam / transcript / result
    created_at = Column(DateTime(timezone=True), server_default=func.now())
