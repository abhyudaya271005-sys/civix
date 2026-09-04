# pyrefly: ignore [missing-import]
import asyncpg
import asyncio

async def run():
    conn = await asyncpg.connect('postgresql://postgres:Abhyuisgoingtobe18$@localhost:5432/civix_demo')
    try:
        await conn.execute('CREATE EXTENSION IF NOT EXISTS postgis;')
        print('PostGIS extension installed successfully!')
    except Exception as e:
        print('PostGIS installation note:', e)

    try:
        await conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        await conn.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto;')
        await conn.execute('CREATE EXTENSION IF NOT EXISTS btree_gist;')
        print('Core extensions (uuid-ossp, pgcrypto, btree_gist) installed successfully!')
    except Exception as e:
        print('Core extensions error:', e)

    exts = await conn.fetch("SELECT extname FROM pg_extension;")
    print("Installed extensions:", [r['extname'] for r in exts])
    await conn.close()

if __name__ == "__main__":
    asyncio.run(run())
