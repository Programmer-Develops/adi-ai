import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const lead = body.lead || body;

    // Validate incoming data
    if (!lead || (!lead.name && !lead.email && !lead.interest)) {
      return NextResponse.json({ error: "Lead payload must include at least one contact field." }, { status: 400 });
    }

    const scriptUrl = process.env.LEAD_WEBHOOK_URL;

    if (!scriptUrl) {
      console.error("Missing LEAD_WEBHOOK_URL in environment variables.");
      return NextResponse.json({ error: "Webhook URL not configured." }, { status: 500 });
    }

    // Forward the lead data to the Google Sheets Apps Script Webhook
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead }),
    });

    if (!response.ok) {
      throw new Error("Failed to forward lead to Google Sheets");
    }

    console.log("Lead successfully routed to Google Sheets:", lead.name);

    return NextResponse.json({ status: "ok", message: "Lead saved to Google Sheets" });

  } catch (err) {
    console.error("Error in /api/leads saving to Sheets:", err);
    return NextResponse.json({ error: "Failed to route lead." }, { status: 500 });
  }
}