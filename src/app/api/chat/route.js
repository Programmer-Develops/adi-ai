import { NextResponse } from "next/server";

// 1. ADISHILA CATALOG DATA EXTRACTED FROM PPT
const catalogData = `
--- ADISHILA BRAND INFO ---
AdiShila brings authentic Karelian shungite to the Indian market[cite: 644]. It is a 2-billion-year-old mineral and the only natural source of Fullerene C60 on Earth, known for EMF radiation absorption[cite: 631, 632, 641]. The products are adapted for Vedic, Vastu, and Ayurvedic traditions[cite: 644].

--- PRODUCT CATALOG ---
1. Kavach Shield — OM [cite: 646]
- Category: EMF Protection [cite: 648]
- Description: Polished shungite plate in sacred OM shape. Adheres to any phone case via 3M VHB tape[cite: 649, 650].
- Wholesale Price: ₹800 (MOQ 25+ pcs) [cite: 661, 662]
- Suggested MRP: ₹1,499 [cite: 663, 664]
- Retailer Margin: 46.6% [cite: 665, 666]

2. Vastu Dosh Pyramid [cite: 668]
- Category: Vastu Shastra [cite: 670]
- Description: Polished shungite pyramid with a copper foil band. Black shungite absorbs negative energy; copper conducts Prana. Ideal for corners, routers, and desks[cite: 671, 672].
- Wholesale Price: ₹1,100 (MOQ 25+ pcs) [cite: 683, 684]
- Suggested MRP: ₹2,199 [cite: 685, 686]
- Retailer Margin: 50.0% [cite: 687, 688]

3. Rudra-Shila Raksha Mala [cite: 690]
- Category: Personal Protection [cite: 692]
- Description: Wrist mala with 26 polished 8mm shungite beads and 1 genuine Mukhi Rudraksha (27 beads total). Elastic cord, unisex[cite: 693, 694].
- Wholesale Price: ₹900 (MOQ 25+ pcs) [cite: 705, 706]
- Suggested MRP: ₹1,499 [cite: 707, 708]
- Retailer Margin: 40.0% [cite: 709, 710]

4. Amrit Jal Shuddhi Set [cite: 712]
- Category: Ayurveda Wellness [cite: 714]
- Description: Water purification ritual set containing 300g washed shungite chips, a cotton/jute pouch, and a copper coin. Designed for 3 litres of water. Soak for 6-8 hours[cite: 715, 716, 717].
- Wholesale Price: ₹950 (MOQ 25+ sets) [cite: 728, 729]
- Suggested MRP: ₹1,999 [cite: 730, 731]
- Retailer Margin: 52.5% [cite: 732, 733]

5. Shila Raksha Pendant — OM [cite: 735]
- Category: Jewellery [cite: 737]
- Description: Polished shungite disc pendant with gold-painted OM. Comes with a waxed cotton adjustable cord. Worn at the throat chakra[cite: 738, 739].
- Wholesale Price: ₹700 (MOQ 25+ pcs) [cite: 750, 751]
- Suggested MRP: ₹1,299 [cite: 752, 753]
- Retailer Margin: 46.1% [cite: 754, 755]

--- WHOLESALE & PARTNERSHIP TERMS ---
- Minimum Order (MOQ): 25 pcs per SKU for first order, 10 pcs per SKU for reorders[cite: 797, 798, 799].
- Samples: Available for ₹500/SKU + shipping (refundable)[cite: 800].
- Payment Terms: 50% advance, 50% on dispatch[cite: 802].
- Shipping: Pan-India (5-7 business days). Free shipping on orders above ₹25,000[cite: 806, 807].
- Returns: Broken items replaced free with photo proof within 48 hours[cite: 809, 810].
- Taxes: GST is 18% extra on wholesale prices[cite: 818].
- Contact for orders: info@adishila.in[cite: 825].
`;

// 2. INJECT CATALOG INTO THE SYSTEM PROMPT
const systemPrompt = `You are the official B2B and Customer Support AI assistant for AdiShila. 
Use the catalog data below to answer all questions accurately.

${catalogData}

Guidelines:
1. Only provide pricing, margins, or product details exactly as they appear in the catalog.
2. If a customer asks about a product not listed, politely state it is not in the current catalog.
3. If the user asks about B2B, wholesale, or bulk orders, explain the MOQ and payment terms, and ask for their email/phone to capture the lead.
4. Keep responses concise, professional, and friendly.`;

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

    let finalSystemPrompt = systemPrompt;
    if (lead && (lead.name || lead.email || lead.interest)) {
      const leadDetails = [];
      if (lead.name) leadDetails.push(`Name: ${lead.name}`);
      if (lead.email) leadDetails.push(`Email: ${lead.email}`);
      if (lead.interest) leadDetails.push(`Interest: ${lead.interest}`);
      
      finalSystemPrompt += `\n\nCustomer lead info is available: ${leadDetails.join(", ")}. Use this information appropriately when answering.`;
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

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
          temperature: 0.4, // Lowered temperature to 0.4 to ensure it sticks strictly to the catalog facts
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