import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body?.messages || [];

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Orion, a concise voice agent for a private digital empire. Keep replies short and actionable." },
        ...messages,
      ],
      temperature: 0.5,
    }),
  });

  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content || "Done.";
  return NextResponse.json({ reply });
}
