import { router, publicProcedure } from "./_core/trpc";
import { ENV } from "./_core/env";

export const healthRouter = router({
  check: publicProcedure.query(async () => {
    const hasOpenAIKey = !!ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0;
    const hasForgeKey = !!ENV.forgeApiKey && ENV.forgeApiKey.trim().length > 0;
    
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: ENV.isProduction,
      },
      apiKeys: {
        openai: {
          configured: hasOpenAIKey,
          length: ENV.openaiApiKey?.length || 0,
          base: ENV.openaiApiBase,
        },
        forge: {
          configured: hasForgeKey,
          length: ENV.forgeApiKey?.length || 0,
          url: ENV.forgeApiUrl || "default",
        },
      },
      database: {
        configured: !!ENV.databaseUrl,
      },
    };
  }),

  testOpenAI: publicProcedure.query(async () => {
    const { invokeLLM } = await import("./_core/llm");
    
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "Say 'API test successful' if you can read this."
          }
        ],
        maxTokens: 50,
      });

      const messageContent = response.choices[0]?.message?.content;
      const content = typeof messageContent === 'string' ? messageContent : "No content";
      
      return {
        success: true,
        model: response.model,
        content,
        usage: response.usage,
      };
    } catch (error) {
      console.error("OpenAI test failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : "No stack trace";
      
      return {
        success: false,
        error: errorMessage,
        stack: errorStack,
        environment: {
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
          openAIBase: process.env.OPENAI_API_BASE || "not set",
        },
      };
    }
  }),
});
