import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { createJob } from "@/lib/queue";
import { startBackgroundWorker } from "@/lib/workers/process-document";
import { handleError } from "@/lib/error-handler";
import { z } from "zod";

const processRequestSchema = z.object({
  filename: z.string().min(1),
  contentUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();

    const body = await req.json();
    const validated = processRequestSchema.parse(body);

    // Enqueue document processing task
    const jobId = await createJob(userId, validated.filename);

    // Boot background worker loop (safe no-op if already running)
    startBackgroundWorker();

    return NextResponse.json(
      {
        success: true,
        message: "Processing job created successfully.",
        jobId,
        status: "PENDING",
        progress: 0,
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    return handleError(error);
  }
}
