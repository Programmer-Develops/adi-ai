import { NextResponse } from "next/server";

// 1. ADISHILA CATALOG DATA EXTRACTED FROM PPT
const catalogData = `
--- ADISHILA BRAND INFO ---
AdiShila brings authentic Karelian shungite to the Indian market. It is a 2-billion-year-old mineral and the only natural source of Fullerene C60 on Earth, known for EMF radiation absorption. The products are adapted for Vedic, Vastu, and Ayurvedic traditions.

--- PRODUCT CATALOG ---
1. Kavach Shield — OM 
- Category: EMF Protection 
- Description: Polished shungite plate in sacred OM shape. Adheres to any phone case via 3M VHB tape.
- Wholesale Price: ₹800 (MOQ 25+ pcs) 
- Suggested MRP: ₹1,499 
- Retailer Margin: 46.6% 

2. Vastu Dosh Pyramid 
- Category: Vastu Shastra 
- Description: Polished shungite pyramid with a copper foil band. Black shungite absorbs negative energy; copper conducts Prana. Ideal for corners, routers, and desks.
- Wholesale Price: ₹1,100 (MOQ 25+ pcs) 
- Suggested MRP: ₹2,199 
- Retailer Margin: 50.0% 

3. Rudra-Shila Raksha Mala 
- Category: Personal Protection 
- Description: Wrist mala with 26 polished 8mm shungite beads and 1 genuine Mukhi Rudraksha (27 beads total). Elastic cord, unisex.
- Wholesale Price: ₹900 (MOQ 25+ pcs) 
- Suggested MRP: ₹1,499 
- Retailer Margin: 40.0% 

4. Amrit Jal Shuddhi Set 
- Category: Ayurveda Wellness 
- Description: Water purification ritual set containing 300g washed shungite chips, a cotton/jute pouch, and a copper coin. Designed for 3 litres of water. Soak for 6-8 hours.
- Wholesale Price: ₹950 (MOQ 25+ sets) 
- Suggested MRP: ₹1,999 
- Retailer Margin: 52.5% 

5. Shila Raksha Pendant — OM 
- Category: Jewellery 
- Description: Polished shungite disc pendant with gold-painted OM. Comes with a waxed cotton adjustable cord. Worn at the throat chakra.
- Wholesale Price: ₹700 (MOQ 25+ pcs) 
- Suggested MRP: ₹1,299 
- Retailer Margin: 46.1% 

--- WHOLESALE & PARTNERSHIP TERMS ---
- Minimum Order (MOQ): 25 pcs per SKU for first order, 10 pcs per SKU for reorders.
- Samples: Available for ₹500/SKU + shipping (refundable).
- Payment Terms: 50% advance, 50% on dispatch.
- Shipping: Pan-India (5-7 business days). Free shipping on orders above ₹25,000.
- Returns: Broken items replaced free with photo proof within 48 hours.
- Taxes: GST is 18% extra on wholesale prices.
- Contact for orders: info@adishila.in
`;

// 2. INJECT CATALOG & STRICT GUARDRAILS INTO SYSTEM PROMPT
const systemPrompt = `You are the official B2B and Customer Support AI assistant for AdiShila. 
Use the catalog data below to answer all questions accurately.

${catalogData}

Guidelines:
1. Only provide pricing, margins, or product details exactly as they appear in the catalog.
2. If a customer asks about a product not listed, politely state it is not in the current catalog.
3. If the user asks about B2B, wholesale, or bulk orders, explain the MOQ and payment terms, and ask for their email/phone to capture the lead.
4. Keep responses concise, professional, and friendly.

CRITICAL GUARDRAIL RULE:
- If a user asks ANYTHING outside the scope of this catalog (e.g., coding, general knowledge, competitors, personal advice, or unrelated topics), you MUST refuse to answer.
- You must reply with this EXACT phrase and nothing else: "I'm sorry — I can't assist with that request."
`;

export async function GET() {
  return NextResponse.json({ status: "ok", message: "AdiShila Gemini chat route is live." });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = "gemini-3.1-flash-lite";

    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_API_KEY is not configured." }, { status: 500 });
    }

    const { messages, lead } = body;

    let finalSystemPrompt = systemPrompt;
    if (lead && (lead.name || lead.email || lead.interest)) {
      finalSystemPrompt += `\n\n[System Note: The user's name is ${lead.name || 'Unknown'}. Use it naturally if appropriate.]`;
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // FEEDBACK 1: USE TRUE STREAMING ENDPOINT (streamGenerateContent with SSE)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: finalSystemPrompt }] },
        contents: formattedMessages,
        generationConfig: { temperature: 0.2 }, // Lowered to enforce strict guardrails
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Gemini API request failed." }, { status: response.status });
    }

    // Process the Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.slice(6));
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch (e) {
                  // Ignore partial JSON chunks
                }
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}