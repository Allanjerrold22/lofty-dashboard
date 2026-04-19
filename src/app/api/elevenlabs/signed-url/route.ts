import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        headers: { "xi-api-key": apiKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `ElevenLabs error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) {
      return NextResponse.json({ error: "No signed_url in response" }, { status: 502 });
    }

    return NextResponse.json({ signedUrl: data.signed_url, agentId });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to reach ElevenLabs: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
