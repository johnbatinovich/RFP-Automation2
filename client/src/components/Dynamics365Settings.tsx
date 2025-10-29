import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Cloud, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Dynamics365Settings() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const { data: integrationStatus } = trpc.dynamics365.isEnabled.useQuery();
  const testConnection = trpc.dynamics365.testConnection.useMutation();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection.mutateAsync();
      setTestResult(result);

      if (result.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isEnabled = integrationStatus?.enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <CardTitle>Dynamics 365 Sales CRM</CardTitle>
          </div>
          <Badge variant={isEnabled ? "default" : "secondary"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          Automatically sync RFPs to Dynamics 365 as leads and opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && (
          <Alert>
            <AlertDescription>
              Dynamics 365 integration is not configured. Contact your administrator to set up the
              connection.
            </AlertDescription>
          </Alert>
        )}

        {isEnabled && (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                When enabled, new RFPs will automatically create leads in Dynamics 365, and
                qualified RFPs will create opportunities.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleTestConnection}
                disabled={isTesting}
                variant="outline"
                size="sm"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      {testResult.success
                        ? "Successfully connected to Dynamics 365 Sales CRM"
                        : testResult.error || "Connection failed"}
                    </AlertDescription>
                    {testResult.details && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
