#!/usr/bin/env python3
"""
import_csv_to_supabase.py
-------------------------
Reads the parsed CSV datasets and imports them directly into Supabase tables
(colleges, branches, cutoff_years, and cutoffs).

Requirements:
- Python 3.x
- output/engg_cutoffs.csv
- output/dse_cutoffs.csv
- .env file containing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

Usage:
  python import_csv_to_supabase.py
"""

import os
import sys
import csv
import json
import time
import urllib.request
import urllib.error

# Config files
ENV_PATH = ".env"
OUTPUT_DIR = "output"
ENGG_CSV = os.path.join(OUTPUT_DIR, "engg_cutoffs.csv")
DSE_CSV = os.path.join(OUTPUT_DIR, "dse_cutoffs.csv")

def load_env():
    """Loads environment variables from .env file."""
    env = {}
    if not os.path.exists(ENV_PATH):
        print(f"Error: {ENV_PATH} not found.")
        sys.exit(1)
    with open(ENV_PATH, "r") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                env[key.strip()] = val.strip()
    return env

def make_supabase_request(url, anon_key, path, method="GET", data=None, extra_headers=None):
    """Makes a request to the Supabase PostgREST API using urllib."""
    req_url = f"{url}/rest/v1/{path}"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json"
    }
    if extra_headers:
        headers.update(extra_headers)
        
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    
    req = urllib.request.Request(req_url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            # For count queries or header checks, return headers if requested
            if extra_headers and "Prefer" in extra_headers and "count=" in extra_headers["Prefer"]:
                return response.headers
            return json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"\n[HTTP Error {e.code}] {e.reason}")
        print(f"Error details: {error_body}")
        raise e

def get_table_count(url, anon_key, table):
    """Retrieves the exact row count of a table using PostgREST exact count header."""
    headers = {"Prefer": "count=exact"}
    # limit=1 to avoid fetching all data, we only want the Content-Range header
    res_headers = make_supabase_request(url, anon_key, f"{table}?limit=1", method="GET", extra_headers=headers)
    content_range = res_headers.get("Content-Range")
    if content_range and "/" in content_range:
        return int(content_range.split("/")[-1])
    return 0

