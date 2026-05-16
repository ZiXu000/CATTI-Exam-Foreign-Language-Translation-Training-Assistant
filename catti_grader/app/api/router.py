from fastapi import APIRouter, HTTPException
from app.schemas.grader import TranslationRequest, GraderResponse
from app.services.llm_service import grade_translation
from app.schemas.interpreter_schema import GenerateExamRequest, GenerateExamResponse
from app.services.interpreter_llm_service import generate_exam
from app.api.endpoints import history, interpreter, tts, written_comp

router = APIRouter()

router.include_router(history.router, prefix="/history", tags=["History"])
router.include_router(tts.router, prefix="/tts", tags=["TTS"])
router.include_router(written_comp.router, prefix="/written_comp", tags=["Written Comprehensive"])

@router.post("/grade", response_model=GraderResponse, summary="Grade translation using LLM")
async def grade_endpoint(request: TranslationRequest):
    try:
        response = await grade_translation(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_exam", response_model=GenerateExamResponse, summary="Generate interpreter exam using LLM")
async def generate_exam_endpoint(request: GenerateExamRequest):
    try:
        response = await generate_exam(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
