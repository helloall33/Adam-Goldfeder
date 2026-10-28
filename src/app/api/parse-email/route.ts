// Server endpoint: the browser sends an email's text here, and gets back
// the ticket details the AI extracted. URL: POST /api/parse-email

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { extractTicketFromEmail } from "@/lib/ai";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI is not set up yet: the ANTHROPIC_API_KEY setting is missing on the server." },
      { status: 500 },
    );
  }

  const { emailText } = (await request.json()) as { emailText?: string };
  if (!emailText || emailText.trim().length < 10) {
    return NextResponse.json({ error: "Please paste an email first." }, { status: 400 });
  }
  if (emailText.length > 20000) {
    return NextResponse.json({ error: "That email is too long (over 20,000 characters)." }, { status: 400 });
  }

  try {
    const ticket = await extractTicketFromEmail(emailText);
    return NextResponse.json({ ticket });
  } catch (error) {
    let message = "Something went wrong reading the email.";
    if (error instanceof Anthropic.AuthenticationError) message = "The AI key is invalid. Check ANTHROPIC_API_KEY.";
    else if (error instanceof Anthropic.RateLimitError) message = "The AI is busy right now. Try again in a minute.";
    else if (error instanceof Anthropic.APIError) message = `AI service error (${error.status}). Try again.`;
    else if (error instanceof Error) message = error.message;
    console.error("parse-email failed:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
