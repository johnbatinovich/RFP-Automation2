import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Target,
  Award,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Download,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";

export default function QualityChecker() {
  const [selectedRFPId, setSelectedRFPId] = useState<string>("select");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: rfps } = trpc.rfps.list.useQuery();
  const { data: selectedRFP } = trpc.rfps.getById.useQuery(
    { id: selectedRFPId },
    { enabled: selectedRFPId !== "select" }
  );
  const { data: proposal } = trpc.proposals.getByRFPId.useQuery(
    { rfpId: selectedRFPId },
    { enabled: selectedRFPId !== "select" }
  );

  const utils = trpc.useUtils();
  const analyzeQuality = trpc.ai.analyzeProposalQuality.useMutation({
    onSuccess: () => {
      toast.success("Quality analysis complete!");
      utils.proposals.getByRFPId.invalidate();
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error("Analysis failed: " + error.message);
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = async () => {
    if (selectedRFPId === "select") {
      toast.error("Please select an RFP first");
      return;
    }
    if (!proposal?.content) {
      toast.error("No proposal content to analyze");
      return;
    }

    setIsAnalyzing(true);
    analyzeQuality.mutate({ rfpId: selectedRFPId });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "Excellent" };
    if (score >= 60) return { variant: "secondary" as const, label: "Good" };
    return { variant: "destructive" as const, label: "Needs Improvement" };
  };

  const overallScore = proposal ? calculateOverallScore(proposal) : 0;
  const scoreBadge = getScoreBadge(overallScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Checker</h1>
          <p className="text-muted-foreground mt-1">
            Analyze proposal quality and get actionable improvement suggestions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!proposal}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* RFP Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedRFPId} onValueChange={setSelectedRFPId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an RFP to analyze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select an RFP</SelectItem>
                  {rfps?.map((rfp) => (
                    <SelectItem key={rfp.id} value={rfp.id}>
                      {rfp.title} - {rfp.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={selectedRFPId === "select" || isAnalyzing || !proposal?.content}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Quality
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* No Selection State */}
      {selectedRFPId === "select" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No RFP Selected</h3>
                <p className="text-muted-foreground mt-1">
                  Select an RFP from the dropdown above to analyze its proposal quality
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Proposal State */}
      {selectedRFPId !== "select" && !proposal?.content && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Proposal Found</AlertTitle>
          <AlertDescription>
            This RFP doesn't have a proposal yet. Please generate a proposal first using the Proposal Generator.
          </AlertDescription>
        </Alert>
      )}

      {/* Quality Analysis Results */}
      {selectedRFPId !== "select" && proposal?.content && (
        <>
          {/* Overall Score Card */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Overall Quality Score</CardTitle>
                  <CardDescription>Comprehensive analysis of your proposal</CardDescription>
                </div>
                <Badge variant={scoreBadge.variant} className="text-lg px-4 py-2">
                  {scoreBadge.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}%
                  </span>
                  <Award className={`h-16 w-16 ${getScoreColor(overallScore)}`} />
                </div>
                <Progress value={overallScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Last analyzed: {proposal.updatedAt ? format(new Date(proposal.updatedAt), "MMM dd, yyyy 'at' h:mm a") : "Never"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Metrics */}
          <Tabs defaultValue="metrics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
              <TabsTrigger value="suggestions">Improvements</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <QualityMetricCard
                  title="Completeness"
                  score={parseInt(proposal.completeness || "0")}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  description="Coverage of all RFP requirements"
                />
                <QualityMetricCard
                  title="Relevance"
                  score={parseInt(proposal.relevance || "0")}
                  icon={<Target className="h-5 w-5" />}
                  description="Alignment with RFP objectives"
                />
                <QualityMetricCard
                  title="Clarity"
                  score={parseInt(proposal.clarity || "0")}
                  icon={<FileText className="h-5 w-5" />}
                  description="Clear and concise writing"
                />
                <QualityMetricCard
                  title="Competitive Differentiation"
                  score={parseInt(proposal.competitiveDiff || "0")}
                  icon={<TrendingUp className="h-5 w-5" />}
                  description="Unique value proposition"
                />
                <QualityMetricCard
                  title="Strategic Alignment"
                  score={parseInt(proposal.alignment || "0")}
                  icon={<BarChart3 className="h-5 w-5" />}
                  description="Fits client's strategic goals"
                />
                <QualityMetricCard
                  title="Overall Quality"
                  score={parseInt(proposal.qualityScore || "0")}
                  icon={<Award className="h-5 w-5" />}
                  description="Comprehensive quality assessment"
                />
              </div>
            </TabsContent>

            {/* Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Improvement Suggestions
                  </CardTitle>
                  <CardDescription>
                    AI-powered recommendations to enhance your proposal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proposal.improvementSuggestion ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm">
                        {proposal.improvementSuggestion}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No improvement suggestions yet.</p>
                      <p className="text-sm mt-2">Click "Analyze Quality" to get AI-powered recommendations.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Wins */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Wins</CardTitle>
                  <CardDescription>Easy improvements for immediate impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getQuickWins(proposal).map((win, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className="mt-0.5">{win.icon}</div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{win.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{win.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>RFP Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-muted-foreground">Title</dt>
                      <dd className="mt-1">{selectedRFP?.title}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">Company</dt>
                      <dd className="mt-1">{selectedRFP?.company}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">Due Date</dt>
                      <dd className="mt-1">
                        {selectedRFP?.dueDate ? format(new Date(selectedRFP.dueDate), "MMM dd, yyyy") : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">Value</dt>
                      <dd className="mt-1">{selectedRFP?.value || "N/A"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">Status</dt>
                      <dd className="mt-1">
                        <Badge>{selectedRFP?.status?.replace("_", " ")}</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">Proposal Status</dt>
                      <dd className="mt-1">
                        <Badge variant="secondary">{proposal.status?.replace("_", " ")}</Badge>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>Track quality improvements over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Analysis history coming soon</p>
                    <p className="text-sm mt-2">Track quality score changes over multiple analyses</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Quality Metric Card Component
function QualityMetricCard({
  title,
  score,
  icon,
  description,
}: {
  title: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={score} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Helper Functions
function calculateOverallScore(proposal: any): number {
  const scores = [
    parseInt(proposal.completeness || "0"),
    parseInt(proposal.relevance || "0"),
    parseInt(proposal.clarity || "0"),
    parseInt(proposal.competitiveDiff || "0"),
    parseInt(proposal.alignment || "0"),
    parseInt(proposal.qualityScore || "0"),
  ];
  
  const validScores = scores.filter(s => s > 0);
  if (validScores.length === 0) return 0;
  
  return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
}

function getQuickWins(proposal: any) {
  const wins = [];
  const completeness = parseInt(proposal.completeness || "0");
  const relevance = parseInt(proposal.relevance || "0");
  const clarity = parseInt(proposal.clarity || "0");

  if (completeness < 80) {
    wins.push({
      icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
      title: "Improve Completeness",
      description: "Review all RFP requirements and ensure each section is fully addressed",
    });
  }

  if (relevance < 80) {
    wins.push({
      icon: <Target className="h-5 w-5 text-purple-600" />,
      title: "Enhance Relevance",
      description: "Align your proposal more closely with the client's specific needs and objectives",
    });
  }

  if (clarity < 80) {
    wins.push({
      icon: <FileText className="h-5 w-5 text-green-600" />,
      title: "Increase Clarity",
      description: "Simplify complex sentences and use clear, concise language throughout",
    });
  }

  if (wins.length === 0) {
    wins.push({
      icon: <Award className="h-5 w-5 text-yellow-600" />,
      title: "Excellent Work!",
      description: "Your proposal scores are strong. Focus on maintaining this quality level",
    });
  }

  return wins;
}
