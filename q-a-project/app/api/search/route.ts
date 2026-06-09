import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongo";
import { handleError, AppError } from "@/lib/error-handler";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nomic-embed-text",
      prompt: query,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API returned ${response.status}`);
  }

  const data = await response.json();
  return data.embedding || [];
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      throw new AppError("Unauthorized. Please log in first.", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const limitVal = parseInt(searchParams.get("limit") || "10", 10);

    if (!query) {
      throw new AppError("Search query 'q' parameter is required.", 400, "BAD_REQUEST");
    }

    // Generate query vector embeddings
    const queryVector = await generateQueryEmbedding(query);

    const { db } = await connectToDatabase();

    // Query user-isolated embeddings
    const items = await db
      .collection("vectorEmbeddings")
      .find({ userId: session.userId })
      .toArray();

    // Calculate similarity score in JS
    const scoredResults = items
      .map((item) => {
        const score = calculateCosineSimilarity(queryVector, item.embedding);
        return {
          nodeId: item.nodeId,
          label: item.label,
          content: item.content,
          graphId: item.graphId,
          graphTitle: item.graphTitle || "Ingested Concept Graph",
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limitVal);

    return NextResponse.json({
      success: true,
      results: scoredResults,
    });
  } catch (error) {
    return handleError(error);
  }
}
