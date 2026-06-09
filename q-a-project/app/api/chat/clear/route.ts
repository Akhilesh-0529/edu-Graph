import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongo";
import { handleError } from "@/lib/error-handler";
import { z } from "zod";

const clearChatRequestSchema = z.object({
  graphId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const validated = clearChatRequestSchema.parse(body);

    const { db } = await connectToDatabase();

    // Fetch details to check if it's a chat-built graph
    const existingGraph = await db.collection("knowledgeGraphs").findOne({
      userId,
      graphId: validated.graphId,
    });

    if (!existingGraph) {
      return NextResponse.json({ success: false, message: "Graph not found." }, { status: 404 });
    }

    // Update query: Clear messages. If it was chat-built, reset the visual canvas too
    const updateFields: any = {
      messages: [],
      updatedAt: new Date(),
    };

    if (existingGraph.isChatBuilt) {
      updateFields.nodes = [];
      updateFields.edges = [];
    }

    await db.collection("knowledgeGraphs").updateOne(
      { userId, graphId: validated.graphId },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully.",
    });
  } catch (error) {
    console.error("[CLEAR_CHAT_ERROR]", error);
    return handleError(error);
  }
}
