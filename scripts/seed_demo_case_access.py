import psycopg2
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def seed_demo_case_access():
    print("==========================================================")
    print("SEEDING DEMO CASE ACCESS FOR ADMIN USER")
    print("==========================================================")
    
    from civix_api.config import settings
    sync_dsn = settings.civix_database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg2.connect(sync_dsn)
    cur = conn.cursor()
    
    admin_user_id = "00000000-0000-0000-0000-000000000001"
    
    # Grant ADMIN case access for all 250 cases
    cur.execute("""
        INSERT INTO civix.case_access (access_id, case_id, user_id, permission_level, granted_by)
        SELECT 
            gen_random_uuid(),
            case_id,
            %s::uuid,
            'ADMIN',
            %s::uuid
        FROM civix.investigative_case
        ON CONFLICT DO NOTHING;
    """, (admin_user_id, admin_user_id))
    
    conn.commit()
    
    cur.execute("SELECT count(*) FROM civix.case_access WHERE user_id = %s::uuid;", (admin_user_id,))
    cnt = cur.fetchone()[0]
    print(f"[PASS] Granted ADMIN access for {cnt} cases to user {admin_user_id}")
    
    conn.close()

if __name__ == "__main__":
    seed_demo_case_access()
