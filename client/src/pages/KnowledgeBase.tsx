import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText, Download } from "lucide-react";
import { AddResourceDialog } from "@/components/AddResourceDialog";
import { useState } from "react";
import { format } from "date-fns";

export default function KnowledgeBase() {
  const { data: knowledgeBase, isLoading } = trpc.knowledgeBase.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredKB = knowledgeBase?.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      audience_data: "Audience Data",
      ad_formats: "Ad Formats",
      pricing: "Pricing",
      case_studies: "Case Studies",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      audience_data: "default",
      ad_formats: "secondary",
      pricing: "outline",
      case_studies: "default",
    };
    return colors[category] || "default";
  };

  const groupedKB = filteredKB.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof filteredKB>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Access audience data, pricing, and case studies for RFP responses
          </p>
        </div>
        <AddResourceDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          }
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge base..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
      ) : Object.keys(groupedKB).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No resources found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search" : "Add your first resource to get started"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedKB).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>{getCategoryLabel(category)}</CardTitle>
                    <Badge variant={getCategoryColor(category)}>
                      {items.length} {items.length === 1 ? "resource" : "resources"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          {item.content && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {item.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Updated {item.updatedAt ? format(new Date(item.updatedAt), "MMM dd, yyyy") : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

