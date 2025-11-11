import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface NewRFPDialogProps {
  trigger: React.ReactNode;
}

export function NewRFPDialog({ trigger }: NewRFPDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [value, setValue] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const createRFP = trpc.rfps.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "RFP created successfully",
      });
      utils.rfps.list.invalidate();
      setOpen(false);
      setLocation(`/rfps/${data.id}`);
      // Reset form
      setTitle("");
      setCompany("");
      setDueDate("");
      setValue("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create RFP",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !company || !dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createRFP.mutate({
      title,
      company,
      dueDate: new Date(dueDate),
      value: value || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New RFP</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">RFP Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter RFP title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value (Optional)</Label>
            <Input
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., 1000000"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRFP.isPending}>
              {createRFP.isPending ? "Creating..." : "Create RFP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
