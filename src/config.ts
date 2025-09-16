import * as dotenv from "dotenv";
import { z } from "zod";
import ms from "ms";

dotenv.config();

function asMs(value: string): ms.StringValue {
  return value as ms.StringValue;
}

const envSchema = z.object({
  PORT: z.string().nonempty(),
  MONGO_URI: z.string().nonempty(),
  JWT_SECRET: z.string().nonempty(),
  JWT_EXPIRES_IN: z.string().nonempty(),
  JWT_REFRESH_EXPIRES_IN: z.string().nonempty(),
  RESET_CODE: z.string().nonempty(),
});

const parsedEnv = envSchema.parse(process.env as unknown);

export const env = {
  PORT: Number(parsedEnv.PORT),
  MONGO_URI: parsedEnv.MONGO_URI,
  JWT_SECRET: parsedEnv.JWT_SECRET,
  JWT_EXPIRES_IN: asMs(parsedEnv.JWT_EXPIRES_IN),
  JWT_REFRESH_EXPIRES_IN: asMs(parsedEnv.JWT_REFRESH_EXPIRES_IN),
  RESET_CODE: parsedEnv.RESET_CODE,
};
