#!/usr/bin/env python3
"""
CollegeMate Cutoff PDF Parser
-----------------------------
Extracts college and cutoff data from DTE Maharashtra CAP PDF files using pdfplumber,
normalizes wide tables into rows, and exports them to clean CSV files ready for Supabase.

Requirements:
- pip install pdfplumber

Usage:
  python parse_cutoffs.py
"""

import os
import sys
import re
import csv
import time
import pdfplumber

# Configuration
INPUT_ENGG = "2024ENGG_CAP1_CutOff.pdf"
INPUT_DSE = "DSE_CAP1_CutOff_2025_26.pdf"

OUTPUT_DIR = "output"
OUTPUT_ENGG_CSV = os.path.join(OUTPUT_DIR, "engg_cutoffs.csv")
OUTPUT_DSE_CSV = os.path.join(OUTPUT_DIR, "dse_cutoffs.csv")
ERROR_LOG_PATH = os.path.join(OUTPUT_DIR, "parsing_errors.log")

CSV_HEADERS = [
    "college_code",
    "college_name",
    "branch_name",
    "category",
    "percentile",
    "merit_rank",
    "round",
    "admission_type"
]

def clean_text(val):
    if val is None:
        return ""
    # Remove interior newlines and extra spaces
    return str(val).replace('\n', ' ').replace('\r', ' ').strip()

def get_lines_with_coordinates(page):
    """
    Groups page characters/words into lines based on their vertical (top) coordinate
    with a small tolerance, sorting words horizontally (x0).
    """
    words = page.extract_words()
    lines = {}
    for w in words:
        found = False
        for t in lines:
            if abs(t - w['top']) < 3:  # 3 pt tolerance
                lines[t].append(w)
                found = True
                break
        if not found:
            lines[w['top']] = [w]
            
    sorted_lines = []
    for top in sorted(lines.keys()):
        line_words_sorted = sorted(lines[top], key=lambda x: x['x0'])
        line_text = " ".join([w['text'] for w in line_words_sorted])
        sorted_lines.append((top, line_text))
    return sorted_lines

def log_error(log_file, message):
    log_file.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")

def parse_engg_pdf(pdf_path, log_file):
    """
    Parses the 2024 Engineering CAP1 PDF.
    Returns a list of parsed rows in memory.
    """
    rows_to_write = []
    total_records = 0
    total_errors = 0
    
    current_college_code = "UNKNOWN"
    current_college_name = "UNKNOWN"
    current_branch_name = "UNKNOWN"
    
    # Pre-compile patterns
    col_pattern = re.compile(r'^(\d{4,5})\s*-\s*(.+)$')
    br_pattern = re.compile(r'^(\d{9,10})\s*-\s*(.+)$')
    cutoff_pattern = re.compile(r'(\d+)\s*\(([\d\.]+)\)')
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Parsing Engineering PDF: {pdf_path} ({total_pages} pages)")
        
        for p_idx, page in enumerate(pdf.pages):
            page_num = p_idx + 1
            
            # Print periodic progress
            if page_num % 10 == 0 or page_num == total_pages:
                sys.stdout.write(f"\r  Progress: Page {page_num}/{total_pages} ({int(page_num/total_pages*100)}%) | Records: {total_records} | Errors: {total_errors}...")
                sys.stdout.flush()
                
            # Extract lines and their coordinates
            lines = get_lines_with_coordinates(page)
            
            col_headers = []
            br_headers = []
            
            for top, text in lines:
                text_strip = text.strip()
                col_match = col_pattern.match(text_strip)
                if col_match:
                    col_headers.append((top, col_match.group(1), col_match.group(2).strip()))
                    continue
                    
                br_match = br_pattern.match(text_strip)
                if br_match:
                    br_headers.append((top, br_match.group(1), br_match.group(2).strip()))
            
            tables = page.find_tables()
            
            for t_idx, table in enumerate(tables):
                table_top = table.bbox[1]
                
                # Find closest branch header above table on this page
                matching_br = None
                best_br_top = -1
                for top, code, name in br_headers:
                    if top < table_top and top > best_br_top:
                        matching_br = (code, name)
                        best_br_top = top
                        
                if matching_br:
                    current_branch_name = matching_br[1]
                
                # Find closest college header above the branch header on this page
                ref_top = best_br_top if best_br_top != -1 else table_top
                matching_col = None
                best_col_top = -1
                for top, code, name in col_headers:
                    if top < ref_top and top > best_col_top:
                        matching_col = (code, name)
                        best_col_top = top
                        
                if matching_col:
                    current_college_code = matching_col[0]
                    current_college_name = matching_col[1]
                
                # Extract cell text
                table_data = table.extract()
                if not table_data or len(table_data) < 2:
                    continue
                    
                # Standardize headers (Category names)
                headers = [clean_text(h) for h in table_data[0]]
                value_rows = table_data[1:]
                
                for r_idx, row in enumerate(value_rows):
                    stage = clean_text(row[0])
                    # Ensure it's a stage row (usually 'I', 'II', etc.)
                    if not stage or stage.strip() in ['', None]:
                        continue
                        
                    for c_idx in range(1, len(row)):
                        if c_idx >= len(headers):
                            continue
                        category = headers[c_idx]
                        if not category:
                            continue
                            
                        cell_val = clean_text(row[c_idx])
                        if not cell_val:
                            continue  # Ignore blank cells
                            
                        # Parse rank and percentile: "34240 (88.5013511)"
                        match = cutoff_pattern.search(cell_val)
                        if match:
                            rank = match.group(1)
                            percentile = match.group(2)
                            
                            rows_to_write.append([
                                current_college_code,
                                current_college_name,
                                current_branch_name,
                                category,
                                percentile,
                                rank,
                                "CAP1",
                                "FIRST_YEAR_ENGINEERING"
                            ])
                            total_records += 1
                        else:
                            total_errors += 1
                            log_error(log_file, f"[ENGG] Page {page_num} Table {t_idx+1} Row {r_idx+1} Col {c_idx}: "
                                                 f"Skipping invalid cutoff '{cell_val}' for category '{category}' in "
                                                 f"College '{current_college_code}' Branch '{current_branch_name}'")
                                                 
        print(f"\n  Done parsing Engineering PDF. Total Records: {total_records}, Errors/Warnings: {total_errors}")
        return rows_to_write, total_records, total_errors, total_pages

