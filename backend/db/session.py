from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=not settings.is_production,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    pool_recycle=300,  # Recycle connections every 5 min (avoid Supabase idle drops)
    pool_timeout=30,  # Wait up to 30s for a connection from the pool
    # Required for Supabase pgbouncer in transaction mode
    connect_args={
        "statement_cache_size": 0,
        "command_timeout": 30,  # Per-query timeout
        "timeout": 10,  # Connection establishment timeout
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
