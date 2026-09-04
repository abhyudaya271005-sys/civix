import os
import sys
import uuid
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import psycopg
from civix_api.config import settings

def seed_all_cases_spatial():
    print("==========================================================================")
    print("  CIVIX 2.0 — SEEDING SPATIAL INTELLIGENCE DATA FOR ALL CASES")
    print("==========================================================================")

    sync_dsn = settings.civix_database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = psycopg.connect(sync_dsn, autocommit=True)
    cur = conn.cursor()

    # 1. Generation Run
    gen_run_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, "civix.generation.all_cases_spatial"))
    cur.execute("SELECT run_id FROM civix.generation_run WHERE run_id = %s;", (gen_run_id,))
    if not cur.fetchone():
        cur.execute("""
            INSERT INTO civix.generation_run (run_id, generator_version, started_at, finished_at)
            VALUES (%s, '1.0.0-spatial-all-cases', now(), now())
            ON CONFLICT (run_id) DO NOTHING;
        """, (gen_run_id,))
    print(f"[PASS] Generation run ID: {gen_run_id}")

    # 2. Canonical Delhi NCR Locations
    # Load provenance locations
    with open("data/spatial_location_provenance.json", "r") as f:
        prov_data = json.load(f)
    raw_locations = prov_data["locations"]

    location_map = {} # code -> uuid

    for loc in raw_locations:
        code = loc["logical_location_id"]
        name = loc["location_name"]
        ltype = loc["location_type"]
        coords = loc["coordinates"]
        loc_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"civix.location.{code}"))
        location_map[code] = loc_uuid

        cur.execute("""
            INSERT INTO civix.entity (entity_id, entity_type, visibility_status)
            VALUES (%s, 'LOCATION', 'ACTIVE')
            ON CONFLICT (entity_id) DO NOTHING;
        """, (loc_uuid,))

        if ltype == "ROUTE_LINESTRING":
            start_lon = coords["start"]["longitude"]
            start_lat = coords["start"]["latitude"]
            end_lon = coords["end"]["longitude"]
            end_lat = coords["end"]["latitude"]
            cur.execute("""
                INSERT INTO civix.location (entity_id, location_name, location_type, geometry)
                VALUES (%s, %s, %s, ST_SetSRID(ST_MakeLine(ST_MakePoint(%s, %s), ST_MakePoint(%s, %s)), 4326))
                ON CONFLICT (entity_id) DO UPDATE SET location_name = EXCLUDED.location_name;
            """, (loc_uuid, name, ltype, start_lon, start_lat, end_lon, end_lat))
        else:
            lat = coords["latitude"]
            lon = coords["longitude"]
            cur.execute("""
                INSERT INTO civix.location (entity_id, location_name, location_type, geometry)
                VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
                ON CONFLICT (entity_id) DO UPDATE SET location_name = EXCLUDED.location_name;
            """, (loc_uuid, name, ltype, lon, lat))

    # Additional NCR Landmark locations
    additional_locations = [
        ("LOC_PATIALA_HOUSE", "Patiala House Courts Complex, New Delhi", "EXACT_POINT", 77.2346, 28.6163),
        ("LOC_SAKET_COURTS", "Saket District Centre & Courts, South Delhi", "EXACT_POINT", 77.2173, 28.5222),
        ("LOC_TIS_HAZARI", "Tis Hazari Courts Complex, Central Delhi", "EXACT_POINT", 77.2187, 28.6685),
        ("LOC_ROHINI_COURTS", "Rohini District Courts, North West Delhi", "EXACT_POINT", 77.1194, 28.7156),
        ("LOC_DELHI_POLICE_HQ", "Delhi Police Headquarters, Jai Singh Road", "EXACT_POINT", 77.2155, 28.6282),
        ("LOC_IGI_AIRPORT", "Indira Gandhi International Airport Cargo Terminal", "EXACT_POINT", 77.0999, 28.5562),
        ("LOC_ANAND_VIHAR", "Anand Vihar Transit Terminal, East Delhi", "EXACT_POINT", 77.3152, 28.6508),
        ("LOC_LAJPAT_NAGAR", "Lajpat Nagar Central Market", "EXACT_POINT", 77.2430, 28.5677),
    ]

    for code, name, ltype, lon, lat in additional_locations:
        loc_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"civix.location.{code}"))
        location_map[code] = loc_uuid

        cur.execute("""
            INSERT INTO civix.entity (entity_id, entity_type, visibility_status)
            VALUES (%s, 'LOCATION', 'ACTIVE')
            ON CONFLICT (entity_id) DO NOTHING;
        """, (loc_uuid,))

        cur.execute("""
            INSERT INTO civix.location (entity_id, location_name, location_type, geometry)
            VALUES (%s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
            ON CONFLICT (entity_id) DO UPDATE SET location_name = EXCLUDED.location_name;
        """, (loc_uuid, name, ltype, lon, lat))

    print(f"[PASS] Successfully registered {len(location_map)} canonical Delhi NCR locations in PostGIS.")

    # 3. Fetch all cases
    cur.execute("SELECT case_id, case_number, title FROM civix.investigative_case ORDER BY opened_at ASC NULLS LAST;")
    all_cases = cur.fetchall()
    print(f"[INFO] Found {len(all_cases)} cases in civix.investigative_case.")

    # Available location codes pool
    loc_pool = list(location_map.keys())

    # Seed events for cases that don't have event_locations
    seeded_count = 0
    event_count_total = 0

    for idx, (cid, cnum, title) in enumerate(all_cases):
        case_id_str = str(cid)

        # Check existing event_locations for this case
        cur.execute("SELECT count(*) FROM civix.event_location WHERE case_id = %s;", (case_id_str,))
        existing_el = cur.fetchone()[0]
        if existing_el > 0:
            print(f"  - Case {cnum} ({title[:30]}...): Already has {existing_el} spatial events. Preserving.")
            event_count_total += existing_el
            continue

        # Assign 1 to 2 distinct locations from the NCR pool
        loc_code1 = loc_pool[idx % len(loc_pool)]
        loc_code2 = loc_pool[(idx + 7) % len(loc_pool)]
        
        assigned = [(loc_code1, "MEETING", "PRESENT_AT", "CONFIRMED", "2026-03-01 10:00:00+05:30", "2026-03-01 11:30:00+05:30")]
        if idx % 2 == 0:
            assigned.append((loc_code2, "SURVEILLANCE_OBSERVATION", "LOCATED_AT", "PROBABLE", "2026-03-05 14:00:00+05:30", "2026-03-05 16:00:00+05:30"))

        for ev_idx, (lcode, etype, pred, epistemic, st_str, et_str) in enumerate(assigned):
            ev_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"civix.event.{case_id_str}.{ev_idx}"))
            el_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"civix.event_location.{case_id_str}.{ev_idx}"))
            loc_uuid = location_map[lcode]

            cur.execute("""
                INSERT INTO civix.event (event_id, event_type, occurred_at, generation_run_id)
                VALUES (%s, %s, TSTZRANGE(%s::timestamptz, %s::timestamptz, '[)'), %s)
                ON CONFLICT (event_id) DO NOTHING;
            """, (ev_id, etype, st_str, et_str, gen_run_id))

            cur.execute("""
                INSERT INTO civix.event_location (
                    event_location_id, event_id, location_id, location_predicate, epistemic_status, case_id, generation_run_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (event_location_id) DO NOTHING;
            """, (el_id, ev_id, loc_uuid, pred, epistemic, case_id_str, gen_run_id))

            event_count_total += 1

        seeded_count += 1
        print(f"  + Case {cnum}: Seeded {len(assigned)} spatial events at [{loc_code1}{', ' + loc_code2 if len(assigned) > 1 else ''}].")

    print(f"\n[PASS] Seeding completed: {seeded_count} cases updated with spatial events. Total spatial events across all cases: {event_count_total}")
    conn.close()

if __name__ == "__main__":
    seed_all_cases_spatial()
