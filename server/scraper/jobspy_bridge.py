#!/usr/bin/env python3
"""
JobSpy bridge — scrapes LinkedIn, Indeed, Glassdoor, ZipRecruiter via JobSpy.
Called from Node.js via child_process.spawn.
Outputs NDJSON (one JSON object per line) to stdout.
"""

import sys
import json

def main():
    try:
        from jobspy import scrape_jobs
    except ImportError:
        sys.stderr.write("jobspy not installed. Run: pip install python-jobspy\n")
        sys.exit(1)

    site_name = sys.argv[1] if len(sys.argv) > 1 else "linkedin"
    search_term = sys.argv[2] if len(sys.argv) > 2 else "software engineer"
    location = sys.argv[3] if len(sys.argv) > 3 else "London, UK"
    results_wanted = int(sys.argv[4]) if len(sys.argv) > 4 else 50

    try:
        jobs = scrape_jobs(
            site_name=[site_name],
            search_term=search_term,
            location=location,
            results_wanted=results_wanted,
            country_indeed="UK",
            linkedin_fetch_description=False,
        )

        for _, row in jobs.iterrows():
            record = {
                "title": str(row.get("title", "") or ""),
                "company": str(row.get("company", "") or ""),
                "location": str(row.get("location", "") or ""),
                "job_url": str(row.get("job_url", "") or ""),
                "description": str(row.get("description", "") or "")[:3000],
                "date_posted": str(row.get("date_posted", "") or ""),
                "salary_source": str(row.get("salary_source", "") or ""),
                "min_amount": float(row["min_amount"]) if row.get("min_amount") is not None else None,
                "max_amount": float(row["max_amount"]) if row.get("max_amount") is not None else None,
                "currency": str(row.get("currency", "GBP") or "GBP"),
                "is_remote": bool(row.get("is_remote", False)),
                "source": site_name,
            }
            print(json.dumps(record), flush=True)
    except Exception as e:
        sys.stderr.write(f"JobSpy error: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
