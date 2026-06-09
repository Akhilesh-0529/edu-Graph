import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { handleError, AppError } from "@/lib/error-handler";
import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const uploadRequestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().max(MAX_FILE_SIZE, "File size exceeds 50MB limit"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.userId) {
      throw new AppError("Unauthorized. Please log in first.", 401, "UNAUTHORIZED");
    }

    const body = await req.json();
    const validated = uploadRequestSchema.parse(body);

    // Isolated user storage context
    console.log(`[UPLOAD] User ${session.userId} uploading ${validated.filename} (${validated.size} bytes)`);

    return NextResponse.json({
      success: true,
      message: "Upload request approved. Ready to ingest content.",
      uploadUrl: `/api/upload/mock-presigned-url/${session.userId}`,
      filename: validated.filename,
    });
  } catch (error) {
    return handleError(error);
  }
}
