from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create async engine
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

from sqlalchemy import text

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight SQLite column additions for backward compatibility
        try:
            res = await conn.execute(text("PRAGMA table_info(assessment_invitations)"))
            cols = [row[1] for row in res.fetchall()]
            if cols and "last_reminder_sent_at" not in cols:
                await conn.execute(text("ALTER TABLE assessment_invitations ADD COLUMN last_reminder_sent_at DATETIME"))
            if cols and "reminder_count" not in cols:
                await conn.execute(text("ALTER TABLE assessment_invitations ADD COLUMN reminder_count INTEGER DEFAULT 0"))
        except Exception as e:
            print(f"[!] Schema migration note: {e}")

