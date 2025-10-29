import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createDynamics365Lead, 
  createDynamics365Opportunity,
  updateDynamics365Lead,
  updateDynamics365Opportunity,
  testDynamics365Connection,
  type Dynamics365Lead,
  type Dynamics365Opportunity
} from "./_core/dynamics365Api";
import { isDynamics365Enabled } from "./_core/dynamics365Auth";
import * as db from "./db";

/**
 * Map RFP data to Dynamics 365 Lead format
 */
function mapRFPToLead(rfp: any): Dynamics365Lead {
  // Parse owner name if available
  let firstname: string | undefined;
  let lastname: string | undefined;
  
  if (rfp.owner) {
    const nameParts = rfp.owner.trim().split(/\s+/);
    if (nameParts.length === 1) {
      firstname = nameParts[0];
    } else if (nameParts.length >= 2) {
      firstname = nameParts[0];
      lastname = nameParts.slice(1).join(" ");
    }
  }

  // Parse estimated value
  let estimatedvalue: number | undefined;
  if (rfp.value) {
    // Remove currency symbols and commas, then parse
    const valueStr = rfp.value.replace(/[$,]/g, "");
    const parsed = parseFloat(valueStr);
    if (!isNaN(parsed)) {
      estimatedvalue = parsed;
    }
  }

  // Format close date
  let estimatedclosedate: string | undefined;
  if (rfp.dueDate) {
    const date = new Date(rfp.dueDate);
    if (!isNaN(date.getTime())) {
      estimatedclosedate = date.toISOString();
    }
  }

  return {
    subject: rfp.title || "Untitled RFP",
    companyname: rfp.company,
    firstname,
    lastname,
    description: rfp.extractedQuestions 
      ? `RFP Details:\n\n${rfp.extractedQuestions}` 
      : `RFP for ${rfp.company}`,
    estimatedvalue,
    estimatedclosedate,
    leadsourcecode: 8, // Web
    leadqualitycode: 2, // Warm (default for new RFPs)
  };
}

/**
 * Map RFP data to Dynamics 365 Opportunity format
 */
function mapRFPToOpportunity(rfp: any): Dynamics365Opportunity {
  // Parse estimated value
  let estimatedvalue: number | undefined;
  let budgetamount: number | undefined;
  
  if (rfp.value) {
    const valueStr = rfp.value.replace(/[$,]/g, "");
    const parsed = parseFloat(valueStr);
    if (!isNaN(parsed)) {
      estimatedvalue = parsed;
      budgetamount = parsed;
    }
  }

  // Format close date
  let estimatedclosedate: string | undefined;
  if (rfp.dueDate) {
    const date = new Date(rfp.dueDate);
    if (!isNaN(date.getTime())) {
      estimatedclosedate = date.toISOString();
    }
  }

  // Create comprehensive description
  let description = `RFP: ${rfp.title}\nCompany: ${rfp.company}\n`;
  if (rfp.owner) description += `Owner: ${rfp.owner}\n`;
  if (rfp.value) description += `Value: ${rfp.value}\n`;
  if (rfp.status) description += `Status: ${rfp.status}\n`;
  if (rfp.progress) description += `Progress: ${rfp.progress}%\n`;
  if (rfp.extractedQuestions) {
    description += `\nExtracted Requirements:\n${rfp.extractedQuestions}`;
  }

  return {
    name: `${rfp.title} - ${rfp.company}`,
    description,
    estimatedvalue,
    estimatedclosedate,
    budgetamount,
    stepname: rfp.status === "completed" ? "Close" : "Propose",
  };
}

export const dynamics365Router = router({
  /**
   * Check if Dynamics 365 integration is enabled
   */
  isEnabled: publicProcedure.query(() => {
    return {
      enabled: isDynamics365Enabled(),
    };
  }),

  /**
   * Test Dynamics 365 connection
   */
  testConnection: protectedProcedure.mutation(async () => {
    const result = await testDynamics365Connection();
    return result;
  }),

  /**
   * Create a lead from an RFP
   */
  createLeadFromRFP: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get RFP details
      const rfp = await db.getRFPById(input.rfpId);
      
      if (!rfp) {
        return {
          success: false,
          error: "RFP not found",
        };
      }

      // Map RFP to Lead
      const lead = mapRFPToLead(rfp);
      
      // Create lead in Dynamics 365
      const result = await createDynamics365Lead(lead);
      
      // If successful, store the Dynamics 365 ID in the RFP
      if (result.success && result.id) {
        // Note: You may want to add a dynamics365LeadId field to the RFP schema
        console.log(`Lead created for RFP ${input.rfpId}: ${result.id}`);
      }
      
      return result;
    }),

  /**
   * Create an opportunity from an RFP
   */
  createOpportunityFromRFP: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get RFP details
      const rfp = await db.getRFPById(input.rfpId);
      
      if (!rfp) {
        return {
          success: false,
          error: "RFP not found",
        };
      }

      // Map RFP to Opportunity
      const opportunity = mapRFPToOpportunity(rfp);
      
      // Create opportunity in Dynamics 365
      const result = await createDynamics365Opportunity(opportunity);
      
      // If successful, store the Dynamics 365 ID in the RFP
      if (result.success && result.id) {
        // Note: You may want to add a dynamics365OpportunityId field to the RFP schema
        console.log(`Opportunity created for RFP ${input.rfpId}: ${result.id}`);
      }
      
      return result;
    }),

  /**
   * Sync RFP to Dynamics 365 (creates lead or opportunity based on status)
   */
  syncRFP: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      createAs: z.enum(["lead", "opportunity", "auto"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const rfp = await db.getRFPById(input.rfpId);
      
      if (!rfp) {
        return {
          success: false,
          error: "RFP not found",
        };
      }

      let createAs = input.createAs || "auto";
      
      // Auto-determine based on status
      if (createAs === "auto") {
        if (rfp.status === "new") {
          createAs = "lead";
        } else {
          createAs = "opportunity";
        }
      }

      if (createAs === "lead") {
        const lead = mapRFPToLead(rfp);
        return await createDynamics365Lead(lead);
      } else {
        const opportunity = mapRFPToOpportunity(rfp);
        return await createDynamics365Opportunity(opportunity);
      }
    }),

  /**
   * Bulk sync multiple RFPs
   */
  bulkSync: protectedProcedure
    .input(z.object({
      rfpIds: z.array(z.string()),
      createAs: z.enum(["lead", "opportunity", "auto"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const results = [];
      
      for (const rfpId of input.rfpIds) {
        try {
          const rfp = await db.getRFPById(rfpId);
          
          if (!rfp) {
            results.push({
              rfpId,
              success: false,
              error: "RFP not found",
            });
            continue;
          }

          let createAs = input.createAs || "auto";
          
          if (createAs === "auto") {
            createAs = rfp.status === "new" ? "lead" : "opportunity";
          }

          let result;
          if (createAs === "lead") {
            const lead = mapRFPToLead(rfp);
            result = await createDynamics365Lead(lead);
          } else {
            const opportunity = mapRFPToOpportunity(rfp);
            result = await createDynamics365Opportunity(opportunity);
          }

          results.push({
            rfpId,
            ...result,
          });
        } catch (error) {
          results.push({
            rfpId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
      
      return {
        total: input.rfpIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      };
    }),
});
