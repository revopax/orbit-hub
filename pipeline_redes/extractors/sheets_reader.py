import gspread
import pandas as pd
from google.oauth2.service_account import Credentials
import os, json

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
]

def get_client():
    # Intenta con archivo local primero, luego con variable de entorno (GitHub Actions)
    creds_file = os.path.join(os.path.dirname(__file__), '..', 'service_account.json')
    if os.path.exists(creds_file):
        creds = Credentials.from_service_account_file(creds_file, scopes=SCOPES)
    elif os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON'):
        info = json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_JSON'])
        creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    else:
        raise RuntimeError("No se encontró service_account.json ni variable GOOGLE_SERVICE_ACCOUNT_JSON")
    return gspread.authorize(creds)

def read_sheet(sheet_id: str, tab_name: str) -> pd.DataFrame:
    client = get_client()
    ws = client.open_by_key(sheet_id).worksheet(tab_name)
    data = ws.get_all_records()
    return pd.DataFrame(data)
