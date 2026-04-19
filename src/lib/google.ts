// Lightweight server-side Google Calendar helpers.
// We avoid pulling in the full `googleapis` SDK to keep the bundle tiny;
// the OAuth + Calendar v3 REST surface we need is small.

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
export const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/google/callback";

export const isGoogleConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

// Cookie names used to persist the user's Google session.
export const GOOGLE_REFRESH_COOKIE = "g_refresh";
export const GOOGLE_EMAIL_COOKIE = "g_email";

export function buildAuthUrl(state?: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  if (state) params.set("state", state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
  hangoutLink?: string;
  status?: string;
  attendees?: { email?: string; displayName?: string; responseStatus?: string }[];
  organizer?: { email?: string; displayName?: string };
}

export async function listEvents(
  accessToken: string,
  options: { timeMin: string; timeMax: string; calendarId?: string }
): Promise<GoogleCalendarEvent[]> {
  const calendarId = options.calendarId ?? "primary";
  const params = new URLSearchParams({
    timeMin: options.timeMin,
    timeMax: options.timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`List events failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { items?: GoogleCalendarEvent[] };
  return json.items ?? [];
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  attendees?: string[];
}

// ---------- Gmail ----------

export interface SendGmailInput {
  to: string;
  subject: string;
  body: string;        // plain text or simple HTML
  cc?: string;
  bcc?: string;
  threadId?: string;   // reply within an existing thread
}

function base64UrlEncode(str: string): string {
  // Base64-URL safe encoding for Gmail's raw field.
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(str, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sendGmail(
  accessToken: string,
  input: SendGmailInput
): Promise<{ id: string; threadId: string }> {
  const headers: string[] = [
    `To: ${input.to}`,
    input.cc ? `Cc: ${input.cc}` : "",
    input.bcc ? `Bcc: ${input.bcc}` : "",
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.body,
  ].filter(Boolean);

  const raw = base64UrlEncode(headers.join("\r\n"));
  const body: Record<string, unknown> = { raw };
  if (input.threadId) body.threadId = input.threadId;

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail send failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createEvent(
  accessToken: string,
  input: CreateEventInput,
  calendarId = "primary"
): Promise<GoogleCalendarEvent> {
  const body = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: { dateTime: input.start },
    end: { dateTime: input.end },
    attendees: input.attendees?.map((email) => ({ email })),
  };
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create event failed: ${res.status} ${text}`);
  }
  return res.json();
}
