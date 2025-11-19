import { useState } from "react";
import { useLocation } from "wouter";
import ModelSelector from "@/components/ModelSelector";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  FileSearch,
  Calendar,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  Award,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Download,
  Sparkles,
  FileText,
  ListChecks,
  Upload,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function RFPAnalyzer() {
  const [selectedRfpId, setSelectedRfpId] = useState<string>("select");
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedContent, setUploadedContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [createdRfpId, setCreatedRfpId] = useState<string | null>(null); // Track created RFP ID for redirect

  const { data: rfps } = trpc.rfps.list.useQuery();
  const { data: selectedRFP } = trpc.rfps.getById.useQuery(
    { id: selectedRfpId },
    { enabled: selectedRfpId !== "select" }
  );

  const [, navigate] = useLocation();

  const analyzeDocument = trpc.ai.analyzeDocument.useMutation({
    onSuccess: (result) => {
      if (result.success && result.analysis) {
        setAnalysisResult(result.analysis);
        toast.success("Analysis complete! Redirecting to RFP details...");
        // Navigate to the RFP detail page after a short delay
        setTimeout(() => {
          // Use createdRfpId for uploaded documents, otherwise use selectedRfpId
          const rfpIdToNavigate = createdRfpId || selectedRfpId;
          if (rfpIdToNavigate && rfpIdToNavigate !== "select" && rfpIdToNavigate !== "uploaded") {
            navigate(`/rfps/${rfpIdToNavigate}`);
          } else {
            console.error("No valid RFP ID to navigate to", { createdRfpId, selectedRfpId });
            toast.error("Cannot navigate to RFP details - no valid ID");
          }
        }, 1500);
      } else {
        toast.error(result.error || "Analysis failed");
      }
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error("Analysis failed: " + error.message);
      setIsAnalyzing(false);
    },
  });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    // Use the bundled worker from node_modules
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const createRFP = trpc.rfps.create.useMutation({
    onSuccess: (data) => {
      toast.success("RFP saved successfully!");
      // Refetch RFPs to update the dropdown
      rfpsQuery.refetch();
      // Store the created RFP ID for redirect after analysis
      setCreatedRfpId(data.id);
      setSelectedRfpId(data.id);
      // Note: Don't clear upload state yet - we need it for analysis
      // The analysis will navigate away, so no need to clear
    },
    onError: (error) => {
      toast.error("Failed to save RFP: " + error.message);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);

    try {
      let text = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'pdf') {
        text = await extractTextFromPDF(file);
      } else if (fileExtension === 'docx') {
        text = await extractTextFromDOCX(file);
      } else {
        // Plain text files
        text = await file.text();
      }
      
      setUploadedContent(text);
      
      // Extract title from filename (remove extension)
      const title = file.name.replace(/\.[^/.]+$/, "");
      
      // Save RFP to database
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days from now
      createRFP.mutate({
        title,
        company: "Uploaded Document", // Can be extracted from content later
        dueDate: dueDate.toISOString(), // Convert Date to ISO string
        value: "",
        owner: "System",
        status: "new",
        rfpDocumentName: file.name,
        rfpContent: text,
        uploadedBy: "Current User", // Will be replaced with actual user when auth is implemented
      });
      
      toast.success(`File "${file.name}" uploaded and processed successfully`);
    } catch (error) {
      toast.error("Failed to read file: " + (error as Error).message);
      console.error(error);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedContent("");
    setAnalysisResult("");
    setCreatedRfpId(null); // Clear created RFP ID
  };

  const handleAnalyzeUploadedFile = async () => {
    if (!uploadedFile || !uploadedContent) {
      toast.error("Please upload a file first");
      return;
    }

    setIsAnalyzing(true);
    analyzeDocument.mutate({
      rfpId: "uploaded",
      content: uploadedContent,
      model: selectedModel,
    });
  };

  const handleAnalyze = async () => {
    if (selectedRfpId === "select") {
      toast.error("Please select an RFP first");
      return;
    }

    if (!selectedRFP) {
      toast.error("RFP not found");
      return;
    }

    setIsAnalyzing(true);
    const content = `
Title: ${selectedRFP.title}
Company: ${selectedRFP.company}
Due Date: ${selectedRFP.dueDate ? format(new Date(selectedRFP.dueDate), "MMMM dd, yyyy") : "Not specified"}
Value: ${selectedRFP.value || "Not specified"}
Status: ${selectedRFP.status}
Owner: ${selectedRFP.owner || "Not assigned"}

Additional Context:
This is a media advertising RFP that requires a comprehensive proposal covering campaign strategy, media mix, audience targeting, pricing, and timeline.
    `.trim();

    analyzeDocument.mutate({
      rfpId: selectedRfpId,
      content,
      model: selectedModel,
    });
  };

  const parseAnalysis = (analysis: string) => {
    const sections = {
      requirements: [] as string[],
      criteria: [] as string[],
      audience: [] as string[],
      metrics: [] as string[],
      insights: [] as string[],
    };

    const lines = analysis.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.toLowerCase().includes('requirement')) {
        currentSection = 'requirements';
      } else if (trimmed.toLowerCase().includes('criteria') || trimmed.toLowerCase().includes('evaluation')) {
        currentSection = 'criteria';
      } else if (trimmed.toLowerCase().includes('audience') || trimmed.toLowerCase().includes('target')) {
        currentSection = 'audience';
      } else if (trimmed.toLowerCase().includes('metric') || trimmed.toLowerCase().includes('success')) {
        currentSection = 'metrics';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
        const item = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
        if (currentSection && sections[currentSection as keyof typeof sections]) {
          sections[currentSection as keyof typeof sections].push(item);
        }
      } else if (trimmed.length > 20 && !trimmed.endsWith(':')) {
        sections.insights.push(trimmed);
      }
    }

    return sections;
  };

  const analysis = analysisResult ? parseAnalysis(analysisResult) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RFP Analyzer</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of RFP requirements and strategic insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!analysisResult}>
            <Download className="h-4 w-4 mr-2" />
            Export Analysis
          </Button>
        </div>
      </div>

      {/* RFP Selector with Upload Option */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="existing" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing RFP</TabsTrigger>
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                  <Select value={selectedRfpId} onValueChange={(value) => {
                    setSelectedRfpId(value);
                    setUploadedFile(null);
                    setUploadedContent("");
                    setAnalysisResult("");
                    setCreatedRfpId(null); // Clear created RFP ID when selecting existing
                  }}>
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
                </div>
                
                <ModelSelector
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={isAnalyzing}
                />
                
                <Button
                  onClick={handleAnalyze}
                  disabled={selectedRfpId === "select" || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze RFP
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              {!uploadedFile ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Upload RFP Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload an RFP document (.pdf, .docx, .txt, .md) for AI-powered analysis
                  </p>
                  <label htmlFor="rfp-upload" className="cursor-pointer">
                    <Button asChild disabled={isUploading}>
                      <span>
                        {isUploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="rfp-upload"
                    type="file"
                    accept=".txt,.md,.text,.pdf,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ModelSelector
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    disabled={isAnalyzing}
                  />
                  
                  <Button
                    onClick={handleAnalyzeUploadedFile}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Uploaded Document
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* No Selection State */}
      {selectedRfpId === "select" && !uploadedFile && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileSearch className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No RFP Selected</h3>
                <p className="text-muted-foreground mt-1">
                  Select an existing RFP or upload a document to analyze its requirements and get strategic insights
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RFP Overview */}
      {selectedRfpId !== "select" && selectedRFP && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Company</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedRFP.company}</div>
                <p className="text-xs text-muted-foreground mt-1">Client organization</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedRFP.dueDate ? format(new Date(selectedRFP.dueDate), "MMM dd") : "TBD"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRFP.dueDate ? format(new Date(selectedRFP.dueDate), "yyyy") : "Not specified"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedRFP.value || "N/A"}</div>
                <p className="text-xs text-muted-foreground mt-1">Estimated budget</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Badge>{selectedRFP.status?.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Current stage</p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          {!analysisResult && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ready to Analyze</AlertTitle>
              <AlertDescription>
                Click "Analyze RFP" to get AI-powered insights about requirements, evaluation criteria, target audience, and success metrics.
              </AlertDescription>
            </Alert>
          )}

          {analysisResult && analysis && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="criteria">Criteria</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Analysis Summary
                    </CardTitle>
                    <CardDescription>Comprehensive overview of the RFP</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm">{analysisResult}</div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ListChecks className="h-4 w-4" />
                        Key Highlights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{analysis.requirements.length} Requirements identified</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{analysis.criteria.length} Evaluation criteria found</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{analysis.audience.length} Audience segments defined</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{analysis.metrics.length} Success metrics specified</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Submission Deadline</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedRFP.dueDate ? format(new Date(selectedRFP.dueDate), "MMM dd, yyyy") : "TBD"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Days Remaining</p>
                          <p className="text-2xl font-bold">
                            {selectedRFP.dueDate 
                              ? Math.max(0, Math.ceil((new Date(selectedRFP.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Key Requirements
                    </CardTitle>
                    <CardDescription>
                      Essential requirements that must be addressed in the proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.requirements.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{req}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No specific requirements extracted. The analysis may need more detailed RFP content.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Criteria Tab */}
              <TabsContent value="criteria" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Evaluation Criteria
                    </CardTitle>
                    <CardDescription>
                      How proposals will be evaluated and scored
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.criteria.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.criteria.map((criterion, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No evaluation criteria extracted. The analysis may need more detailed RFP content.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audience Tab */}
              <TabsContent value="audience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Target Audience
                    </CardTitle>
                    <CardDescription>
                      Audience segments and demographics to target
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.audience.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.audience.map((segment, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <Users className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{segment}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No audience information extracted. The analysis may need more detailed RFP content.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Strategic Insights
                    </CardTitle>
                    <CardDescription>
                      AI-powered recommendations and strategic considerations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.insights.length > 0 ? (
                      <ul className="space-y-3">
                        {analysis.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                            <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Focus on demonstrating measurable ROI and past campaign success
                          </span>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Highlight your team's expertise in media planning and audience targeting
                          </span>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            Provide detailed case studies that align with the client's industry
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Competitive Advantages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Emphasize unique value proposition
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Showcase relevant industry experience
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Demonstrate innovation and creativity
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Provide competitive pricing structure
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
