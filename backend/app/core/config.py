import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Recruitment Assessment + Proctored Testing Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "SUPER_SECRET_RECRUITMENT_PROCTORING_KEY_CHANGE_IN_PROD_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./assessment_portal.db"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Code Judge Sandbox Limits
    JUDGE_CPU_TIMEOUT_SECONDS: int = 5
    JUDGE_WALL_TIMEOUT_SECONDS: int = 7
    JUDGE_MAX_MEMORY_MB: int = 256
    JUDGE_MAX_OUTPUT_BYTES: int = 65536  # 64 KB

    # Proctoring & Security
    DEFAULT_WARNING_LIMIT: int = 3
    AUTO_SUSPENSION_ENABLED: bool = True
    MIN_FACE_CONFIDENCE: float = 0.5

    # AI Service Settings
    AI_PROVIDER: str = "builtin_expert"  # 'builtin_expert', 'gemini', 'openai'
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-1.5-pro"

    # Supported Programming Languages
    SUPPORTED_LANGUAGES: List[str] = [
        "python", "javascript", "typescript", "cpp", "c", "java", "go", "rust"
    ]

    # Email & Gmail SMTP Settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "EvalAI Assessment Platform"
    SMTP_FROM_EMAIL: str = ""
    SMTP_TLS: bool = True
    EMAIL_VERIFICATION_ENABLED: bool = True
    OTP_EXPIRE_MINUTES: int = 15
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
