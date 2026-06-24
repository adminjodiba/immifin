import { createSign } from "node:crypto";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

type ServiceAccountConfig = {
  sheetId: string;
  clientEmail: string;
  privateKey: string;
};

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function getServiceAccountConfig(): ServiceAccountConfig {
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!sheetId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Google Sheets credentials. Set GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY.",
    );
  }

  return { sheetId, clientEmail, privateKey };
}

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const unsigned = `${header}.${claim}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed (${response.status})`);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("Google auth response did not include an access token.");
  }

  return data.access_token;
}

async function sheetsRequest<T>(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<T> {
  const { accessToken, ...requestInit } = init;

  const response = await fetch(`${SHEETS_API_BASE}${path}`, {
    ...requestInit,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...requestInit.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();

    if (response.status === 403) {
      throw new Error(
        "Google Sheets permission denied. Share the spreadsheet with the service account email as Editor.",
      );
    }

    throw new Error(`Google Sheets API failed (${response.status}): ${body}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function readSheetValues(range: string): Promise<string[][]> {
  const { sheetId, clientEmail, privateKey } = getServiceAccountConfig();
  const accessToken = await getAccessToken(clientEmail, privateKey);
  const encodedRange = encodeURIComponent(range);

  const data = await sheetsRequest<{ values?: string[][] }>(
    `/${sheetId}/values/${encodedRange}`,
    { accessToken },
  );

  return data.values ?? [];
}

export async function appendSheetValues(range: string, values: string[][]): Promise<void> {
  const { sheetId, clientEmail, privateKey } = getServiceAccountConfig();
  const accessToken = await getAccessToken(clientEmail, privateKey);
  const encodedRange = encodeURIComponent(range);

  await sheetsRequest(
    `/${sheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      accessToken,
      body: JSON.stringify({ values }),
    },
  );
}
