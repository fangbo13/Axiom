import requests
import json

BASE = "http://localhost:8000"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzgwNDk4MDY1LCJpYXQiOjE3ODA0OTQ0NjUsImp0aSI6ImE3NmNlZjc3ZDFmZDRkNWFiYjI3OWJjMWM2YWFiNTkwIiwidXNlcl9pZCI6IjIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaXNfYWRtaW4iOmZhbHNlfQ.LpvkFFdXyJjwCZatl5LmC7JBMKc1bKQogFffxiQ8wxk"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Create project
project_data = {
    "name": "2024年度审计",
    "client_name": "测试公司",
    "fiscal_year_end": "2024-12-31"
}
r = requests.post(f"{BASE}/api/projects/", headers=headers, json=project_data)
print("Project create:", r.status_code, r.json())

if r.status_code == 201:
    project_id = r.json()["id"]

    # Upload ledger
    with open("test_ledger.csv", "rb") as f:
        files = {"file": ("test_ledger.csv", f, "text/csv")}
        r2 = requests.post(f"{BASE}/api/projects/{project_id}/ledger/upload/", headers={"Authorization": f"Bearer {TOKEN}"}, files=files)
    print("Ledger upload:", r2.status_code, r2.json())

    # Get entries
    r3 = requests.get(f"{BASE}/api/projects/{project_id}/ledger/entries/", headers=headers)
    print("Entries:", r3.status_code, len(r3.json().get("results", [])))

    # Get overview
    r4 = requests.get(f"{BASE}/api/projects/{project_id}/overview/", headers=headers)
    print("Overview:", r4.status_code, r4.json())

    # A300 checks
    r5 = requests.get(f"{BASE}/api/projects/{project_id}/a300/checks/", headers=headers)
    print("A300:", r5.status_code, r5.json())
