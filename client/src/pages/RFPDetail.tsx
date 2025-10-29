import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, FileText, Users, BarChart3, MessageSquare, Calendar, DollarSign, Building } from "lucide-react";
import { TeamCollaborationCard } from "@/components/TeamCollaborationCard";
import Dynamics365SyncButton from "@/components/Dynamics365SyncButton";

export default function RFPDetail() {
  const params = useParams();
  const rfpId = params.id as string;
  
  const { data: rfp, isLoading } = trpc.rfps.getById.useQuery({ id: rfpId });
  const { data: proposal } = trpc.proposals.getByRFPId.useQuery({ rfpId });
  const { data: teamMembers } = trpc.teamMembers.list.useQuery();

  if (isLoading) {
    return <div className="text-center py-12">Loading RFP details...</div>;
  }

  if (!rfp) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">RFP Not Found</h2>
        <p className="text-muted-foreground mt-2">The RFP you're looking for doesn't exist.</p>
        <Link href="/rfps">
          <Button className="mt-4">Back to RFPs</Button>
        </Link>
      </div>
    );
  }

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

  const progressNum = parseInt(rfp.progress || "0");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/rfps">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to RFPs
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{rfp.title}</h1>
            <Badge variant={getStatusBadge(rfp.status)}>
              {getStatusLabel(rfp.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground">{rfp.company}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dynamics365SyncButton rfpId={rfp.id} />
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View RFP Document
          </Button>
          <Link href={`/ai/generator?rfpId=${rfp.id}`}>
            <Button>
              Edit Proposal
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(rfp.dueDate), "MMM dd")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(rfp.dueDate), "yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rfp.value || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Campaign value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rfp.progress}%</div>
            <Progress value={progressNum} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{rfp.owner || "Unassigned"}</div>
            <p className="text-xs text-muted-foreground">Account Executive</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposal">Proposal</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RFP Details</CardTitle>
              <CardDescription>Key information about this RFP</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Company</h4>
                  <p className="text-base">{rfp.company}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <Badge variant={getStatusBadge(rfp.status)}>
                    {getStatusLabel(rfp.status)}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p className="text-base">
                    {rfp.createdAt ? format(new Date(rfp.createdAt), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                  <p className="text-base">
                    {rfp.updatedAt ? format(new Date(rfp.updatedAt), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completion Status</CardTitle>
              <CardDescription>Track progress across different sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Media Placements</span>
                    <span className="text-sm text-muted-foreground">95%</span>
                  </div>
                  <Progress value={95} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Rate Card & Pricing</span>
                    <span className="text-sm text-muted-foreground">85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Audience Targeting</span>
                    <span className="text-sm text-muted-foreground">15%</span>
                  </div>
                  <Progress value={15} className="[&>div]:bg-red-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Campaign Timeline</span>
                    <span className="text-sm text-muted-foreground">0%</span>
                  </div>
                  <Progress value={0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Proposal</CardTitle>
                  <CardDescription>AI-generated response to this RFP</CardDescription>
                </div>
                <Link href={`/ai/generator?rfpId=${rfp.id}`}>
                  <Button>Edit Proposal</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {proposal ? (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{proposal.content || "No content generated yet."}</p>
                  </div>
                  
                  {proposal.qualityScore && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold mb-3">Quality Score: {proposal.qualityScore}/100</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Completeness</span>
                          <span className="text-sm font-medium">{proposal.completeness}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Relevance</span>
                          <span className="text-sm font-medium">{proposal.relevance}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Clarity</span>
                          <span className="text-sm font-medium">{proposal.clarity}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No proposal generated yet</p>
                  <Link href={`/ai/generator?rfpId=${rfp.id}`}>
                    <Button className="mt-4">Generate Proposal</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamCollaborationCard rfpId={rfp.id} />

        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Proposal generated</p>
                    <p className="text-sm text-muted-foreground">AI generated initial response</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Team member assigned</p>
                    <p className="text-sm text-muted-foreground">John Doe was assigned to this RFP</p>
                    <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">RFP created</p>
                    <p className="text-sm text-muted-foreground">RFP was imported from email</p>
                    <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

