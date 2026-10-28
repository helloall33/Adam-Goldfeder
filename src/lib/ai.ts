// ─────────────────────────────────────────────────────────────
// AI HELPERS — everything that talks to Claude lives here.
// This file runs ONLY on the server, so the API key is never sent
// to anyone's browser.
// ─────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CATEGORIES, PRIORITIES, ZONES } from "./types";

export const AI_MODEL = "claude-opus-5-5";

// The exact information we want back from an email.
// Claude is required to answer in this shape.
export const ExtractedTicket = z.object({
  customerName: z.string().describe("Name of the person who wrote the email, or empty if unknown"),
  company: z.string().describe("Business name, or empty if unknown"),
  address: z.string().describe("Site street address including town, or empty if not given"),
  zone: z.enum([...ZONES, "Unknown"]).describe("Service zone, from the town (see list). Unknown if no town."),
  phone: z.string(),
  email: z.string(),
  subject: z.string().describe("Short summary of the problem, under 10 words, for a ticket title"),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  priorityReason: z.string().describe("One sentence explaining the priority"),
  needsHumanReview: z.boolean().describe("True if a person should look at this before normal scheduling"),
  reviewReason: z.string().describe("Why it needs review, or empty"),
  possibleEmergency: z.boolean().describe("True ONLY if the email describes a possible emergency happening now (fire, break-in in progress, someone in danger)"),
  missingInfo: z.array(z.string()).describe("Important details the office should ask the customer for"),
});
export type ExtractedTicket = z.infer<typeof ExtractedTicket>;

// Instructions for Claude. Edit this in plain English to change how emails are read.
const INSTRUCTIONS = `You read incoming customer emails for a commercial security company and turn them into service tickets.

Service categories:
- Security Cameras: cameras, NVR/DVR recorders, video footage, remote viewing apps
- Burglar Alarm: intrusion panels, keypads, motion/door/glass-break sensors, false alarms, arming problems
- Access Control: card/fob readers, door locks, maglocks, gates, badge programming
- Fire Alarm: fire panels, smoke/heat detectors, horns/strobes, inspections
- Intercom: door intercoms and video intercoms
- Alarm Communicator: the device that sends alarm signals to the monitoring center (cellular/internet/phone line), missed check-ins
- Other: anything else (quotes, walkthroughs, cabling)

Priority rules:
- Critical: a security or life-safety system is down or unable to protect the site right now (e.g. alarm can't be armed tonight, fire panel in trouble at an occupied building, doors stuck unlocked).
- High: a major problem affecting operations or security today, but the site is still protected.
- Medium: needs fixing in the next few days.
- Low: requests, quotes, minor adjustments.

Service zones by town: Riverside and Cedar Falls = North; Fairview = South; Oakdale = Central; Lakewood = East; Maple Grove = West.

Set needsHumanReview to true for Critical tickets, anything involving fire/life-safety, possible emergencies, angry customers, or anything unusual.
If the email describes a possible emergency happening right now, set possibleEmergency to true. You never contact emergency services; a person decides.
Only use information that is in the email. Leave fields empty rather than guessing.`;

export async function extractTicketFromEmail(emailText: string): Promise<ExtractedTicket> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const response = await client.beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: betaZodOutputFormat(ExtractedTicket) },
    // If this model declines a request, the API automatically retries on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: INSTRUCTIONS,
    messages: [{ role: "user", content: `Here is the customer email:\n\n<email>\n${emailText}\n</email>` }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("The AI could not read this email. Please create the ticket manually.");
  }
  return response.parsed_output;
}
