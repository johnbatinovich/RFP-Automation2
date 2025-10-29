import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { randomUUID } from "crypto";

export const aiRouter = router({
  analyzeDocument: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert RFP analyzer. Extract key information from RFP documents including requirements, deadlines, evaluation criteria, and budget constraints."
            },
            {
              role: "user",
              content: `Analyze this RFP content and provide a structured summary of:
1. Key requirements
2. Evaluation criteria
3. Target audience
4. Success metrics

RFP CONTENT:
${input.content}

Provide the analysis in a clear, structured format.`
            }
          ]
        });

        const messageContent = response.choices[0]?.message?.content;
        const analysis = typeof messageContent === 'string' ? messageContent : "Unable to analyze document";
        
        return {
          success: true,
          analysis,
        };
      } catch (error) {
        console.error("Error analyzing document:", error);
        return {
          success: false,
          error: "Failed to analyze document",
        };
      }
    }),

  extractQuestions: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      rfpContent: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert at extracting questions from RFP documents. Identify all questions that need to be answered in the proposal response."
            },
            {
              role: "user",
              content: `Extract all questions from this RFP content that need to be answered:

${input.rfpContent}

Return a JSON array of questions with the following structure:
{
  "questions": [
    {
      "id": "q1",
      "question": "question text",
      "category": "technical|pricing|experience|other",
      "priority": "high|medium|low"
    }
  ]
}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "questions_extraction",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        category: { type: "string", enum: ["technical", "pricing", "experience", "other"] },
                        priority: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["id", "question", "category", "priority"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false
              }
            }
          }
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === 'string' ? messageContent : "{}";
        const extracted = JSON.parse(content);
        
        // Store extracted questions in the RFP
        await db.updateRFP(input.rfpId, {
          extractedQuestions: JSON.stringify(extracted.questions)
        });

        return {
          success: true,
          questions: extracted.questions,
        };
      } catch (error) {
        console.error("Error extracting questions:", error);
        return {
          success: false,
          error: "Failed to extract questions",
          questions: [],
        };
      }
    }),

  generateResponses: protectedProcedure
    .input(z.object({
      rfpId: z.string(),
      questions: z.array(z.object({
        id: z.string(),
        question: z.string(),
        category: z.string(),
      })),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      try {
        // Get knowledge base resources
        const kbResources = await db.getAllKnowledgeBase();
        const kbContext = kbResources.map(kb => `${kb.title}: ${kb.content || ""}`).join("\n\n");

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert proposal writer for a media advertising company. Use the following knowledge base to answer RFP questions accurately and professionally:

${kbContext}

Provide detailed, specific answers that demonstrate expertise and align with the company's capabilities.`
            },
            {
              role: "user",
              content: `Generate professional responses to these RFP questions:

${input.questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}

Return a JSON object with responses:
{
  "responses": [
    {
      "questionId": "question id",
      "answer": "detailed answer"
    }
  ]
}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "question_responses",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  responses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        questionId: { type: "string" },
                        answer: { type: "string" }
                      },
                      required: ["questionId", "answer"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["responses"],
                additionalProperties: false
              }
            }
          }
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === 'string' ? messageContent : "{}";
        const generated = JSON.parse(content);

        return {
          success: true,
          responses: generated.responses,
        };
      } catch (error) {
        console.error("Error generating responses:", error);
        return {
          success: false,
          error: "Failed to generate responses",
          responses: [],
        };
      }
    }),

  qualityCheck: protectedProcedure
    .input(z.object({
      proposalId: z.string(),
      content: z.string(),
      rfpRequirements: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are an expert proposal quality assessor. Evaluate proposals on completeness, relevance, clarity, competitive differentiation, and alignment with RFP requirements. Provide scores (0-100) and specific improvement suggestions."
            },
            {
              role: "user",
              content: `Evaluate this proposal and provide quality scores:

PROPOSAL CONTENT:
${input.content}

${input.rfpRequirements ? `RFP REQUIREMENTS:\n${input.rfpRequirements}` : ""}

Return a JSON object with the following structure:
{
  "qualityScore": 85,
  "completeness": 90,
  "relevance": 85,
  "clarity": 88,
  "competitiveDiff": 80,
  "alignment": 87,
  "improvementSuggestion": "specific suggestion for improvement"
}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quality_assessment",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  qualityScore: { type: "number" },
                  completeness: { type: "number" },
                  relevance: { type: "number" },
                  clarity: { type: "number" },
                  competitiveDiff: { type: "number" },
                  alignment: { type: "number" },
                  improvementSuggestion: { type: "string" }
                },
                required: ["qualityScore", "completeness", "relevance", "clarity", "competitiveDiff", "alignment", "improvementSuggestion"],
                additionalProperties: false
              }
            }
          }
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === 'string' ? messageContent : "{}";
        const scores = JSON.parse(content);

        // Update proposal with quality scores
        await db.updateProposal(input.proposalId, {
          qualityScore: scores.qualityScore.toString(),
          completeness: scores.completeness.toString(),
          relevance: scores.relevance.toString(),
          clarity: scores.clarity.toString(),
          competitiveDiff: scores.competitiveDiff.toString(),
          alignment: scores.alignment.toString(),
          improvementSuggestion: scores.improvementSuggestion,
        });

        return {
          success: true,
          ...scores,
        };
      } catch (error) {
        console.error("Error performing quality check:", error);
        return {
          success: false,
          error: "Failed to perform quality check",
        };
      }
    }),
});

