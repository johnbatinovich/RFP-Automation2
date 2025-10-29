import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Send, FileText, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProposalGenerator() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const rfpId = searchParams.get("rfpId") || "";

  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const { data: rfp } = trpc.rfps.getById.useQuery({ id: rfpId }, { enabled: !!rfpId });
  const { data: proposal, refetch: refetchProposal } = trpc.proposals.getByRFPId.useQuery(
    { rfpId },
    { enabled: !!rfpId }
  );
  const { data: knowledgeBase } = trpc.knowledgeBase.list.useQuery();

  const updateProposal = trpc.proposals.update.useMutation();
  const generateResponse = trpc.proposals.generateResponse.useMutation();
  const analyzeDocument = trpc.ai.analyzeDocument.useMutation();
  const extractQuestions = trpc.ai.extractQuestions.useMutation();
  const generateResponses = trpc.ai.generateResponses.useMutation();
  const qualityCheck = trpc.ai.qualityCheck.useMutation();

  useEffect(() => {
    if (proposal?.content) {
      setContent(proposal.content);
    }
  }, [proposal]);

  const handleAnalyzeDocument = async () => {
    if (!rfp) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeDocument.mutateAsync({
        rfpId: rfp.id,
        content: rfp.title + "\n" + rfp.company,
      });

      if (result.success) {
        toast.success("Document analyzed successfully!");
        console.log("Analysis:", result.analysis);
      } else {
        toast.error(result.error || "Failed to analyze document");
      }
    } catch (error) {
      toast.error("Error analyzing document");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExtractQuestions = async () => {
    if (!rfp) return;
    
    setIsExtracting(true);
    try {
      const result = await extractQuestions.mutateAsync({
        rfpId: rfp.id,
        rfpContent: `${rfp.title}\nCompany: ${rfp.company}\nValue: ${rfp.value}\n\nPlease provide the following information:\n1. Your company's experience with similar campaigns\n2. Proposed media mix and audience targeting strategy\n3. Pricing and timeline\n4. Case studies or references`,
      });

      if (result.success && result.questions) {
        toast.success(`Extracted ${result.questions.length} questions`);
        console.log("Questions:", result.questions);
      } else {
        toast.error(result.error || "Failed to extract questions");
      }
    } catch (error) {
      toast.error("Error extracting questions");
      console.error(error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleGenerateResponses = async () => {
    if (!rfp) return;
    
    setIsGenerating(true);
    try {
      // First extract questions
      const extractResult = await extractQuestions.mutateAsync({
        rfpId: rfp.id,
        rfpContent: `${rfp.title}\nCompany: ${rfp.company}\nValue: ${rfp.value}\n\nPlease provide the following information:\n1. Your company's experience with similar campaigns\n2. Proposed media mix and audience targeting strategy\n3. Pricing and timeline\n4. Case studies or references`,
      });

      if (!extractResult.success || !extractResult.questions) {
        toast.error("Failed to extract questions");
        return;
      }

      // Then generate responses
      const generateResult = await generateResponses.mutateAsync({
        rfpId: rfp.id,
        questions: extractResult.questions,
      });

      if (generateResult.success && generateResult.responses) {
        // Format the responses into a proposal
        const proposalContent = `Dear ${rfp.company},

Thank you for your interest in our media advertising solutions. We are pleased to present our comprehensive proposal for ${rfp.title}.

${generateResult.responses.map((r: any, i: number) => `
**${extractResult.questions[i]?.question || `Question ${i + 1}`}**

${r.answer}
`).join("\n")}

We look forward to discussing this proposal with you in detail.

Best regards,
Media Sales Team`;

        setContent(proposalContent);
        
        // Save to database
        if (proposal) {
          await updateProposal.mutateAsync({
            id: proposal.id,
            data: { content: proposalContent },
          });
        }

        toast.success("Proposal generated successfully!");
        refetchProposal();
      } else {
        toast.error(generateResult.error || "Failed to generate responses");
      }
    } catch (error) {
      toast.error("Error generating proposal");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQualityCheck = async () => {
    if (!proposal || !content) {
      toast.error("No proposal content to check");
      return;
    }
    
    setIsChecking(true);
    try {
      const result = await qualityCheck.mutateAsync({
        proposalId: proposal.id,
        content,
        rfpRequirements: rfp?.title,
      });

      if (result.success) {
        toast.success(`Quality Score: ${result.qualityScore}/100`);
        refetchProposal();
      } else {
        toast.error(result.error || "Failed to perform quality check");
      }
    } catch (error) {
      toast.error("Error performing quality check");
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (!proposal) return;

    try {
      await updateProposal.mutateAsync({
        id: proposal.id,
        data: { content },
      });
      toast.success("Proposal saved successfully!");
      refetchProposal();
    } catch (error) {
      toast.error("Failed to save proposal");
    }
  };

  const qualityScore = parseInt(proposal?.qualityScore || "0");
  const completeness = parseInt(proposal?.completeness || "0");
  const relevance = parseInt(proposal?.relevance || "0");
  const clarity = parseInt(proposal?.clarity || "0");
  const competitiveDiff = parseInt(proposal?.competitiveDiff || "0");
  const alignment = parseInt(proposal?.alignment || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setLocation(`/rfps/${rfpId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFP
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI-Powered RFP Assistant</h1>
            <p className="text-muted-foreground mt-1">
              Generate and edit proposal for: {rfp?.title}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Save as Template
          </Button>
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Proposal Content</CardTitle>
                  <CardDescription>AI-generated response that you can edit and customize</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateResponses}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {isGenerating ? "Generating..." : "Regenerate"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerateResponses}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Click 'Generate' to create an AI-powered proposal response..."
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">{content.length} characters</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSave} disabled={updateProposal.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Client
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={handleAnalyzeDocument}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isAnalyzing ? "Analyzing..." : "Analyze Document"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={handleExtractQuestions}
                  disabled={isExtracting}
                >
                  {isExtracting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isExtracting ? "Extracting..." : "Extract Questions"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={handleGenerateResponses}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isGenerating ? "Generating..." : "Generate Responses"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={handleQualityCheck}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {isChecking ? "Checking..." : "Quality Check"}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Response Quality Score</CardTitle>
              <CardDescription>AI-powered quality assessment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold">{qualityScore}</div>
                <p className="text-sm text-muted-foreground mt-1">Quality Score</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completeness</span>
                    <span className="font-medium">{completeness}%</span>
                  </div>
                  <Progress value={completeness} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Relevance</span>
                    <span className="font-medium">{relevance}%</span>
                  </div>
                  <Progress value={relevance} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Clarity</span>
                    <span className="font-medium">{clarity}%</span>
                  </div>
                  <Progress value={clarity} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Competitive Differentiation</span>
                    <span className="font-medium">{competitiveDiff}%</span>
                  </div>
                  <Progress value={competitiveDiff} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Alignment with RFP</span>
                    <span className="font-medium">{alignment}%</span>
                  </div>
                  <Progress value={alignment} />
                </div>
              </div>

              {proposal?.improvementSuggestion && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm">
                    <span className="font-semibold">💡 Improvement Suggestion:</span>{" "}
                    {proposal.improvementSuggestion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Resources</CardTitle>
              <CardDescription>Relevant documents for this RFP</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {knowledgeBase?.slice(0, 3).map((kb) => (
                  <Button
                    key={kb.id}
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {kb.title}
                  </Button>
                ))}
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => setLocation("/knowledge-base")}
                >
                  Manage Knowledge Base
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

