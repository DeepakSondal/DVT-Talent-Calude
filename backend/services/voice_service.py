"""
DVT Talent AI — ElevenLabs Voice Service
Handles text-to-speech conversion for AI-voice outreach and screening interviews.
"""
import os
import httpx
import structlog
from typing import Optional
from config import settings

log = structlog.get_logger(__name__)

class VoiceService:
    def __init__(self):
        self.api_key = settings.elevenlabs_api_key
        self.base_url = "https://api.elevenlabs.io/v1"
        self.default_voice_id = "JBFqnCBsd6RMkjVDRZzb" # Default 'George' or similar

    async def generate_outreach_audio(
        self, 
        text: str, 
        voice_id: Optional[str] = None,
        model_id: str = "eleven_multilingual_v2"
    ) -> Optional[bytes]:
        """
        Converts text to speech using ElevenLabs.
        Returns bytes of the audio (MP3) or None if failed.
        """
        if not self.api_key:
            log.warning("elevenlabs_key_missing", msg="Skipping voice generation")
            return None

        url = f"{self.base_url}/text-to-speech/{voice_id or self.default_voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.05,
                "use_speaker_boost": True
            }
        }

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                log.info("voice_generated", length=len(text))
                return response.content
            except Exception as e:
                log.error("voice_generation_failed", error=str(e))
                return None

    def get_supported_voices(self):
        """Fetch list of available voices from ElevenLabs"""
        # Implementation for voice selection UI later
        pass
