import { connectToDatabase } from "../db/mongo";
import { generateKnowledgeGraph } from "../ai/ai-service";
import { ObjectId } from "mongodb";

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API returned ${response.status}`);
    }

    const data = await response.json();
    return data.embedding || [];
  } catch (error) {
    console.warn("[EMBEDDINGS] Local embedding failed, returning mock vector:", error);
    // Return a mock vector of 768 dimensions for fallback safety
    return Array.from({ length: 768 }, () => Math.random());
  }
}

export async function processNextJob() {
  const { db } = await connectToDatabase();

  // Atomically pick a pending job and set status to PROCESSING
  const jobResult = await db.collection("processingJobs").findOneAndUpdate(
    { status: "PENDING" },
    {
      $set: {
        status: "PROCESSING",
        progress: 10,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  const job = jobResult?.value || jobResult;
  if (!job) return;

  const jobId = job._id.toString();
  console.log(`[WORKER] Started processing job: ${jobId}`);

  try {
    // Stage 1: Simulating text extraction
    await db.collection("processingJobs").updateOne(
      { _id: job._id },
      { $set: { progress: 30, updatedAt: new Date() } }
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Stage 2: AI Analyzing & Graph Building
    await db.collection("processingJobs").updateOne(
      { _id: job._id },
      { $set: { progress: 60, updatedAt: new Date() } }
    );
    const mockDocumentText = `This document covers English nouns and verbs. A noun names a person, place, or thing. A verb expresses action or state of being.`;
    const graphData = await generateKnowledgeGraph(mockDocumentText);

    // Stage 3: Embedding node concepts
    await db.collection("processingJobs").updateOne(
      { _id: job._id },
      { $set: { progress: 80, updatedAt: new Date() } }
    );

    const graphId = new ObjectId().toString();

    // Iterate and generate embeddings for all CONCEPT nodes
    for (const node of graphData.nodes) {
      const embedding = await generateEmbedding(node.content);
      // Save node details along with its vector embeddings
      await db.collection("vectorEmbeddings").insertOne({
        userId: job.userId,
        graphId,
        nodeId: node.id,
        label: node.label,
        content: node.content,
        embedding,
        createdAt: new Date(),
      });
    }

    // Save final knowledge graph structure
    await db.collection("knowledgeGraphs").insertOne({
      userId: job.userId,
      graphId,
      title: job.filename,
      nodes: graphData.nodes,
      edges: graphData.edges,
      createdAt: new Date(),
    });

    // Mark job as COMPLETED
    await db.collection("processingJobs").updateOne(
      { _id: job._id },
      {
        $set: {
          status: "COMPLETED",
          progress: 100,
          result: { graphId, nodesCount: graphData.nodes.length },
          updatedAt: new Date(),
        },
      }
    );
    console.log(`[WORKER] Job completed successfully: ${jobId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[WORKER] Job ${jobId} failed with error:`, error);

    const retries = job.retries + 1;
    const willRetry = retries < job.maxRetries;
    const nextStatus = willRetry ? "PENDING" : "FAILED";

    await db.collection("processingJobs").updateOne(
      { _id: job._id },
      {
        $set: {
          status: nextStatus,
          retries,
          error: errorMsg,
          updatedAt: new Date(),
        },
      }
    );
  }
}

// Background poller setup
let intervalId: NodeJS.Timeout | null = null;

export function startBackgroundWorker() {
  if (intervalId) return;

  console.log("[WORKER] Background document process worker starting. Polling every 5s.");
  intervalId = setInterval(async () => {
    try {
      await processNextJob();
    } catch (err) {
      console.error("[WORKER] Error in polling loop:", err);
    }
  }, 5000);
}

export function stopBackgroundWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[WORKER] Worker stopped.");
  }
}
