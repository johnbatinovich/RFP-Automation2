import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  FileText, 
  Calendar,
  Activity,
  Bell,
  Upload,
  Download,
  Trash2,
  Edit,
  Send
} from "lucide-react";
import { format } from "date-fns";

export default function TeamCollaboration() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRFP, setSelectedRFP] = useState<string>("all");
  
  const { data: rfps } = trpc.rfps.list.useQuery();
  const { data: teamMembers } = trpc.team.listMembers.useQuery();
  const { data: tasks } = trpc.team.listTasks.useQuery({ rfpId: selectedRFP === "all" ? undefined : selectedRFP });
  const { data: activities } = trpc.team.listActivities.useQuery({ rfpId: selectedRFP === "all" ? undefined : selectedRFP, limit: 20 });
  const { data: comments } = trpc.team.listComments.useQuery({ rfpId: selectedRFP === "all" ? undefined : selectedRFP });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members, assign tasks, and collaborate on RFPs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddTeamMemberDialog />
        </div>
      </div>

      {/* RFP Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="rfp-select" className="whitespace-nowrap">Filter by RFP:</Label>
            <Select value={selectedRFP} onValueChange={setSelectedRFP}>
              <SelectTrigger id="rfp-select" className="w-full max-w-md">
                <SelectValue placeholder="All RFPs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RFPs</SelectItem>
                {rfps?.map((rfp) => (
                  <SelectItem key={rfp.id} value={rfp.id}>
                    {rfp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Team Members"
              value={teamMembers?.length || 0}
              icon={<Users className="h-4 w-4" />}
              description="Active collaborators"
            />
            <StatsCard
              title="Active Tasks"
              value={tasks?.filter(t => t.status !== "completed").length || 0}
              icon={<CheckCircle2 className="h-4 w-4" />}
              description="In progress"
            />
            <StatsCard
              title="Comments"
              value={comments?.length || 0}
              icon={<MessageSquare className="h-4 w-4" />}
              description="Total discussions"
            />
            <StatsCard
              title="Recent Activity"
              value={activities?.length || 0}
              icon={<Activity className="h-4 w-4" />}
              description="Last 20 actions"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RecentActivityCard activities={activities?.slice(0, 5) || []} />
            <TeamMembersCard members={teamMembers?.slice(0, 5) || []} />
          </div>
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team" className="space-y-4">
          <TeamMembersSection members={teamMembers || []} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <TasksSection tasks={tasks || []} rfpId={selectedRFP} />
        </TabsContent>

        {/* Discussions Tab */}
        <TabsContent value="discussions" className="space-y-4">
          <DiscussionsSection comments={comments || []} rfpId={selectedRFP} />
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityFeedSection activities={activities || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, description }: { title: string; value: number | string; icon: React.ReactNode; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Recent Activity Card
function RecentActivityCard({ activities }: { activities: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest team actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{activity.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.userName}</span>{" "}
                    <span className="text-muted-foreground">{activity.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Team Members Card
function TeamMembersCard({ members }: { members: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Active collaborators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                <Badge variant={member.status === "online" ? "default" : "secondary"}>
                  {member.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Add Team Member Dialog
function AddTeamMemberDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const utils = trpc.useUtils();
  const createMember = trpc.team.createMember.useMutation({
    onSuccess: () => {
      toast.success("Team member added successfully!");
      utils.team.listMembers.invalidate();
      setOpen(false);
      setName("");
      setRole("");
      setEmail("");
    },
    onError: () => {
      toast.error("Failed to add team member");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMember.mutate({ name, role, email: email || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new member to your collaboration team</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Media Planner"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Team Members Section
function TeamMembersSection({ members }: { members: any[] }) {
  const utils = trpc.useUtils();
  const deleteMember = trpc.team.deleteMember.useMutation({
    onSuccess: () => {
      toast.success("Team member removed");
      utils.team.listMembers.invalidate();
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </div>
              </div>
              <Badge variant={member.status === "online" ? "default" : "secondary"}>
                {member.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {member.email && (
              <p className="text-sm text-muted-foreground mb-4">{member.email}</p>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMember.mutate({ id: member.id })}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Tasks Section
function TasksSection({ tasks, rfpId }: { tasks: any[]; rfpId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <AddTaskDialog rfpId={rfpId} />
      </div>
      
      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tasks yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

// Add Task Dialog
function AddTaskDialog({ rfpId }: { rfpId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [assignedTo, setAssignedTo] = useState("unassigned");

  const { data: members } = trpc.team.listMembers.useQuery();
  const utils = trpc.useUtils();
  
  const createTask = trpc.team.createTask.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully!");
      utils.team.listTasks.invalidate();
      utils.team.listActivities.invalidate();
      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssignedTo("unassigned");
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfpId) {
      toast.error("Please select an RFP first");
      return;
    }
    createTask.mutate({
      rfpId,
      title,
      description,
      priority,
      assignedTo: assignedTo === "unassigned" ? undefined : assignedTo,
      createdBy: "current-user",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a task to track work on this RFP</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Review media placements"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-assigned">Assign To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger id="task-assigned">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Task Card
function TaskCard({ task }: { task: any }) {
  const utils = trpc.useUtils();
  const updateTask = trpc.team.updateTask.useMutation({
    onSuccess: () => {
      utils.team.listTasks.invalidate();
      toast.success("Task updated");
    },
  });

  const deleteTask = trpc.team.deleteTask.useMutation({
    onSuccess: () => {
      utils.team.listTasks.invalidate();
      toast.success("Task deleted");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "review": return "outline";
      default: return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            {task.description && (
              <CardDescription>{task.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
            <Badge variant={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.assignedTo && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Assigned</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(task.dueDate), "MMM dd")}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={task.status}
              onValueChange={(status) => updateTask.mutate({ id: task.id, data: { status: status as any } })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask.mutate({ id: task.id })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Discussions Section
function DiscussionsSection({ comments, rfpId }: { comments: any[]; rfpId: string }) {
  const [newComment, setNewComment] = useState("");
  const utils = trpc.useUtils();
  
  const createComment = trpc.team.createComment.useMutation({
    onSuccess: () => {
      toast.success("Comment added");
      utils.team.listComments.invalidate();
      utils.team.listActivities.invalidate();
      setNewComment("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfpId) {
      toast.error("Please select an RFP first");
      return;
    }
    if (!newComment.trim()) return;
    
    createComment.mutate({
      rfpId,
      authorId: "current-user",
      authorName: "Current User",
      content: newComment,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Comment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
            />
            <Button type="submit" disabled={createComment.isPending || !newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {createComment.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No comments yet. Start the conversation!</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback>{comment.authorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.authorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Activity Feed Section
function ActivityFeedSection({ activities }: { activities: any[] }) {
  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
          </CardContent>
        </Card>
      ) : (
        activities.map((activity) => (
          <Card key={activity.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>{activity.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.userName}</span>{" "}
                    <span className="text-muted-foreground">{activity.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(activity.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <Badge variant="outline">{activity.action.replace("_", " ")}</Badge>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
