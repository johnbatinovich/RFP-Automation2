import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { format } from "date-fns";
import { Search, Plus, FileText, Upload } from "lucide-react";
import { ImportRFPDialog } from "@/components/ImportRFPDialog";
import { useState } from "react";

export default function RFPsList() {
  const { data: rfps, isLoading } = trpc.rfps.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRFPs = rfps?.filter((rfp) =>
    rfp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rfp.company.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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

  const getProgressColor = (progress: string) => {
    const num = parseInt(progress);
    if (num >= 90) return "bg-green-500";
    if (num >= 70) return "bg-blue-500";
    if (num >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Media RFPs</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your RFP submissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportRFPDialog
            trigger={
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import RFP
              </Button>
            }
          />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New RFP
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RFPs by title or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RFPs Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading RFPs...</div>
      ) : filteredRFPs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No RFPs found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search" : "Create your first RFP to get started"}
                </p>
              </div>
              {!searchQuery && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New RFP
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRFPs.map((rfp) => (
            <Card key={rfp.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">{rfp.title}</CardTitle>
                    <CardDescription>{rfp.company}</CardDescription>
                  </div>
                  <Badge variant={getStatusBadge(rfp.status)}>
                    {getStatusLabel(rfp.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{rfp.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(rfp.progress || "0")} transition-all`}
                      style={{ width: `${rfp.progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due Date</span>
                    <span className="font-medium">
                      {format(new Date(rfp.dueDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  {rfp.value && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Value</span>
                      <span className="font-medium">{rfp.value}</span>
                    </div>
                  )}
                  {rfp.owner && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-medium">{rfp.owner}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/rfps/${rfp.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/ai/generator?rfpId=${rfp.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Edit Proposal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

