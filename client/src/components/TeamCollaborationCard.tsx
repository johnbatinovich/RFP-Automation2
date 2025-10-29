import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TeamCollaborationCardProps {
  rfpId: string;
}

export function TeamCollaborationCard({ rfpId }: TeamCollaborationCardProps) {
  const [comment, setComment] = useState("");
  const { data: teamMembers } = trpc.teamMembers.list.useQuery();
  const { data: assignments } = trpc.assignments.getByRFPId.useQuery({ rfpId });

  const assignedMembers = teamMembers?.filter((member) =>
    assignments?.some((a) => a.memberId === member.id)
  ) || [];

  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    toast.success("Comment added successfully!");
    setComment("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>Assigned to this RFP</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignedMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team members assigned yet
              </p>
            ) : (
              assignedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Comments
          </CardTitle>
          <CardDescription>Collaborate with your team on this RFP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Example comments */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">John Davis</span>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <p className="text-sm">
                I've reviewed the audience data. We have strong metrics for the tech-savvy millennial segment they're targeting.
              </p>
            </div>

            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">SJ</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">Sarah Johnson</span>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </div>
              <p className="text-sm">
                The pricing looks competitive. I recommend highlighting our premium broadcast slots in the proposal.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={!comment.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

