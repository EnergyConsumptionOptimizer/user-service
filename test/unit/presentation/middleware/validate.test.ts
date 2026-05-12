import { validate } from "@presentation/rest/middleware/validate";
import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

function mockRequest(overrides?: Partial<Request>): Request {
	return {
		params: {},
		body: {},
		query: {},
		...overrides,
	} as Request;
}

function mockResponse(): Response {
	return {} as Response;
}

describe("validate() middleware", () => {
	const schema = z.object({
		body: z.object({
			username: z.string().nonempty(),
			password: z.string().nonempty(),
		}),
		params: z.object({
			id: z.uuid(),
		}),
	});

	it("should parse and enrich request with valid data and call next", () => {
		const req = mockRequest({
			body: { username: "testuser", password: "secret" },
			params: { id: "550e8400-e29b-41d4-a716-446655440000" },
		});
		const res = mockResponse();
		const next: NextFunction = vi.fn();
		const middleware = validate(schema);

		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});

	it("should throw ZodError when body is invalid", () => {
		const req = mockRequest({
			body: { username: "", password: "" },
			params: { id: "550e8400-e29b-41d4-a716-446655440000" },
		});
		const res = mockResponse();
		const next: NextFunction = vi.fn();
		const middleware = validate(schema);

		expect(() => middleware(req, res, next)).toThrow(z.ZodError);
		expect(next).not.toHaveBeenCalled();
	});

	it("should throw ZodError when params are invalid", () => {
		const req = mockRequest({
			body: { username: "testuser", password: "secret" },
			params: { id: "not-a-uuid" },
		});
		const res = mockResponse();
		const next: NextFunction = vi.fn();
		const middleware = validate(schema);

		expect(() => middleware(req, res, next)).toThrow(z.ZodError);
		expect(next).not.toHaveBeenCalled();
	});

	it("should not overwrite body or params when schema returns undefined for them", () => {
		const optionalSchema = z.object({
			params: z.object({ id: z.string().uuid() }),
		});
		const req = mockRequest({
			body: { original: "keep-me" },
			params: { id: "550e8400-e29b-41d4-a716-446655440000" },
		});
		const res = mockResponse();
		const next: NextFunction = vi.fn();
		const middleware = validate(optionalSchema);

		middleware(req, res, next);

		expect(req.body).toEqual({ original: "keep-me" });
		expect(next).toHaveBeenCalled();
	});
});
