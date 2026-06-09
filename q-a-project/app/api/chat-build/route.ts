import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongo";
import { handleError } from "@/lib/error-handler";
import { generateChatGraphAndResponse } from "@/lib/ai/ai-service";
import { z } from "zod";

const chatBuildRequestSchema = z.object({
  graphId: z.string().min(1),
  title: z.string().min(1).optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const validated = chatBuildRequestSchema.parse(body);

    const { db } = await connectToDatabase();

    // 1. Fetch current graph from Mongo (if it exists) to allow incremental updates
    const existingGraph = await db.collection("knowledgeGraphs").findOne({
      userId,
      graphId: validated.graphId,
    });

    const currentGraph = existingGraph
      ? { nodes: existingGraph.nodes || [], edges: existingGraph.edges || [] }
      : { nodes: [], edges: [] };

    // 2. Call the AI service to generate a tutoring response + updated graph schema
    const result = await generateChatGraphAndResponse(validated.messages, currentGraph);

    // 3. Upsert the updated knowledge graph structure back into MongoDB
    const graphTitle = validated.title || existingGraph?.title || `Chat: ${validated.messages[0]?.content.slice(0, 25) || "New Session"}`;
    
    await db.collection("knowledgeGraphs").updateOne(
      { userId, graphId: validated.graphId },
      {
        $set: {
          userId,
          title: graphTitle,
          nodes: result.graph.nodes,
          edges: result.graph.edges,
          isChatBuilt: true,
          messages: [
            ...validated.messages,
            { role: "assistant", content: result.response }
          ],
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // 4. Return the conversational response + new graph structures to UI
    return NextResponse.json({
      success: true,
      response: result.response,
      graph: result.graph,
      title: graphTitle,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[CHAT_BUILD_ERROR]", error);
    return handleError(error);
  }
}
