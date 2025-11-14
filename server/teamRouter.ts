import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";

export const teamRouter = router({
  // Team Members
  listMembers: publicProcedure.query(async () => {
    return await db.getAllTeamMembers();
  }),

  getMember: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.getTeamMemberById(input.id);
    }),

  createMember: publicProcedure
    .input(z.object({
      name: z.string(),
      role: z.string(),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const member = {
        id: randomUUID(),
        ...input,
        status: "offline" as const,
      };
      return await db.createTeamMember(member);
    }),

  updateMember: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        role: z.string().optional(),
        email: z.string().email().optional(),
        status: z.enum(["online", "offline", "away"]).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      return await db.updateTeamMember(input.id, input.data);
    }),

  deleteMember: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.deleteTeamMember(input.id);
    }),

  // Tasks
  listTasks: publicProcedure
    .input(z.object({ rfpId: z.string().optional() }))
    .query(async ({ input }) => {
      return await db.getTasks(input.rfpId);
    }),

  createTask: publicProcedure
    .input(z.object({
      rfpId: z.string(),
      title: z.string(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      dueDate: z.string().optional(),
      createdBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const task = {
        id: randomUUID(),
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: "todo" as const,
        priority: input.priority || ("medium" as const),
      };
      await db.createTask(task);
      
      // Create activity
      await db.createActivity({
        id: randomUUID(),
        rfpId: input.rfpId,
        userId: input.createdBy || "system",
        userName: input.createdBy || "System",
        action: "task_created",
        description: `Created task: ${input.title}`,
      });
      
      return task;
    }),

  updateTask: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        status: z.enum(["todo", "in_progress", "review", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const updateData = {
        ...input.data,
        dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
      };
      return await db.updateTask(input.id, updateData);
    }),

  deleteTask: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.deleteTask(input.id);
    }),

  // Comments
  listComments: publicProcedure
    .input(z.object({ 
      rfpId: z.string().optional(),
      taskId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await db.getComments(input.rfpId, input.taskId);
    }),

  createComment: publicProcedure
    .input(z.object({
      rfpId: z.string(),
      taskId: z.string().optional(),
      authorId: z.string(),
      authorName: z.string(),
      content: z.string(),
      parentId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const comment = {
        id: randomUUID(),
        ...input,
      };
      await db.createComment(comment);
      
      // Create activity
      await db.createActivity({
        id: randomUUID(),
        rfpId: input.rfpId,
        userId: input.authorId,
        userName: input.authorName,
        action: "comment_added",
        description: `Added a comment: ${input.content.substring(0, 50)}...`,
      });
      
      return comment;
    }),

  deleteComment: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.deleteComment(input.id);
    }),

  // Activities
  listActivities: publicProcedure
    .input(z.object({ 
      rfpId: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await db.getActivities(input.rfpId, input.limit);
    }),

  // Notifications
  listNotifications: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db.getNotifications(input.userId);
    }),

  markNotificationRead: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.markNotificationRead(input.id);
    }),

  createNotification: publicProcedure
    .input(z.object({
      userId: z.string(),
      title: z.string(),
      message: z.string(),
      type: z.enum(["info", "success", "warning", "error"]).optional(),
      link: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const notification = {
        id: randomUUID(),
        ...input,
        type: input.type || ("info" as const),
        isRead: "no" as const,
      };
      return await db.createNotification(notification);
    }),

  // Shared Files
  listSharedFiles: publicProcedure
    .input(z.object({ rfpId: z.string() }))
    .query(async ({ input }) => {
      return await db.getSharedFiles(input.rfpId);
    }),

  createSharedFile: publicProcedure
    .input(z.object({
      rfpId: z.string(),
      fileName: z.string(),
      fileUrl: z.string(),
      fileType: z.string().optional(),
      fileSize: z.number().optional(),
      uploadedBy: z.string(),
      uploadedByName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const file = {
        id: randomUUID(),
        ...input,
      };
      await db.createSharedFile(file);
      
      // Create activity
      await db.createActivity({
        id: randomUUID(),
        rfpId: input.rfpId,
        userId: input.uploadedBy,
        userName: input.uploadedByName,
        action: "file_shared",
        description: `Shared file: ${input.fileName}`,
      });
      
      return file;
    }),

  deleteSharedFile: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.deleteSharedFile(input.id);
    }),
});
