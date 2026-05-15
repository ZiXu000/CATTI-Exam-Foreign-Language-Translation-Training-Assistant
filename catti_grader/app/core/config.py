from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    OPENAI_API_KEY: str = "sk-mock-key"
    MODEL_NAME: str = "gpt-4o"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
