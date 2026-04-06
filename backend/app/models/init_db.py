"""
Database initialization script
"""

from app.core.database import Base, engine
from app.models import *  # noqa: F401, F403 - Import all models to register them


def init_db() -> None:
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()
