import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, FileText, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: dashboardData } = trpc.analytics.getDashboard.useQuery();
  const { data: rfps, isLoading } = trpc.rfps.list.useQuery();

  const recentRFPs = rfps?.slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "default",
      in_progress: "secondary",
      under_review: "outline",
      completed: "default",
    };
    return variants[status] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: "New",
      in_progress: "In Progress",
      under_review: "Under Review",
      completed: "Completed",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media RFP Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your RFP automation performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Media RFPs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.activeRFPs.value || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.activeRFPs.trend}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Ad Placements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.pendingPlacements.value || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData?.pendingPlacements.trend}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Response Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.aiResponseRate.value || "0%"}</div>
            <p className="text-xs text-green-600 mt-1">
              {dashboardData?.aiResponseRate.trend}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Proposal Win Rate</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.winRate.value || "0%"}</div>
            <p className="text-xs text-green-600 mt-1">
              {dashboardData?.winRate.trend}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent RFPs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Media RFPs</CardTitle>
              <CardDescription className="mt-1">
                Your most recent RFP submissions and their status
              </CardDescription>
            </div>
            <Link href="/rfps">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : recentRFPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No RFPs found. Create your first RFP to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {recentRFPs.map((rfp) => (
                <div
                  key={rfp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rfp.title}</h3>
                      <Badge variant={getStatusBadge(rfp.status)}>
                        {getStatusLabel(rfp.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rfp.company}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Due: {format(new Date(rfp.dueDate), "MMM dd, yyyy")}</span>
                      {rfp.value && <span>Value: {rfp.value}</span>}
                      {rfp.progress && <span>Progress: {rfp.progress}%</span>}
                      {rfp.owner && <span>Owner: {rfp.owner}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/rfps/${rfp.id}`}>
                      <Button variant="outline" size="sm">
                        View RFP
                      </Button>
                    </Link>
                    <Link href={`/ai/generator?rfpId=${rfp.id}`}>
                      <Button size="sm">
                        Edit Proposal
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Media Assistant Placeholder */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            AI Media Assistant
          </CardTitle>
          <CardDescription>
            Get help with your RFPs and proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Hello! I'm your AI Media RFP Assistant. Here's what's happening today:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>MediaBuyers Agency RFP is due in 8 days (72% complete)</li>
              <li>BrandMax Advertising RFP needs final review</li>
              <li>GlobalBrands Inc. RFP was just assigned to your team</li>
            </ul>
            <p className="mt-4">Would you like me to help with any of these media RFPs?</p>
            <Link href="/ai/analyzer">
              <Button className="mt-4" size="sm">
                Open AI Assistant
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

