import base64
import io
import wave
import re
from openai import AsyncOpenAI
from app.schemas.tts_schema import TTSRequest, TTSResponse

def chunk_text(text: str, max_length: int = 200) -> list[str]:
    # Split by punctuation
    sentences = re.split(r'(?<=[.!?。！？\n])\s+', text.strip())
    chunks = []
    current_chunk = ""
    for sentence in sentences:
        if not sentence.strip():
            continue
        if len(current_chunk) + len(sentence) <= max_length:
            current_chunk += (" " if current_chunk else "") + sentence
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = sentence
            while len(current_chunk) > max_length:
                chunks.append(current_chunk[:max_length])
                current_chunk = current_chunk[max_length:]
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

def concat_wav_bytes(wav_bytes_list: list[bytes]) -> bytes:
    if not wav_bytes_list:
        return b""
    if len(wav_bytes_list) == 1:
        return wav_bytes_list[0]
        
    out_io = io.BytesIO()
    try:
        with wave.open(io.BytesIO(wav_bytes_list[0]), 'rb') as w_in:
            params = w_in.getparams()
            with wave.open(out_io, 'wb') as w_out:
                w_out.setparams(params)
                for wav_bytes in wav_bytes_list:
                    with wave.open(io.BytesIO(wav_bytes), 'rb') as w:
                        w_out.writeframes(w.readframes(w.getnframes()))
        return out_io.getvalue()
    except Exception as e:
        print("Error concatenating WAVs:", e)
        return wav_bytes_list[0]

async def generate_tts(request: TTSRequest) -> TTSResponse:
    client = AsyncOpenAI(
        api_key=request.api_key,
        base_url="https://api.xiaomimimo.com/v1"
    )

    text_chunks = chunk_text(request.text, 200)
    wav_bytes_list = []

    try:
        for chunk in text_chunks:
            completion = await client.chat.completions.create(
                model="mimo-v2.5-tts",
                messages=[
                    {
                        "role": "user",
                        "content": request.style
                    },
                    {
                        "role": "assistant",
                        "content": chunk
                    }
                ],
                extra_body={
                    "audio": {
                        "format": "wav",
                        "voice": request.voice
                    }
                }
            )
            
            message = completion.choices[0].message
            audio_bytes = base64.b64decode(message.audio.data)
            wav_bytes_list.append(audio_bytes)
            
        final_wav = concat_wav_bytes(wav_bytes_list)
        return TTSResponse(audio_base64=base64.b64encode(final_wav).decode("utf-8"))
    except Exception as e:
        raise ValueError(f"TTS API Error: {str(e)}")
