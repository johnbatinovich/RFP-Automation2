import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";

export const uploadsRouter = router({
  uploadKnowledgeBase: protectedProcedure
    .input(z.object({
      title: z.string(),
      category: z.enum(["audience_data", "ad_formats", "pricing", "case_studies"]),
      fileData: z.string(), // base64 encoded file
      fileName: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      
      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, "base64");
        const fileSize = fileBuffer.length;

        // Upload to S3
        const key = `knowledge-base/${randomUUID()}-${input.fileName}`;
        const { url } = await storagePut(key, fileBuffer, input.fileType);

        // Create knowledge base entry
        const kb = {
          id: randomUUID(),
          title: input.title,
          category: input.category,
          fileUrl: url,
          fileType: input.fileType,
          fileSize,
          content: null,
        };

        await db.createKnowledgeBase(kb);

        return {
          success: true,
          id: kb.id,
          url,
        };
      } catch (error) {
        console.error("Error uploading file:", error);
        return {
          success: false,
          error: "Failed to upload file",
        };
      }
    }),

  uploadRFPDocument: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      fileData: z.string(), // base64 encoded file
      fileName: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      
      try {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, "base64");

        // Upload to S3
        const key = `rfp-documents/${input.rfpId}/${randomUUID()}-${input.fileName}`;
        const { url } = await storagePut(key, fileBuffer, input.fileType);

        // Update RFP with document URL
        await db.updateRFP(input.rfpId, {
          rfpDocumentUrl: url,
          rfpDocumentName: input.fileName,
        });

        return {
          success: true,
          url,
        };
      } catch (error) {
        console.error("Error uploading RFP document:", error);
        return {
          success: false,
          error: "Failed to upload document",
        };
      }
    }),
});

