# pyrefly: ignore [missing-import]
import asyncpg
import asyncio

passwords_to_try = ['postgres', 'password', 'root', 'admin', 'CivixSecure2026!', 'CivixPass123!@#', 'abhyu', '']

async def test_pass():
    for p in passwords_to_try:
        try:
            conn = await asyncpg.connect(user='postgres', password=p, database='postgres', host='127.0.0.1', port=5432, timeout=2)
            print(f'SUCCESS: Password is: "{p}"')
            await conn.close()
            return p
        except asyncpg.exceptions.InvalidPasswordError:
            print(f'Failed password: "{p}"')
        except Exception as e:
            print(f'Error with "{p}": {e}')
    print("Could not connect with common passwords.")
    return None

if __name__ == "__main__":
    asyncio.run(test_pass())
