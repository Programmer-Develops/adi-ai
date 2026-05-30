import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const lead = body.lead;

    // Basic validation to ensure the payload isn't completely empty
    if (!lead || !lead.email || !lead.name) {
      return NextResponse.json({ error: "Invalid lead payload. Name and Email are required." }, { status: 400 });
    }

    // Determine the correct Webhook based on the source
    // If it comes from the new B2B portal, route it to the Task T12 Make.com workflow!
    const isB2B = lead.source && lead.source.includes("B2B");
    const webhookUrl = isB2B ? process.env.B2B_WEBHOOK_URL : process.env.LEAD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(`Missing ${isB2B ? 'B2B_WEBHOOK_URL' : 'LEAD_WEBHOOK_URL'} in environment variables.`);
      return NextResponse.json({ error: "Webhook URL not configured on the server." }, { status: 500 });
    }

    // Forward the payload to your Webhook (Make.com, Zapier, or Google Sheets)
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead }),
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }

    console.log(`[B2B Portal] Lead successfully routed to Webhook: ${lead.name}`);

    return NextResponse.json({ status: "ok", message: "Lead processed successfully" });

  } catch (err) {
    console.error("Error in /api/leads backend:", err);
    return NextResponse.json({ error: "Failed to route lead." }, { status: 500 });
  }
}