import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import {
  GOOGLE_REFRESH_COOKIE,
  isGoogleConfigured,
  refreshAccessToken,
  sendGmail,
} from "@/lib/google";

export const dynamic = "force-dynamic";

const gmailUser = process.env.GMAIL_USER ?? "";
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD ?? "";
const useSmtp = Boolean(gmailUser && gmailAppPassword);

// ---------- SMTP transporter (App Password path) ----------
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<{ messageId: string }> {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"Lofty" <${gmailUser}>`,
    to: opts.to,
    cc: opts.cc,
    bcc: opts.bcc,
    subject: opts.subject,
    text: opts.body,
  });
  return { messageId: String(info.messageId ?? "") };
}

// ---------- OAuth path helper ----------
async function getOAuthAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refresh = store.get(GOOGLE_REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  try {
    const tokens = await refreshAccessToken(refresh);
    return tokens.access_token;
  } catch {
    return null;
  }
}

// ---------- Route ----------
export async function POST(req: NextRequest) {
  let body: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    threadId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (!body.to || !body.subject || !body.body) {
    return NextResponse.json(
      { error: "to, subject, body are required" },
      { status: 400 }
    );
  }

  // -------- App Password / SMTP (preferred when key is configured) --------
  if (useSmtp) {
    try {
      const result = await sendViaSmtp(body);
      return NextResponse.json({
        ok: true,
        method: "smtp",
        messageId: result.messageId,
        from: gmailUser,
      });
    } catch (err) {
      return NextResponse.json(
        { error: `SMTP send failed: ${(err as Error).message}` },
        { status: 500 }
      );
    }
  }

  // -------- OAuth / Gmail REST API (fallback) --------
  if (!isGoogleConfigured) {
    return NextResponse.json(
      {
        error:
          "No Gmail sender configured. Set GMAIL_USER + GMAIL_APP_PASSWORD in .env.local, or connect Google via OAuth.",
      },
      { status: 400 }
    );
  }

  const accessToken = await getOAuthAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Google not connected. Set GMAIL_USER + GMAIL_APP_PASSWORD in .env.local for keyless sending, or reconnect Google via the Calendar page.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await sendGmail(accessToken, body);
    return NextResponse.json({
      ok: true,
      method: "oauth",
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
