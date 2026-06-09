import { connectToDatabase } from "../db/mongo";
import { ObjectId } from "mongodb";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ProcessingJob {
  _id?: ObjectId;
  userId: string;
  filename: string;
  status: JobStatus;
  progress: number; // 0 - 100
  retries: number;
  maxRetries: number;
  error?: string;
  result?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export async function createJob(userId: string, filename: string): Promise<string> {
  const { db } = await connectToDatabase();
  const job: ProcessingJob = {
    userId,
    filename,
    status: "PENDING",
    progress: 0,
    retries: 0,
    maxRetries: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<ProcessingJob>("processingJobs").insertOne(job);
  return result.insertedId.toString();
}

export async function getJobStatus(jobId: string) {
  const { db } = await connectToDatabase();
  const job = await db
    .collection<ProcessingJob>("processingJobs")
    .findOne({ _id: new ObjectId(jobId) });

  if (!job) return null;

  return {
    jobId: job._id?.toString(),
    status: job.status,
    progress: job.progress,
    error: job.error,
    result: job.result,
  };
}

export async function failJob(jobId: string, errorMessage: string) {
  const { db } = await connectToDatabase();
  const job = await db
    .collection<ProcessingJob>("processingJobs")
    .findOne({ _id: new ObjectId(jobId) });

  if (!job) return;

  const willRetry = job.retries < job.maxRetries;
  const nextStatus: JobStatus = willRetry ? "PENDING" : "FAILED";
  const newRetries = job.retries + 1;

  // Exponential Backoff Delay calculation: 2^retries * 1000 ms
  const backoffDelay = willRetry ? Math.pow(2, job.retries) * 1000 : 0;
  console.log(`[QUEUE] Job ${jobId} failed. Status: ${nextStatus}. Delay: ${backoffDelay}ms`);

  setTimeout(async () => {
    const { db: asyncDb } = await connectToDatabase();
    await asyncDb.collection<ProcessingJob>("processingJobs").updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: nextStatus,
          retries: newRetries,
          error: errorMessage,
          updatedAt: new Date(),
        },
      }
    );
  }, backoffDelay);
}
