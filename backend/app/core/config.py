from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://sisyphus:sisyphus@db:5432/sisyphus"
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    SECRET_KEY: str = "dev-secret-key-change-in-production-64-bytes-long-string-sample-key"
    TEST_DATABASE_URL: Optional[str] = "postgresql+asyncpg://sisyphus:sisyphus@db:5432/sisyphus_test"
    ANTHROPIC_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
