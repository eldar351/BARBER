#!/usr/bin/env python3
import argparse
import json
import sqlite3
from pathlib import Path
from typing import List

from google.oauth2 import service_account
from googleapiclient.discovery import build

DEFAULT_DB = "/root/.openclaw/workspace/BARBER/data/barber.sqlite"
DEFAULT_CREDS = "/root/.openclaw/workspace/secrets/google-service-account.json"
DEFAULT_SHEET_ID = "14LjCPsis2FRqlvObq7Z2WgapNIJy8-cPiAE5YpfCOMs"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
META_SHEET = "_backup_meta"
SKIP_TABLES = {"sqlite_sequence"}


def sqlite_tables(conn: sqlite3.Connection) -> List[str]:
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    return [row[0] for row in cur.fetchall() if row[0] not in SKIP_TABLES]


def fetch_table(conn: sqlite3.Connection, table: str):
    cur = conn.cursor()
    cur.execute(f'SELECT * FROM "{table}"')
    rows = cur.fetchall()
    headers = [d[0] for d in cur.description]
    values = [headers]
    for row in rows:
        values.append(["" if v is None else str(v) for v in row])
    return values


def get_service(creds_path: str):
    creds = service_account.Credentials.from_service_account_file(creds_path, scopes=SCOPES)
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def ensure_sheets(service, spreadsheet_id: str, names: List[str]):
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    existing = {s["properties"]["title"]: s["properties"]["sheetId"] for s in meta.get("sheets", [])}
    requests = []
    for name in names:
        if name not in existing:
            requests.append({"addSheet": {"properties": {"title": name}}})
    if requests:
        service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body={"requests": requests}).execute()


def clear_sheet(service, spreadsheet_id: str, title: str):
    service.spreadsheets().values().clear(spreadsheetId=spreadsheet_id, range=f"'{title}'", body={}).execute()


def write_sheet(service, spreadsheet_id: str, title: str, values):
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f"'{title}'!A1",
        valueInputOption="RAW",
        body={"values": values},
    ).execute()


def main():
    parser = argparse.ArgumentParser(description="Export BARBER sqlite DB to Google Sheets")
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--creds", default=DEFAULT_CREDS)
    parser.add_argument("--sheet-id", default=DEFAULT_SHEET_ID)
    args = parser.parse_args()

    db_path = Path(args.db)
    creds_path = Path(args.creds)
    if not db_path.exists():
        raise SystemExit(f"Database not found: {db_path}")
    if not creds_path.exists():
        raise SystemExit(f"Credentials not found: {creds_path}")

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    tables = sqlite_tables(conn)

    service = get_service(str(creds_path))
    ensure_sheets(service, args.sheet_id, tables + [META_SHEET])

    for table in tables:
        clear_sheet(service, args.sheet_id, table)
        write_sheet(service, args.sheet_id, table, fetch_table(conn, table))

    meta_values = [
        ["key", "value"],
        ["db_path", str(db_path)],
        ["tables", ", ".join(tables)],
        ["table_count", str(len(tables))],
    ]
    clear_sheet(service, args.sheet_id, META_SHEET)
    write_sheet(service, args.sheet_id, META_SHEET, meta_values)

    print(json.dumps({"ok": True, "sheetId": args.sheet_id, "tables": tables}, ensure_ascii=False))


if __name__ == "__main__":
    main()
