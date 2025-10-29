import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Cloud, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Dynamics365SyncButtonProps {
  rfpId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export default function Dynamics365SyncButton({ 
  rfpId, 
  variant = "outline",
  size = "sm" 
}: Dynamics365SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: integrationStatus } = trpc.dynamics365.isEnabled.useQuery();
  const syncRFP = trpc.dynamics365.syncRFP.useMutation();
  const createLead = trpc.dynamics365.createLeadFromRFP.useMutation();
  const createOpportunity = trpc.dynamics365.createOpportunityFromRFP.useMutation();

  const isEnabled = integrationStatus?.enabled ?? false;

  const handleSync = async (type: "auto" | "lead" | "opportunity") => {
    setIsSyncing(true);

    try {
      let result;

      if (type === "lead") {
        result = await createLead.mutateAsync({ rfpId });
      } else if (type === "opportunity") {
        result = await createOpportunity.mutateAsync({ rfpId });
      } else {
        result = await syncRFP.mutateAsync({ rfpId, createAs: "auto" });
      }

      if (result.success) {
        toast.success(`Successfully synced to Dynamics 365 ${type === "auto" ? "" : `as ${type}`}`);
      } else {
        toast.error(result.error || "Failed to sync");
      }
    } catch (error) {
      toast.error("Failed to sync to Dynamics 365");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isSyncing}>
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Cloud className="mr-2 h-4 w-4" />
              Sync to CRM
              <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleSync("auto")}>
          Auto (Lead or Opportunity)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleSync("lead")}>
          Create as Lead
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSync("opportunity")}>
          Create as Opportunity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
