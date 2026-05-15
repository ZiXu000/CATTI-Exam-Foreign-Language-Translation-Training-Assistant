from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.models import ExamRecord
from app.schemas.history_schema import ExamRecordCreate, ExamRecordUpdate, ExamRecordResponse

router = APIRouter()

@router.post("/", response_model=ExamRecordResponse)
def create_exam_record(record: ExamRecordCreate, db: Session = Depends(get_db)):
    db_record = ExamRecord(**record.model_dump())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.get("/", response_model=List[ExamRecordResponse])
def get_exam_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    records = db.query(ExamRecord).order_by(ExamRecord.created_at.desc()).offset(skip).limit(limit).all()
    return records

@router.get("/{record_id}", response_model=ExamRecordResponse)
def get_exam_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ExamRecord).filter(ExamRecord.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

@router.put("/{record_id}", response_model=ExamRecordResponse)
def update_exam_record(record_id: int, record_update: ExamRecordUpdate, db: Session = Depends(get_db)):
    db_record = db.query(ExamRecord).filter(ExamRecord.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    
    update_data = record_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_record, key, value)
        
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/{record_id}")
def delete_exam_record(record_id: int, db: Session = Depends(get_db)):
    db_record = db.query(ExamRecord).filter(ExamRecord.id == record_id).first()
    if db_record is None:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db.delete(db_record)
    db.commit()
    return {"message": "Record deleted successfully"}
