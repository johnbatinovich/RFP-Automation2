import * as msal from "@azure/msal-node";

interface Dynamics365Config {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  environmentUrl: string;
  apiVersion?: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

// Cache tokens per tenant to avoid unnecessary token requests
const tokenCache = new Map<string, TokenCache>();

/**
 * Get Dynamics 365 configuration from environment variables
 */
export function getDynamics365Config(): Dynamics365Config | null {
  const tenantId = process.env.DYNAMICS_365_TENANT_ID;
  const clientId = process.env.DYNAMICS_365_CLIENT_ID;
  const clientSecret = process.env.DYNAMICS_365_CLIENT_SECRET;
  const environmentUrl = process.env.DYNAMICS_365_ENVIRONMENT_URL;

  if (!tenantId || !clientId || !clientSecret || !environmentUrl) {
    return null;
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    environmentUrl,
    apiVersion: process.env.DYNAMICS_365_API_VERSION || "v9.2",
  };
}

/**
 * Check if Dynamics 365 integration is enabled
 */
export function isDynamics365Enabled(): boolean {
  const config = getDynamics365Config();
  const enabled = process.env.ENABLE_DYNAMICS_365_INTEGRATION === "true";
  return enabled && config !== null;
}

/**
 * Create MSAL confidential client application
 */
function createMsalClient(config: Dynamics365Config): msal.ConfidentialClientApplication {
  const msalConfig: msal.Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      clientSecret: config.clientSecret,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          switch (level) {
            case msal.LogLevel.Error:
              console.error(message);
              break;
            case msal.LogLevel.Warning:
              console.warn(message);
              break;
            default:
              // Suppress info and verbose logs in production
              if (process.env.NODE_ENV === "development") {
                console.log(message);
              }
              break;
          }
        },
        piiLoggingEnabled: false,
        logLevel: process.env.NODE_ENV === "development" ? msal.LogLevel.Info : msal.LogLevel.Warning,
      },
    },
  };

  return new msal.ConfidentialClientApplication(msalConfig);
}

/**
 * Get access token for Dynamics 365 API
 * Uses client credentials flow for server-to-server authentication
 */
export async function getDynamics365AccessToken(): Promise<string> {
  const config = getDynamics365Config();
  
  if (!config) {
    throw new Error("Dynamics 365 configuration is not available");
  }

  // Check cache first
  const cacheKey = `${config.tenantId}:${config.clientId}`;
  const cached = tokenCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minute buffer
    return cached.token;
  }

  try {
    const msalClient = createMsalClient(config);
    
    // Use client credentials flow with .default scope
    const scope = `${config.environmentUrl}/.default`;
    
    const authResult = await msalClient.acquireTokenByClientCredential({
      scopes: [scope],
    });

    if (!authResult || !authResult.accessToken) {
      throw new Error("Failed to acquire access token");
    }

    // Cache the token
    tokenCache.set(cacheKey, {
      token: authResult.accessToken,
      expiresAt: authResult.expiresOn?.getTime() || Date.now() + 3600000, // Default 1 hour
    });

    return authResult.accessToken;
  } catch (error) {
    console.error("Error acquiring Dynamics 365 access token:", error);
    throw new Error(`Failed to authenticate with Dynamics 365: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get the base URL for Dynamics 365 Web API
 */
export function getDynamics365ApiUrl(): string {
  const config = getDynamics365Config();
  
  if (!config) {
    throw new Error("Dynamics 365 configuration is not available");
  }

  return `${config.environmentUrl}/api/data/${config.apiVersion}`;
}

/**
 * Clear token cache (useful for testing or when credentials change)
 */
export function clearTokenCache(): void {
  tokenCache.clear();
}
