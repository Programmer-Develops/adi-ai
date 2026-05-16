import { NextResponse } from "next/server";

const systemPrompt = `You are an AI assistant for AdiShila, a brand selling shungite wellness products such as pyramids, bracelets, cubes, plates, raw stones, and charging stones. Answer questions about products, EMF protection, Vastu, pricing, shipping, product care, authenticity, and lead capture.

When lead details are provided, acknowledge them and suggest the next follow-up step. Make responses helpful, friendly, and concise. If pricing is asked, give general guidance and remind the customer that exact pricing may change and should be confirmed with the team.`;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_API_KEY is not configured in the environment." },
      { status: 500 }
    );
  }

  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "Request must include a messages array." },
      { status: 400 }
    );
  }

  const { messages, lead } = body;

  const promptMessages = [
    { author: "system", content: [{ type: "text", text: systemPrompt }] },
  ];

  if (lead && (lead.name || lead.email || lead.interest)) {
    const leadDetails = [];
    if (lead.name) leadDetails.push(`Name: ${lead.name}`);
    if (lead.email) leadDetails.push(`Email: ${lead.email}`);
    if (lead.interest) leadDetails.push(`Interest: ${lead.interest}`);

    promptMessages.push({
      author: "system",
      content: [{
        type: "text",
        text: `Customer lead info is available: ${leadDetails.join(", ")}. Use this information appropriately when answering.`,
      }],
    });
  }

  promptMessages.push(
    ...messages.map((message) => ({
      author: message.role,
      content: [{ type: "text", text: message.text }],
    }))
  );

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-mini:generate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: {
          messages: promptMessages,
        },
        temperature: 0.8,
        maxOutputTokens: 500,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: "Gemini API request failed.", details: errorText },
      { status: response.status }
    );
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0] ?? null;
  const answer =
    candidate?.content?.[0]?.text || candidate?.content || data?.output?.[0]?.content || "Sorry, I couldn't generate a response.";

  return NextResponse.json({ answer });
}
