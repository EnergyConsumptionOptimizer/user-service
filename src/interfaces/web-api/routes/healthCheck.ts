import { type Request, type Response } from "express";

export const healthCheck = (_request: Request, response: Response): void => {
  response.status(200).json({ status: "ok" });
};
