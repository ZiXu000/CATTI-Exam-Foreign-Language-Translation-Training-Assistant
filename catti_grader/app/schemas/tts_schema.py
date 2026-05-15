from pydantic import BaseModel
from typing import Optional

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "Chloe"
    style: Optional[str] = "Professional and clear reading."
    api_key: str

class TTSResponse(BaseModel):
    audio_base64: str # WAV format base64 encoded
