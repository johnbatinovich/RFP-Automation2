import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "./FileUpload";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddResourceDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function AddResourceDialog({ trigger, onSuccess }: AddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"audience_data" | "ad_formats" | "pricing" | "case_studies">("audience_data");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.uploads.uploadKnowledgeBase.useMutation();
  const utils = trpc.useUtils();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-fill title from filename if empty
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !selectedFile) {
      toast.error("Please provide a title and select a file");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(",")[1]; // Remove data:mime;base64, prefix

          const result = await uploadMutation.mutateAsync({
            title,
            category,
            fileData: base64Data,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
          });

          if (result.success) {
            toast.success("Resource uploaded successfully!");
            utils.knowledgeBase.list.invalidate();
            setOpen(false);
            resetForm();
            onSuccess?.();
          } else {
            toast.error(result.error || "Failed to upload resource");
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload resource");
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploading(false);
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload resource");
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("audience_data");
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Knowledge Base Resource</DialogTitle>
            <DialogDescription>
              Upload a document to your knowledge base for AI-powered proposal generation
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q2 2025 Audience Data"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audience_data">Audience Data</SelectItem>
                  <SelectItem value="ad_formats">Ad Formats</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="case_studies">Case Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Document</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                maxSize={10}
                disabled={isUploading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

