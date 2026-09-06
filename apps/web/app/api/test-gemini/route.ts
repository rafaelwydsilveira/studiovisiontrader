import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "No key" });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in 5 words" }] }],
          generationConfig: { maxOutputTokens: 50 },
        }),
      }
    );
    const data = await res.json();
    return NextResponse.json({ status: res.status, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
