from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    exa_api_key: str = ""
    db_url: str = "sqlite+aiosqlite:///./academia_vs_reality.db"
    openrouter_model: str = "openai/gpt-5.4"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
