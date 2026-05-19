import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase"; // Assumes your Firebase config is still here from the Gobrics Assistant
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
  try {
    const body = await request.json();
    const lead = body.lead || body;

    // Validate incoming data
    if (!lead || (!lead.name && !lead.email && !lead.interest)) {
      return NextResponse.json({ error: "Lead payload must include at least one contact field." }, { status: 400 });
    }

    // FEEDBACK 2: PUSH LEAD DIRECTLY TO CENTRALIZED FIREBASE DATABASE
    const docRef = await addDoc(collection(db, "adishila_leads"), {
      name: lead.name || "Unknown",
      email: lead.email || "No Email",
      interest: lead.interest || "General",
      source: "AdiShila Support Chatbot",
      status: "New",
      createdAt: serverTimestamp()
    });

    console.log("Lead successfully saved to Firebase with ID:", docRef.id);

    return NextResponse.json({ status: "ok", id: docRef.id });

  } catch (err) {
    console.error("Error in /api/leads saving to Firebase:", err);
    return NextResponse.json({ error: "Failed to route lead to centralized database." }, { status: 500 });
  }
}