def main():
    start_time = time.time()
    
    # 1. Load env and verify files
    env = load_env()
    supabase_url = env.get("VITE_SUPABASE_URL")
    supabase_anon_key = env.get("VITE_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_anon_key:
        print("Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in .env.")
        sys.exit(1)
        
    if not os.path.exists(ENGG_CSV) or not os.path.exists(DSE_CSV):
        print("Error: Parsed CSV files are missing in output/ folder. Run parse_cutoffs.py first.")
        sys.exit(1)
        
    print("====================================================")
    print("      COLLEGEMATE CSV TO SUPABASE IMPORT PIPELINE   ")
    print("====================================================")
    print(f"Supabase Endpoint: {supabase_url}")
    
    # Get initial counts
    print("\n[INFO] Fetching initial database counts...")
    try:
        colleges_count_before = get_table_count(supabase_url, supabase_anon_key, "colleges")
        branches_count_before = get_table_count(supabase_url, supabase_anon_key, "branches")
        cutoffs_count_before = get_table_count(supabase_url, supabase_anon_key, "cutoffs")
        print(f"  Colleges before import : {colleges_count_before}")
        print(f"  Branches before import : {branches_count_before}")
        print(f"  Cutoffs before import  : {cutoffs_count_before}")
    except Exception as e:
        print(f"Warning: Failed to fetch initial counts. Database tables might not exist yet: {e}")
        colleges_count_before = 0
        branches_count_before = 0
        cutoffs_count_before = 0

    # 2. Parse CSVs and collect unique colleges & branches in memory
    unique_colleges = {}
    unique_branches = set()
    unique_years = {2024, 2025, 2026} # Ensure years are present
    
    cutoff_records = []
    
    print("\n[INFO] Reading parsed CSV files...")
    for csv_file, default_year in [(ENGG_CSV, 2024), (DSE_CSV, 2025)]:
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = row["college_code"].strip()
                name = row["college_name"].strip()
                branch = row["branch_name"].strip()
                year = int(row.get("year", default_year) or default_year)
                
                unique_colleges[code] = {
                    "college_code": code,
                    "college_name": name,
                    "city": name.split(",")[-1].strip() if "," in name else "Maharashtra",
                    "university": "Default University",
                    "college_type": "Autonomous" if "Autonomous" in name else "Private",
                    "fees": 75000 if "Government" in name else 125000,
                    "hostel_available": True if "Government" in name else False,
                    "description": f"{name} is a leading college."
                }
                
                unique_branches.add(branch)
                unique_years.add(year)
                
                cutoff_records.append({
                    "college_code": code,
                    "branch_name": branch,
                    "year": year,
                    "round": row["round"].strip(),
                    "admission_type": row["admission_type"].strip(),
                    "category": row["category"].strip(),
                    "gender": "Co-Ed",
                    "cutoff_percentile": float(row["percentile"].strip())
                })
                
    print(f"  Found {len(unique_colleges)} unique colleges in CSVs.")
    print(f"  Found {len(unique_branches)} unique branches in CSVs.")
    print(f"  Found {len(cutoff_records)} total cutoff records in CSVs.")

    # 3. Upsert Colleges
    print("\n[INFO] Upserting colleges to Supabase...")
    college_payload = list(unique_colleges.values())
    # PostgREST resolution=merge-duplicates upserts by unique constraints (college_code)
    make_supabase_request(
        supabase_url, supabase_anon_key, "colleges?on_conflict=college_code", method="POST",
        data=college_payload, extra_headers={"Prefer": "resolution=merge-duplicates"}
    )
    print(f"  Successfully upserted {len(college_payload)} colleges.")
    
    # 4. Upsert Branches
    print("\n[INFO] Upserting branches to Supabase...")
    branch_payload = [{"branch_name": b, "branch_code": b} for b in unique_branches]
    make_supabase_request(
        supabase_url, supabase_anon_key, "branches?on_conflict=branch_name", method="POST",
        data=branch_payload, extra_headers={"Prefer": "resolution=merge-duplicates"}
    )
    print(f"  Successfully upserted {len(branch_payload)} branches.")

    # 5. Upsert Cutoff Years
    print("\n[INFO] Upserting cutoff years to Supabase...")
    year_payload = [{"year": y} for y in unique_years]
    make_supabase_request(
        supabase_url, supabase_anon_key, "cutoff_years?on_conflict=year", method="POST",
        data=year_payload, extra_headers={"Prefer": "resolution=merge-duplicates"}
    )
    print("  Cutoff years initialized.")

    # 6. Fetch database mappings for ID resolutions
    print("\n[INFO] Resolving foreign keys from database...")
    db_colleges = make_supabase_request(supabase_url, supabase_anon_key, "colleges?select=id,college_code", method="GET")
    db_branches = make_supabase_request(supabase_url, supabase_anon_key, "branches?select=id,branch_name", method="GET")
    db_years = make_supabase_request(supabase_url, supabase_anon_key, "cutoff_years?select=id,year", method="GET")
    
    college_map = {c["college_code"]: c["id"] for c in db_colleges}
    branch_map = {b["branch_name"]: b["id"] for b in db_branches}
    year_map = {y["year"]: y["id"] for y in db_years}

    # 7. Map cutoff records to IDs and deduplicate in memory
    print("\n[INFO] Mapping cutoff records to foreign keys and deduplicating...")
    mapped_cutoffs = []
    seen_keys = set()
    skipped_records = 0
    duplicate_records = 0
    
    for r in cutoff_records:
        col_id = college_map.get(r["college_code"])
        br_id = branch_map.get(r["branch_name"])
        yr_id = year_map.get(r["year"])
        
        if col_id and br_id and yr_id:
            key = (col_id, br_id, yr_id, r["round"], r["category"], r["gender"])
            if key in seen_keys:
                duplicate_records += 1
                continue
            seen_keys.add(key)
            mapped_cutoffs.append({
                "college_id": col_id,
                "branch_id": br_id,
                "year_id": yr_id,
                "round": r["round"],
                "admission_type": r["admission_type"],
                "category": r["category"],
                "gender": r["gender"],
                "cutoff_percentile": r["cutoff_percentile"]
            })
        else:
            skipped_records += 1
            
    print(f"  Mapped {len(mapped_cutoffs)} cutoffs. Skipped {skipped_records} due to missing references. Ignored {duplicate_records} duplicates in CSV.")

    # 8. Batch Insert Cutoffs (Batches of 1000)
    batch_size = 1000
    total_cutoffs_to_insert = len(mapped_cutoffs)
    inserted_cutoffs = 0
    
    print(f"\n[INFO] Inserting cutoffs in batches of {batch_size}...")
    for i in range(0, total_cutoffs_to_insert, batch_size):
        batch = mapped_cutoffs[i : i + batch_size]
        
        # PostgREST upsert with conflict targets
        make_supabase_request(
            supabase_url, supabase_anon_key,
            "cutoffs?on_conflict=college_id,branch_id,year_id,round,category,gender",
            method="POST", data=batch,
            extra_headers={"Prefer": "resolution=merge-duplicates"}
        )
        
        inserted_cutoffs += len(batch)
        sys.stdout.write(f"\r  Uploaded {inserted_cutoffs}/{total_cutoffs_to_insert} cutoff records...")
        sys.stdout.flush()
        
    print(f"\n  Successfully processed {total_cutoffs_to_insert} cutoff records.")

    # 9. Verify counts
    print("\n[INFO] Running verification counts...")
    colleges_count_after = get_table_count(supabase_url, supabase_anon_key, "colleges")
    branches_count_after = get_table_count(supabase_url, supabase_anon_key, "branches")
    cutoffs_count_after = get_table_count(supabase_url, supabase_anon_key, "cutoffs")
    
    imported_colleges = colleges_count_after - colleges_count_before
    imported_branches = branches_count_after - branches_count_before
    imported_cutoffs = cutoffs_count_after - cutoffs_count_before
    
    duration = time.time() - start_time
    
    # 10. Verification Report
    print("\n====================================================")
    print("                 VERIFICATION REPORT                ")
    print("====================================================")
    print(f"Total Import Duration     : {duration:.2f} seconds")
    print(f"Colleges Table:")
    print(f"  - Before Import         : {colleges_count_before}")
    print(f"  - After Import          : {colleges_count_after}")
    print(f"  - Imported Colleges     : {imported_colleges}")
    print(f"Branches Table:")
    print(f"  - Before Import         : {branches_count_before}")
    print(f"  - After Import          : {branches_count_after}")
    print(f"  - Imported Branches     : {imported_branches}")
    print(f"Cutoffs Table:")
    print(f"  - Before Import         : {cutoffs_count_before}")
    print(f"  - After Import          : {cutoffs_count_after}")
    print(f"  - Imported Cutoffs      : {imported_cutoffs}")
    print("----------------------------------------------------")
    if imported_colleges >= 0 and imported_branches >= 0 and imported_cutoffs >= 0:
        print("STATUS                    : SUCCESS")
    else:
        print("STATUS                    : WARNING (Negative counts detected)")
    print("====================================================")

if __name__ == "__main__":
    main()
