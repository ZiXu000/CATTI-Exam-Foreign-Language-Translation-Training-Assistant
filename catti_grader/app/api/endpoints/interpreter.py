from fastapi import APIRouter, HTTPException
from app.schemas.interpreter_schema import GenerateExamRequest, GenerateExamResponse
from app.services.interpreter_llm_service import generate_exam

router = APIRouter()

@router.post("/generate_exam", response_model=GenerateExamResponse)
async def create_exam(request: GenerateExamRequest):
    try:
        response = await generate_exam(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
