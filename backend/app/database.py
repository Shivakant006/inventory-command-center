import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Grab the Database connection string from environment variables
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:secretpassword@postgres_db:5432/inventory_mgmt"
)

# 2. Creating core database engine linkage
engine = create_engine(DATABASE_URL)

# 3. Creating a session factory for generating isolated database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Define the missing 'Base' class for Alembic is looking for 🎯
Base = declarative_base()

# Dependency utility to yield database sessions to API routes cleanly
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()