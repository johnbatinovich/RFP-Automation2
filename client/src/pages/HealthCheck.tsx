import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function HealthCheck() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: healthData, refetch: refetchHealth } = trpc.health.check.useQuery();
  const testOpenAI = trpc.health.testOpenAI.useQuery(undefined, { enabled: false });

  const handleTestOpenAI = async () => {
    setIsTesting(true);
    try {
      const result = await testOpenAI.refetch();
      setTestResult(result.data);
    } catch (error) {
      setTestResult({ success: false, error: "Failed to run test" });
    } finally {
      setIsTesting(false);
    }
  };

  const StatusBadge = ({ status }: { status: boolean }) => {
    return status ? (
      <Badge className="bg-green-600">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Configured
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Not Configured
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health Check</h1>
          <p className="text-muted-foreground mt-1">
            Diagnostic information for debugging deployment issues
          </p>
        </div>
        <Button onClick={() => refetchHealth()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Overall system health and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {healthData && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{healthData.status.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Environment</p>
                  <p className="text-lg font-semibold">
                    {healthData.environment.isProduction ? "Production" : "Development"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                <p className="text-sm">{new Date(healthData.timestamp).toLocaleString()}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys Configuration</CardTitle>
          <CardDescription>Check which API keys are configured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthData && (
            <>
              {/* OpenAI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">OpenAI API</h3>
                  <StatusBadge status={healthData.apiKeys.openai.configured} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Key Length</p>
                    <p className="font-mono">{healthData.apiKeys.openai.length} characters</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">API Base</p>
                    <p className="font-mono text-xs">{healthData.apiKeys.openai.base}</p>
                  </div>
                </div>
              </div>

              {/* Forge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Forge API (Fallback)</h3>
                  <StatusBadge status={healthData.apiKeys.forge.configured} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Key Length</p>
                    <p className="font-mono">{healthData.apiKeys.forge.length} characters</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">API URL</p>
                    <p className="font-mono text-xs">{healthData.apiKeys.forge.url}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Database Configuration</CardTitle>
          <CardDescription>PostgreSQL database connection status</CardDescription>
        </CardHeader>
        <CardContent>
          {healthData && (
            <div className="flex items-center justify-between">
              <p className="font-medium">Database URL</p>
              <StatusBadge status={healthData.database.configured} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* OpenAI API Test */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Test</CardTitle>
          <CardDescription>Test the OpenAI API connection and functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTestOpenAI} disabled={isTesting}>
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Run OpenAI Test"
            )}
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
              {testResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-800 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Test Successful
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Model:</span> {testResult.model}</p>
                    <p><span className="font-medium">Response:</span> {testResult.content}</p>
                    {testResult.usage && (
                      <p><span className="font-medium">Tokens:</span> {testResult.usage.total_tokens}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-800 font-semibold">
                    <XCircle className="h-5 w-5" />
                    Test Failed
                  </div>
                  <div className="text-sm space-y-2">
                    <p><span className="font-medium">Error:</span> {testResult.error}</p>
                    {testResult.environment && (
                      <div className="mt-2 p-2 bg-white rounded border border-red-300">
                        <p className="font-medium mb-1">Environment Info:</p>
                        <p>Has OpenAI Key: {testResult.environment.hasOpenAIKey ? "Yes" : "No"}</p>
                        <p>Key Length: {testResult.environment.openAIKeyLength} characters</p>
                        <p>API Base: {testResult.environment.openAIBase}</p>
                      </div>
                    )}
                    {testResult.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer font-medium">Stack Trace</summary>
                        <pre className="mt-2 p-2 bg-white rounded border border-red-300 text-xs overflow-auto">
                          {testResult.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Troubleshooting Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">If OpenAI API is not configured:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to Railway dashboard</li>
              <li>Select your project</li>
              <li>Go to Variables tab</li>
              <li>Add <code className="bg-muted px-1 py-0.5 rounded">OPENAI_API_KEY</code> with your API key</li>
              <li>Redeploy the application</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold mb-1">If API test fails:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Check if the API key is valid</li>
              <li>Verify you have credits in your OpenAI account</li>
              <li>Check the error message and stack trace above</li>
              <li>Ensure <code className="bg-muted px-1 py-0.5 rounded">OPENAI_API_BASE</code> is correct (default: https://api.openai.com/v1)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
