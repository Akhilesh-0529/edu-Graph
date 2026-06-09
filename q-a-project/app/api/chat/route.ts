import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { handleError } from "@/lib/error-handler";
import { z } from "zod";

const chatRequestSchema = z.object({
  query: z.string().min(1),
  context: z.string().optional().default(""),
});

// A safe truncation helper to ensure we do not exceed 100k tokens.
// Standard English heuristic: 1 token is ~4 characters.
// So 100,000 tokens translates to roughly 400,000 characters.
function truncateTo100kTokens(text: string): string {
  const limitChars = 400000;
  if (text.length > limitChars) {
    console.warn(`[CHAT] Input context truncated from ${text.length} characters to 400,000 characters.`);
    return text.substring(0, limitChars);
  }
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();

    const body = await req.json();
    const validated = chatRequestSchema.parse(body);

    const truncatedContext = truncateTo100kTokens(validated.context);
    console.log(`[CHAT] User: ${userId}, Query: ${validated.query}, Context Length: ${truncatedContext.length}`);

    // AI logic is executed here
    // In production, we would invoke the local Gemma model or fallback online API.
    // For this route, we simulate a robust response.
    const responseText = `Here is a simulated response to your question: "${validated.query}". Content retrieved for user ID: ${userId}. Context: ${truncatedContext.substring(0, 100)}...`;

    return NextResponse.json({
      success: true,
      response: responseText,
      concept: "General Grammar Context",
    });
  } catch (error) {
    return handleError(error);
  }
}
