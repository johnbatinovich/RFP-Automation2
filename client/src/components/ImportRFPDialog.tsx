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
import { FileUpload } from "./FileUpload";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface ImportRFPDialogProps {
  trigger: React.ReactNode;
}

export function ImportRFPDialog({ trigger }: ImportRFPDialogProps) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const createRFP = trpc.rfps.create.useMutation();
  const uploadDocument = trpc.uploads.uploadRFPDocument.useMutation();
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

    if (!title || !company || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Create the RFP first
      const rfp = await createRFP.mutateAsync({
        title,
        company,
        dueDate,
        value,
        owner: "System",
      });

      // If there's a file, upload it
      if (selectedFile && rfp) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const base64Data = base64.split(",")[1];

            const uploadResult = await uploadDocument.mutateAsync({
              rfpId: rfp.id,
              fileData: base64Data,
              fileName: selectedFile.name,
              fileType: selectedFile.type,
            });

            if (uploadResult.success) {
              toast.success("RFP imported successfully!");
              utils.rfps.list.invalidate();
              setOpen(false);
              resetForm();
              // Navigate to the new RFP
              setLocation(`/rfps/${rfp.id}`);
            } else {
              toast.error(uploadResult.error || "Failed to upload document");
            }
          } catch (error) {
            console.error("Upload error:", error);
            toast.error("RFP created but document upload failed");
          } finally {
            setIsProcessing(false);
          }
        };

        reader.onerror = () => {
          toast.error("Failed to read file");
          setIsProcessing(false);
        };
      } else {
        // No file to upload
        toast.success("RFP created successfully!");
        utils.rfps.list.invalidate();
        setOpen(false);
        resetForm();
        setIsProcessing(false);
        if (rfp) {
          setLocation(`/rfps/${rfp.id}`);
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import RFP");
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setDueDate("");
    setValue("");
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Import RFP</DialogTitle>
            <DialogDescription>
              Upload an RFP document and provide basic information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">RFP Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Q3 Digital Media Campaign RFP"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="MediaBuyers Agency"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="value">Value (Optional)</Label>
                <Input
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="$1.2M"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>RFP Document (Optional)</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
                maxSize={20}
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Upload the RFP document for AI analysis and question extraction
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import RFP"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

