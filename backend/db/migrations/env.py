import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

# Make backend/ importable when running alembic from backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from db.base import Base  # noqa: E402

# Import all models so Alembic can detect them for autogenerate
import models.application  # noqa: F401, E402
import models.auto_apply_config  # noqa: F401, E402
import models.company  # noqa: F401, E402
import models.document  # noqa: F401, E402
import models.job  # noqa: F401, E402
import models.job_match_score  # noqa: F401, E402
import models.profile  # noqa: F401, E402
import models.subscription  # noqa: F401, E402
import models.user  # noqa: F401, E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_url() -> str:
    from config import get_settings

    return get_settings().database_url


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):  # type: ignore[no-untyped-def]
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    # statement_cache_size=0 required for Supabase pgbouncer (transaction mode)
    engine = create_async_engine(
        get_url(),
        poolclass=None,
        connect_args={"statement_cache_size": 0},
    )
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
