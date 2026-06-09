import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongo";
import { handleError } from "@/lib/error-handler";
import { generateChatResponse } from "@/lib/ai/ai-service";
import { z } from "zod";

const chatRequestSchema = z.object({
  graphId: z.string().min(1),
  query: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const validated = chatRequestSchema.parse(body);

    const { db } = await connectToDatabase();

    // 1. Fetch current graph from Mongo (if it exists) to allow using it as context
    const existingGraph = await db.collection("knowledgeGraphs").findOne({
      userId,
      graphId: validated.graphId,
    });

    const currentGraph = existingGraph
      ? { nodes: existingGraph.nodes || [], edges: existingGraph.edges || [] }
      : { nodes: [], edges: [] };

    // 2. Prepare the messages history to feed the model
    let history = validated.messages;
    if (history.length === 0 && existingGraph?.messages) {
      history = existingGraph.messages;
    }
    
    // Add the new user query to the history if it isn't already the last message
    const lastMsg = history[history.length - 1];
    if (!lastMsg || lastMsg.content !== validated.query || lastMsg.role !== "user") {
      history = [...history, { role: "user", content: validated.query }];
    }

    // 3. Call the AI service to generate a tutoring response
    const result = await generateChatResponse(history, currentGraph);

    // 4. Update the messages array in MongoDB
    const updatedMessages = [
      ...history,
      { role: "assistant", content: result.response }
    ];

    await db.collection("knowledgeGraphs").updateOne(
      { userId, graphId: validated.graphId },
      {
        $set: {
          messages: updatedMessages,
          updatedAt: new Date(),
        },
      }
    );

    // 5. Return response, provider, and messages back to the UI
    return NextResponse.json({
      success: true,
      response: result.response,
      provider: result.provider,
      messages: updatedMessages,
    });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return handleError(error);
  }
}

