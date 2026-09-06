import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ error: "GEMINI_API_KEY não definida" });

  const masked = key.substring(0, 6) + "..." + key.substring(key.length - 4);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ status: res.status, key: masked, error: data });
    }
    const models = data.models?.map((m: any) => m.name) || [];
    return NextResponse.json({ status: 200, key: masked, models });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, key: masked });
  }
}
