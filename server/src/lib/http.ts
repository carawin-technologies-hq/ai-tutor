import type { ErrorRequestHandler, Request } from "express";
import { z, ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

/** An error that becomes a JSON response: { error: { code, message, details? } }. */
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}
export const badRequest = (message: string, details?: unknown) => new HttpError(400, "bad_request", message, details);
export const unauthorized = (message = "Please sign in.") => new HttpError(401, "unauthorized", message);
export const forbidden = (message = "You don't have access to this.") => new HttpError(403, "forbidden", message);
export const notFound = (what = "Resource") => new HttpError(404, "not_found", `${what} not found.`);
export const conflict = (message: string) => new HttpError(409, "conflict", message);

/** Validate request data with a Zod schema; throws a 400 with field errors. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw badRequest("Some fields are invalid.", r.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })));
  return r.data;
}
export const body = <T extends z.ZodType>(req: Request, schema: T) => parse(schema, req.body);
export const query = <T extends z.ZodType>(req: Request, schema: T) => parse(schema, req.query);

export const Pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const paged = <T>(items: T[], total: number, page: number, pageSize: number) => ({ items, total, page, pageSize, pages: Math.ceil(total / pageSize) });

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: { code: "bad_request", message: "Some fields are invalid.", details: err.issues } });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") { res.status(409).json({ error: { code: "conflict", message: "That already exists." } }); return; }
    if (err.code === "P2025") { res.status(404).json({ error: { code: "not_found", message: "Not found." } }); return; }
  }
  if (err?.type === "entity.parse.failed") { res.status(400).json({ error: { code: "bad_request", message: "Invalid JSON body." } }); return; }
  console.error(err);
  res.status(500).json({ error: { code: "server_error", message: "Something went wrong. Please try again." } });
};