def parse_dse_pdf(pdf_path, log_file):
    """
    Parses the DSE CAP1 Cutoff PDF.
    Returns a list of parsed rows in memory.
    """
    rows_to_write = []
    total_records = 0
    total_errors = 0
    
    current_college_code = "UNKNOWN"
    current_college_name = "UNKNOWN"
    current_branch_name = "UNKNOWN"
    
    cutoff_pattern = re.compile(r'(\d+)\s*\(([\d\.]+)\%?\)')
    col_pattern = re.compile(r'^(\d{4})\s+(.+)$')
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Parsing DSE PDF: {pdf_path} ({total_pages} pages)")
        
        for p_idx, page in enumerate(pdf.pages):
            page_num = p_idx + 1
            
            # Print periodic progress
            if page_num % 10 == 0 or page_num == total_pages:
                sys.stdout.write(f"\r  Progress: Page {page_num}/{total_pages} ({int(page_num/total_pages*100)}%) | Records: {total_records} | Errors: {total_errors}...")
                sys.stdout.flush()
                
            tables = page.extract_tables()
            
            for t_idx, table in enumerate(tables):
                if not table or len(table) < 2:
                    continue
                
                # Case 1: Info Table containing College Code/Name, Choice Code/Branch Name
                if len(table[0]) >= 1 and table[1][0] == 'Choice Code :':
                    college_cell = clean_text(table[0][0])
                    match_col = col_pattern.match(college_cell)
                    if match_col:
                        current_college_code = match_col.group(1)
                        current_college_name = match_col.group(2).strip()
                    else:
                        # Fallback parsing
                        parts = college_cell.split(maxsplit=1)
                        if parts and parts[0].isdigit():
                            current_college_code = parts[0]
                            current_college_name = parts[1].strip()
                        else:
                            current_college_code = "UNKNOWN"
                            current_college_name = college_cell
                            
                    current_branch_name = clean_text(table[1][3])
                    continue
                
                # Case 2: Cutoff Table containing Categories and Cutoffs
                headers = [clean_text(h) for h in table[0]]
                
                # Validate if it matches standard categories (at least one check)
                is_cutoff_table = any(h in ['GOPEN', 'LOPEN', 'GSC', 'LSC', 'GST', 'GOBC', 'EWS', 'GOPENS', 'LOPENS'] for h in headers)
                
                if is_cutoff_table:
                    value_rows = table[1:]
                    for r_idx, row in enumerate(value_rows):
                        stage = clean_text(row[0])
                        # Make sure row starts with a stage designator
                        if not stage or stage.strip() in ['', None]:
                            continue
                            
                        for c_idx in range(1, len(row)):
                            if c_idx >= len(headers):
                                continue
                            category = headers[c_idx]
                            if not category:
                                continue
                                
                            cell_val = clean_text(row[c_idx])
                            if not cell_val:
                                continue  # Ignore blank cells
                                
                            # Parse rank and percentile: "1282 (92.74%)"
                            match = cutoff_pattern.search(cell_val)
                            if match:
                                rank = match.group(1)
                                percentile = match.group(2)
                                
                                rows_to_write.append([
                                    current_college_code,
                                    current_college_name,
                                    current_branch_name,
                                    category,
                                    percentile,
                                    rank,
                                    "CAP1",
                                    "DIRECT_SECOND_YEAR_ENGINEERING"
                                ])
                                total_records += 1
                            else:
                                total_errors += 1
                                log_error(log_file, f"[DSE] Page {page_num} Table {t_idx+1} Row {r_idx+1} Col {c_idx}: "
                                                     f"Skipping invalid cutoff '{cell_val}' for category '{category}' in "
                                                     f"College '{current_college_code}' Branch '{current_branch_name}'")
                else:
                    total_errors += 1
                    log_error(log_file, f"[DSE] Page {page_num} Table {t_idx+1}: Unrecognized table layout with headers: {headers}")
                    
        print(f"\n  Done parsing DSE PDF. Total Records: {total_records}, Errors/Warnings: {total_errors}")
        return rows_to_write, total_records, total_errors, total_pages

