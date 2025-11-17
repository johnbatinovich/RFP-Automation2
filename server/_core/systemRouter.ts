import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  checkApiConfig: publicProcedure
    .query(() => {
      const { ENV } = require("./env");
      return {
        hasOpenAI: !!ENV.openaiApiKey && ENV.openaiApiKey.length > 0,
        hasForge: !!ENV.forgeApiKey && ENV.forgeApiKey.length > 0,
        openaiKeyLength: ENV.openaiApiKey ? ENV.openaiApiKey.length : 0,
        openaiApiBase: ENV.openaiApiBase,
      };
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
