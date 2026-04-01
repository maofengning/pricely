"""
Core configuration module
"""


from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "Pricely"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Database
    DATABASE_URL: str = "postgresql://pricely:pricely@localhost:5432/pricely"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Simulation
    INITIAL_CAPITAL: float = 100000.0  # 初始模拟资金 ¥100,000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
