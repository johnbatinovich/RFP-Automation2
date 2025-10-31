import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Bypass authentication for demo/POC - create a mock user
  const user: User = {
    id: "demo-user-001",
    name: "Demo User",
    email: "demo@rfpautomation.com",
    loginMethod: "demo",
    lastSignedIn: new Date(),
  };

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
