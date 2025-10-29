import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";
import { aiRouter } from "./aiRouter";
import { uploadsRouter } from "./uploadsRouter";
import { dynamics365Router } from "./dynamics365Router";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  rfps: router({
    list: publicProcedure.query(async () => {
      return await db.getAllRFPs();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getRFPById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        company: z.string(),
        dueDate: z.string(),
        value: z.string().optional(),
        owner: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const rfp = {
          id: randomUUID(),
          ...input,
          dueDate: new Date(input.dueDate),
          status: "new" as const,
          progress: "0",
        };
        return await db.createRFP(rfp);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          title: z.string().optional(),
          company: z.string().optional(),
          dueDate: z.string().optional(),
          value: z.string().optional(),
          status: z.enum(["new", "in_progress", "under_review", "completed"]).optional(),
          progress: z.string().optional(),
          owner: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input.data };
        if (input.data.dueDate) {
          updateData.dueDate = new Date(input.data.dueDate);
        }
        await db.updateRFP(input.id, updateData);
        return { success: true };
      }),
  }),

  proposals: router({
    getByRFPId: publicProcedure
      .input(z.object({ rfpId: z.string() }))
      .query(async ({ input }) => {
        return await db.getProposalByRFPId(input.rfpId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        rfpId: z.string(),
        content: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const proposal = {
          id: randomUUID(),
          ...input,
          status: "draft" as const,
          qualityScore: "0",
          completeness: "0",
          relevance: "0",
          clarity: "0",
          competitiveDiff: "0",
          alignment: "0",
        };
        return await db.createProposal(proposal);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          content: z.string().optional(),
          qualityScore: z.string().optional(),
          completeness: z.string().optional(),
          relevance: z.string().optional(),
          clarity: z.string().optional(),
          competitiveDiff: z.string().optional(),
          alignment: z.string().optional(),
          status: z.enum(["draft", "pending_review", "approved", "sent"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await db.updateProposal(input.id, input.data);
        return { success: true };
      }),
    
    generateResponse: protectedProcedure
      .input(z.object({
        rfpId: z.string(),
        rfpContent: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Simulated AI response generation
        const mockResponse = `Dear Client,

Thank you for your interest in our media advertising solutions. We are pleased to present our comprehensive proposal for ${input.rfpContent}.

**Our Capabilities:**
- Premium audience targeting across tech-savvy millennials and Gen Z consumers
- Multi-platform reach including broadcast, digital, and social media
- Real-time campaign analytics and performance tracking
- Dedicated account management and support

**Proposed Solution:**
Based on your requirements, we recommend a multi-channel approach that combines our premium broadcast slots with targeted digital placements. Our audience data shows strong engagement rates in your target demographic, with 2.5M unique users actively engaging with technology content.

**Pricing & Timeline:**
We can accommodate your campaign timeline and budget requirements. Detailed pricing breakdown and media kit are attached for your review.

**Next Steps:**
We would be delighted to discuss this proposal in detail and answer any questions you may have. Please feel free to reach out to schedule a call.

Best regards,
Media Sales Team`;

        // Calculate quality scores
        const scores = {
          qualityScore: "87",
          completeness: "92",
          relevance: "95",
          clarity: "88",
          competitiveDiff: "75",
          alignment: "90",
        };

        return {
          content: mockResponse,
          ...scores,
        };
      }),
  }),

  knowledgeBase: router({
    list: publicProcedure.query(async () => {
      return await db.getAllKnowledgeBase();
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        category: z.enum(["audience_data", "ad_formats", "pricing", "case_studies"]),
        content: z.string().optional(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const kb = {
          id: randomUUID(),
          ...input,
        };
        return await db.createKnowledgeBase(kb);
      }),
  }),

  teamMembers: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTeamMembers();
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        role: z.string(),
        email: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const member = {
          id: randomUUID(),
          ...input,
          status: "offline" as const,
        };
        return await db.createTeamMember(member);
      }),
  }),

  assignments: router({
    getByRFPId: publicProcedure
      .input(z.object({ rfpId: z.string() }))
      .query(async ({ input }) => {
        return await db.getAssignmentsByRFPId(input.rfpId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        rfpId: z.string(),
        memberId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const assignment = {
          id: randomUUID(),
          ...input,
        };
        return await db.createAssignment(assignment);
      }),
  }),

  analytics: router({
    getDashboard: publicProcedure.query(async () => {
      // Return mock dashboard data
      return {
        activeRFPs: { value: 12, trend: "+3 from last month" },
        pendingPlacements: { value: 87, trend: "↓ 12 from last week" },
        aiResponseRate: { value: "78%", trend: "↑ 5% from last month" },
        winRate: { value: "32%", trend: "↑ 7% from last quarter" },
      };
    }),
  }),

  // AI-powered operations
  ai: aiRouter,

  // File uploads
  uploads: uploadsRouter,

  // Dynamics 365 CRM integration
  dynamics365: dynamics365Router,
});

export type AppRouter = typeof appRouter;

