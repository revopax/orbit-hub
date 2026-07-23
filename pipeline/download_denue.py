# ============================================================
# Descarga denue_nacional.parquet desde Google Drive
# ============================================================
import os
import sys
import json
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io

DRIVE_FOLDER_ID = "1D8bkumY6L9SAc-QiTk3RQngm-xgochJJ"
DENUE_FILENAME  = "denue_nacional.parquet"
OUTPUT_PATH     = "data/denue_nacional.parquet"

def get_drive_service():
    scopes = ["https://www.googleapis.com/auth/drive.readonly"]
    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
        creds = Credentials.from_service_account_info(info, scopes=scopes)
    else:
        cred_path = os.path.join(os.path.dirname(__file__), "credentials.json")
        creds = Credentials.from_service_account_file(cred_path, scopes=scopes)
    return build("drive", "v3", credentials=creds)

def download_denue():
    os.makedirs("data", exist_ok=True)

    if os.path.exists(OUTPUT_PATH):
        print(f"✅ {DENUE_FILENAME} ya existe localmente, saltando descarga")
        return

    print(f"📥 Descargando {DENUE_FILENAME} desde Drive…")
    service = get_drive_service()

    results = service.files().list(
        q=f"name='{DENUE_FILENAME}' and '{DRIVE_FOLDER_ID}' in parents",
        fields="files(id, name, size)"
    ).execute()

    files = results.get("files", [])
    if not files:
        print("❌ No se encontró denue_nacional.parquet en Drive")
        sys.exit(1)

    file_id = files[0]["id"]
    size_mb = int(files[0].get("size", 0)) / 1024 / 1024
    print(f"   Encontrado: {files[0]['name']} ({size_mb:.1f} MB)")

    request = service.files().get_media(fileId=file_id)
    fh = io.FileIO(OUTPUT_PATH, mode='wb')
    downloader = MediaIoBaseDownload(fh, request, chunksize=10*1024*1024)

    done = False
    while not done:
        status, done = downloader.next_chunk()
        print(f"   Descargando… {int(status.progress() * 100)}%")

    print(f"✅ Guardado en {OUTPUT_PATH}")

if __name__ == "__main__":
    download_denue()