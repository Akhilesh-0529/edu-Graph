import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongo";
import { handleError, AppError } from "@/lib/error-handler";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      throw new AppError("Unauthorized. Please log in first.", 401, "UNAUTHORIZED");
    }

    const { jobId } = await params;
    if (!jobId || !ObjectId.isValid(jobId)) {
      throw new AppError("Invalid job identifier format.", 400, "BAD_REQUEST");
    }

    const { db } = await connectToDatabase();
    const job = await db
      .collection("processingJobs")
      .findOne({ _id: new ObjectId(jobId) });

    if (!job) {
      throw new AppError("The requested job could not be found.", 404, "NOT_FOUND");
    }

    // Verify user data isolation
    if (job.userId !== session.userId) {
      throw new AppError("Forbidden. You do not own this job context.", 403, "FORBIDDEN");
    }

    return NextResponse.json({
      success: true,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    });
  } catch (error) {
    return handleError(error);
  }
}