def main():
    start_time = time.time()
    
    # Verify inputs
    if not os.path.exists(INPUT_ENGG):
        print(f"Error: Required PDF file '{INPUT_ENGG}' is missing from the directory.")
        sys.exit(1)
    if not os.path.exists(INPUT_DSE):
        print(f"Error: Required PDF file '{INPUT_DSE}' is missing from the directory.")
        sys.exit(1)
        
    # Setup outputs
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("====================================================")
    print("      COLLEGEMATE STANDALONE CUTOFF PDF PARSER      ")
    print("====================================================")
    
    with open(ERROR_LOG_PATH, "w", encoding="utf-8") as log_file:
        log_file.write(f"--- CollegeMate PDF Parser Execution Log started at {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n\n")
        
        # 1. Process 2024ENGG_CAP1_CutOff.pdf into memory
        engg_rows, engg_recs, engg_errs, engg_pages = parse_engg_pdf(INPUT_ENGG, log_file)
        
        # Write ENGG CSV in a single quick operation
        print(f"Writing to CSV: {OUTPUT_ENGG_CSV}...")
        with open(OUTPUT_ENGG_CSV, "w", newline="", encoding="utf-8") as engg_csv:
            engg_writer = csv.writer(engg_csv)
            engg_writer.writerow(CSV_HEADERS)
            engg_writer.writerows(engg_rows)
            
        print("----------------------------------------------------")
        
        # 2. Process DSE_CAP1_CutOff_2025_26.pdf into memory
        dse_rows, dse_recs, dse_errs, dse_pages = parse_dse_pdf(INPUT_DSE, log_file)
        
        # Write DSE CSV in a single quick operation
        print(f"Writing to CSV: {OUTPUT_DSE_CSV}...")
        with open(OUTPUT_DSE_CSV, "w", newline="", encoding="utf-8") as dse_csv:
            dse_writer = csv.writer(dse_csv)
            dse_writer.writerow(CSV_HEADERS)
            dse_writer.writerows(dse_rows)
            
    # Calculate execution time
    duration = time.time() - start_time
    total_records = engg_recs + dse_recs
    total_errors = engg_errs + dse_errs
    total_pages = engg_pages + dse_pages
    overall_speed = int(total_records / (duration or 0.1))
    
    # Print Statistics
    print("====================================================")
    print("                 IMPORT STATISTICS                  ")
    print("====================================================")
    print(f"Total Processing Duration : {duration:.2f} seconds")
    print(f"Total Pages Parsed        : {total_pages} pages")
    print(f"Total Extracted Records   : {total_records} rows")
    print(f"  - Engineering (ENGG)    : {engg_recs} rows")
    print(f"  - Direct Second Year    : {dse_recs} rows")
    print(f"Total Skipped/Errors      : {total_errors}")
    print(f"Extraction Speed          : {overall_speed} rows/second")
    print(f"Generated CSVs            : {OUTPUT_ENGG_CSV}")
    print(f"                            {OUTPUT_DSE_CSV}")
    print(f"Parsing Error Log Saved   : {ERROR_LOG_PATH}")
    print("====================================================")
    print("Data files are successfully formatted and ready for Supabase.")

if __name__ == "__main__":
    main()
