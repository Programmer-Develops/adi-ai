import { NextResponse } from "next/server";

const systemPrompt = `You are an AI assistant for AdiShila, a brand selling shungite wellness products such as pyramids, bracelets, cubes, plates, raw stones, and charging stones. Answer questions about products, EMF protection, Vastu, pricing, shipping, product care, authenticity, and lead capture.

When lead details are provided, acknowledge them and suggest the next follow-up step. Make responses helpful, friendly, and concise. If pricing is asked, give general guidance and remind the customer that exact pricing may change and should be confirmed with the team.`;

export async function GET() {
  return NextResponse.json({ status: "ok", message: "AdiShila Gemini chat route is live." });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GOOGLE_API_KEY;
    
    const model = "gemini-3.1-flash-lite";

    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY is not configured in the environment." },
        { status: 500 }
      );
    }

    const { messages, lead } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Request must include a valid messages array." },
        { status: 400 }
      );
    }

    // 1. Inject Lead Info into the System Prompt
    let finalSystemPrompt = systemPrompt;
    if (lead && (lead.name || lead.email || lead.interest)) {
      const leadDetails = [];
      if (lead.name) leadDetails.push(`Name: ${lead.name}`);
      if (lead.email) leadDetails.push(`Email: ${lead.email}`);
      if (lead.interest) leadDetails.push(`Interest: ${lead.interest}`);
      
      finalSystemPrompt += `\n\nCustomer lead info is available: ${leadDetails.join(", ")}. Use this information appropriately when answering.`;
    }

    // 2. Format messages for Gemini API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // 3. Make the API Call to the modern v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: finalSystemPrompt }]
        },
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return NextResponse.json(
        { error: "Gemini API request failed.", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ answer });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal server error connecting to AI.", details: error.message },
      { status: 500 }
    );
  }
}