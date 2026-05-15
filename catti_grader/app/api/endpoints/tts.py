from fastapi import APIRouter, HTTPException
from app.schemas.tts_schema import TTSRequest, TTSResponse
from app.services.tts_service import generate_tts

router = APIRouter()

@router.post("/", response_model=TTSResponse)
async def create_tts(request: TTSRequest):
    try:
        response = await generate_tts(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
