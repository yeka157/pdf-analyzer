import { NextResponse } from "next/server";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const handleApiError = (error: unknown): NextResponse => {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { details: error.details, error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "Unknown error occured" }, { status: 500 });
};
