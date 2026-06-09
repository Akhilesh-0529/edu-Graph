import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/mongo";
import { handleError } from "@/lib/error-handler";
import { z } from "zod";

const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["CONCEPT", "DEFINITION", "EXAMPLE", "PREREQUISITE"]),
  content: z.string(),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

const edgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string(),
  label: z.string().optional(),
});

const saveGraphSchema = z.object({
  graphId: z.string().min(1),
  title: z.string().min(1),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export async function GET() {
  try {
    const userId = await getAuthUserId();

    const { db } = await connectToDatabase();
    
    // Retrieve all knowledge graphs isolated for this specific user
    const graphs = await db
      .collection("knowledgeGraphs")
      .find({ userId })
      .toArray();

    return NextResponse.json({
      success: true,
      graphs,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();

    const body = await req.json();
    const validated = saveGraphSchema.parse(body);

    const { db } = await connectToDatabase();

    // Perform an upsert with strict user data isolation constraints
    await db.collection("knowledgeGraphs").updateOne(
      { userId, graphId: validated.graphId },
      {
        $set: {
          userId,
          title: validated.title,
          nodes: validated.nodes,
          edges: validated.edges,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Knowledge graph saved successfully.",
      graphId: validated.graphId,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");

    if (!graphId) {
      return NextResponse.json(
        { success: false, error: "Missing graphId parameter." },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const result = await db.collection("knowledgeGraphs").deleteOne({
      userId,
      graphId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Knowledge graph not found or unauthorized." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge graph deleted successfully.",
    });
  } catch (error) {
    return handleError(error);
  }
}

