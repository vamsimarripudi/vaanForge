import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    error: "Internal server error",
    message: error instanceof Error ? error.message : "Unknown error"
  });
};
