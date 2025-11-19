import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  model?: string; // Optional model selection
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  // Prefer OpenAI API if configured, otherwise fall back to Forge
  if (ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0) {
    return `${ENV.openaiApiBase.replace(/\/$/, "")}/chat/completions`;
  }
  
  if (ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0) {
    return `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`;
  }
  
  return "https://forge.manus.im/v1/chat/completions";
};

const assertApiKey = () => {
  if (!ENV.openaiApiKey && !ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY or BUILT_IN_FORGE_API_KEY must be configured");
  }
};

const getApiKey = () => {
  // Prefer OpenAI API key if configured
  if (ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0) {
    return ENV.openaiApiKey;
  }
  return ENV.forgeApiKey;
};

const getModel = (requestedModel?: string) => {
  // If a specific model is requested, use it
  if (requestedModel) {
    return requestedModel;
  }
  
  // Otherwise, use default based on available API keys
  // Prefer OpenAI if configured
  if (ENV.openaiApiKey && ENV.openaiApiKey.trim().length > 0) {
    return "gpt-4o-mini";
  }
  
  // Fall back to Gemini via Forge
  return "gemini-2.5-flash";
};

// Helper to determine which API to use based on model
const getApiInfoForModel = (model: string) => {
  // OpenAI models
  if (model.startsWith("gpt-") || model.startsWith("o1-")) {
    if (!ENV.openaiApiKey) {
      throw new Error("OPENAI_API_KEY is required for GPT models");
    }
    return {
      url: `${ENV.openaiApiBase.replace(/\/$/, "")}/chat/completions`,
      key: ENV.openaiApiKey,
      provider: "openai" as const,
    };
  }
  
  // Anthropic Claude models
  if (model.startsWith("claude-")) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is required for Claude models");
    }
    return {
      url: "https://api.anthropic.com/v1/messages",
      key: process.env.ANTHROPIC_API_KEY,
      provider: "anthropic" as const,
    };
  }
  
  // xAI Grok models
  if (model.startsWith("grok-")) {
    if (!process.env.XAI_API_KEY) {
      throw new Error("XAI_API_KEY is required for Grok models");
    }
    return {
      url: "https://api.x.ai/v1/chat/completions",
      key: process.env.XAI_API_KEY,
      provider: "xai" as const,
    };
  }
  
  // Google Gemini models
  if (model.startsWith("gemini-")) {
    if (!process.env.GEMINI_API_KEY) {
      // Fall back to Forge if Gemini API key not available
      if (ENV.forgeApiKey) {
        return {
          url: `${ENV.forgeApiUrl || "https://forge.manus.im"}/v1/chat/completions`,
          key: ENV.forgeApiKey,
          provider: "forge" as const,
        };
      }
      throw new Error("GEMINI_API_KEY or BUILT_IN_FORGE_API_KEY is required for Gemini models");
    }
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      key: process.env.GEMINI_API_KEY,
      provider: "gemini" as const,
    };
  }
  
  // Default to Forge for unknown models
  if (ENV.forgeApiKey) {
    return {
      url: `${ENV.forgeApiUrl || "https://forge.manus.im"}/v1/chat/completions`,
      key: ENV.forgeApiKey,
      provider: "forge" as const,
    };
  }
  
  throw new Error(`Unsupported model: ${model}. No API key configured.`);
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    model: requestedModel,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const model = getModel(requestedModel);
  const apiInfo = getApiInfoForModel(model);

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Set max_tokens based on model
  if (model.startsWith("gpt-4o-mini")) {
    payload.max_tokens = 16384; // GPT-4o-mini limit
  } else if (model.startsWith("gpt-")) {
    payload.max_tokens = 16384; // Safe default for GPT models
  } else if (model.startsWith("claude-")) {
    payload.max_tokens = 8192; // Claude models
  } else if (model.startsWith("grok-")) {
    payload.max_tokens = 16384; // Grok models
  } else if (model.startsWith("gemini-")) {
    payload.max_tokens = 8192; // Gemini models
    // Add thinking for Gemini models
    payload.thinking = {
      "budget_tokens": 128
    };
  } else {
    payload.max_tokens = 8192; // Safe default
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetch(apiInfo.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiInfo.key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}
