from fastapi import APIRouter, HTTPException
from app.schemas.written_comp_schema import GenerateWrittenCompRequest, GenerateWrittenCompResponse
from app.services.written_comp_llm_service import generate_written_comp_exam

router = APIRouter()

@router.post("/generate", response_model=GenerateWrittenCompResponse)
async def generate_exam(request: GenerateWrittenCompRequest):
    try:
        response = await generate_written_comp_exam(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
