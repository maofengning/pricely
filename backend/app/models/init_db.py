"""
Database initialization script
"""

from app.core.database import engine, Base
from app.models import *  # Import all models to register them


def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()