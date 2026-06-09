import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    console.warn("[VALIDATION_WARN] Input validation failed:", error.issues);
    return NextResponse.json(
      {
        success: false,
        error: "Validation Error",
        details: error.issues,
        code: "VALIDATION_FAILED",
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    console.error(`[API_ERROR] ${error.code}: ${error.message}`);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle Fetch/Timeout Errors
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT") || errorMessage.includes("AbortError")) {
    console.error("[TIMEOUT_ERROR] API Request timed out:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: "The request timed out. Please try again.",
        code: "GATEWAY_TIMEOUT",
      },
      { status: 504 }
    );
  }

  console.error("[CRITICAL_SERVER_ERROR] Unhandled exception occurred:", error);
  return NextResponse.json(
    {
      success: false,
      error: "An unexpected error occurred. Please contact support.",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}
