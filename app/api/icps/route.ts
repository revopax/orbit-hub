import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SHEET_ID = '1kkvotQvqpyxkXzAstBDVOPJOMpIfSj1TamMu29if9eg';
const WORKSHEET_NAME = 'ICPs';

async function getSheetsClient() {
  const credsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credsJson) throw new Error('GOOGLE_SHEETS_CREDENTIALS no configurada');
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credsJson),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const udn = searchParams.get('udn');

    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${WORKSHEET_NAME}!A:I`,
    });

    const rows = res.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ icps: [] });
    }

    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || '';
      });
      return obj;
    });

    const filtrado = udn
      ? data.filter((row) => row['UDN']?.trim().toLowerCase() === udn.trim().toLowerCase())
      : data;

    return NextResponse.json({ icps: filtrado, total: filtrado.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
