import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { QUESTIONS, type AnswerValue, type AssessmentOutput } from "../shared/assessmentEngine";
import type { JsonSchema, Message } from "./_core/llm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: ENV.s3Region,
  credentials: {
    accessKeyId: ENV.s3AccessKeyId,
    secretAccessKey: ENV.s3SecretAccessKey,
  },
  endpoint: ENV.s3Endpoint || undefined,
  forcePathStyle: !!ENV.s3Endpoint,
});

const RAG_DOCUMENT_KEYS = [
  "COMPLIANCE_ROADMAP.md",
  "fema_research_notes.md",
  "Liability_Exposure_Scan_Scoring_Logic.md",
  "MVP_Assessment_Engine.md",
  "RECOMMENDATIONS_LOG.md",
  "PRIVACY_POLICY.md",
  "PROFESSIONAL_SERVICES_AGREEMENT.md",
  "SAAS_TERMS.md",
  "VAPID_KEY_ROTATION.md",
  "todo.md",
  "docs/jurisdictions/jurisdiction_a-f.md",
  "docs/jurisdictions/jurisdiction_g-l.md",
  "docs/jurisdictions/jurisdiction_n-m.md",
  "docs/jurisdictions/jurisdiction_o-r.md",
  "docs/jurisdictions/jurisdiction_w-s.md",
  "docs/jurisdictions/jurisdiction_alabama_florida.md",
  "docs/jurisdictions/jurisdiction_alabama_georgia.md",
  "docs/jurisdictions/jurisdiction_alaska_oklahoma.md",
  "docs/jurisdictions/jurisdiction_louisiana_mississippi.md",
  "docs/jurisdictions/jurisdiction_new_mexico.md",
];

export type LiabilityScanAiInput = {
  answers: Record<string, string | boolean>;
  jurisdiction: string;
  industry: string;
};

const LIABILITY_SCAN_RESPONSE_SCHEMA: JsonSchema = {
  name: "liability_scan_result",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "score",
      "classification",
      "riskMap",
      "topGaps",
      "categoryScores",
      "interpretation",
      "advisorSummary",
      "immediateActionPlan",
      "ctaBlock",
      "crmPayload",
    ],
    properties: {
      score: { type: "number", minimum: 0, maximum: 100 },
      classification: {
        type: "string",
        enum: ["Severe Exposure", "High Exposure", "Moderate Exposure", "Defensible Position"],
      },
      riskMap: {
        type: "object",
        additionalProperties: false,
        required: ["color", "label", "descriptor"],
        properties: {
          color: { type: "string", enum: ["red", "orange", "yellow", "green"] },
          label: {
            type: "string",
            enum: ["Severe Exposure", "High Exposure", "Moderate Exposure", "Defensible Position"],
          },
          descriptor: { type: "string" },
        },
      },
      topGaps: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: true,
          required: ["id", "gap", "status", "impact"],
          properties: {
            id: { type: "string" },
            gap: { type: "string" },
            status: { type: "string", enum: ["Not in Place", "Incomplete", "Partial"] },
            impact: { type: "string" },
            severity: { type: "string", enum: ["CRITICAL", "HIGH"] },
            regulatoryBasis: { type: "array", items: { type: "string" } },
            preparednessBasis: { type: "array", items: { type: "string" } },
            sectionTag: {
              type: "string",
              enum: [
                "planning_documentation",
                "training_awareness",
                "reporting_communication",
                "response_readiness",
                "critical_risk_factors",
              ],
            },
          },
        },
      },
      categoryScores: {
        type: "object",
        additionalProperties: false,
        required: ["planningDocumentation", "trainingAwareness", "reportingCommunication", "responseReadiness"],
        properties: {
          planningDocumentation: { type: "number", minimum: 0, maximum: 100 },
          trainingAwareness: { type: "number", minimum: 0, maximum: 100 },
          reportingCommunication: { type: "number", minimum: 0, maximum: 100 },
          responseReadiness: { type: "number", minimum: 0, maximum: 100 },
        },
      },
      interpretation: { type: "string" },
      advisorSummary: { type: "string" },
      immediateActionPlan: { type: "array", items: { type: "string" } },
      ctaBlock: { type: "array", items: { type: "string" } },
      crmPayload: {
        type: "object",
        additionalProperties: true,
        required: [
          "score",
          "classification",
          "riskLevel",
          "topGaps",
          "categoryScores",
          "industry",
          "jurisdiction",
          "recommendedActions",
        ],
        properties: {
          score: { type: "number", minimum: 0, maximum: 100 },
          classification: {
            type: "string",
            enum: ["Severe Exposure", "High Exposure", "Moderate Exposure", "Defensible Position"],
          },
          riskLevel: { type: "string", enum: ["red", "orange", "yellow", "green"] },
          topGaps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
              required: ["gap", "status", "impact"],
              properties: {
                gap: { type: "string" },
                status: { type: "string", enum: ["Not in Place", "Incomplete", "Partial"] },
                impact: { type: "string" },
                severity: { type: "string", enum: ["CRITICAL", "HIGH"] },
                regulatoryBasis: { type: "array", items: { type: "string" } },
                preparednessBasis: { type: "array", items: { type: "string" } },
                sectionTag: {
                  type: "string",
                  enum: [
                    "planning_documentation",
                    "training_awareness",
                    "reporting_communication",
                    "response_readiness",
                    "critical_risk_factors",
                  ],
                },
              },
            },
          },
          categoryScores: {
            type: "object",
            additionalProperties: false,
            required: ["planningDocumentation", "trainingAwareness", "reportingCommunication", "responseReadiness"],
            properties: {
              planningDocumentation: { type: "number", minimum: 0, maximum: 100 },
              trainingAwareness: { type: "number", minimum: 0, maximum: 100 },
              reportingCommunication: { type: "number", minimum: 0, maximum: 100 },
              responseReadiness: { type: "number", minimum: 0, maximum: 100 },
            },
          },
          industry: { type: "string" },
          jurisdiction: { type: "string" },
          recommendedActions: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

async function retrieveRagDocuments(): Promise<string> {
  console.log(`[liabilityScanAi] retrieving ${RAG_DOCUMENT_KEYS.length} RAG documents from S3`);
  const docs: string[] = [];
  for (const key of RAG_DOCUMENT_KEYS) {
    try {
      const command = new GetObjectCommand({
        Bucket: ENV.s3BucketName,
        Key: key,
      });
      const response = await s3Client.send(command);
      const body = response.Body as any;
      const chunks = [];
      if (body) {
        for await (const chunk of body) {
        chunks.push(chunk);
        }
      }
      const content = Buffer.concat(chunks).toString('utf8');
      docs.push(`--- Document: ${key} ---\n${content}\n`);
      console.log(`[liabilityScanAi] successfully retrieved ${key} (${content.length} chars)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[liabilityScanAi] Failed to retrieve ${key} from S3:`, message);
    }
  }
  console.log(`[liabilityScanAi] RAG retrieval complete, total docs: ${docs.length}`);
  return docs.join('\n');
}

const QUESTIONS_ORDER: string[] = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "q9",
  "q10",
  "q11",
  "q12",
  "q13",
  "q14",
  "q15",
  "q16",
];

const buildQuestionAnswerBlock = (answers: Record<string, string | boolean>) => {
  const questionMap = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  return QUESTIONS_ORDER.map((id) => {
    const question = questionMap[id];
    const rawAnswer = answers[id];
    const answerLabel = question?.options?.find((opt) => opt.value === rawAnswer)?.label ?? String(rawAnswer ?? "");
    return `${id}: ${question?.text ?? "Unknown question"} => ${answerLabel}`;
  }).join("\n");
};

const buildLiabilityScanPrompt = (answers: Record<string, string | boolean>, jurisdiction: string, industry: string, ragContext: string): Message[] => {
  const questionDefinition = `
The liability scan questions are identified by stable IDs. Each top gap must include the original question ID so the client can map responses to the right section.
Use these categories for sectionTag values: planning_documentation, training_awareness, reporting_communication, response_readiness, critical_risk_factors.
`;

  const classificationGuidance = `
Classification must be one of: Severe Exposure, High Exposure, Moderate Exposure, Defensible Position.
Risk colors must match the classification as follows:
- Severe Exposure => red
- High Exposure => orange
- Moderate Exposure => yellow
- Defensible Position => green
`;

  const aiGuidance = `
Use the AI model fully. Do not mimic or fallback to the legacy rule-based liability scan engine.
Focus on generating an analytical AI assessment that explains exposure, risk drivers, and priority gaps.
Do not use formulaic, checklist-style text or old engine phrasing.
`;

  return [
    {
      role: "system",
      content: [
        "You are an expert workplace violence liability exposure analyst.",
        "Produce a single JSON object using the exact schema requested by the user.",
        "Do not include any explanatory text outside the JSON object.",
      ],
    },
    {
      role: "user",
      content: [
        "Generate a liability exposure scan result from the provided answers, industry, and jurisdiction.",
        questionDefinition,
        classificationGuidance,
        aiGuidance,
        `Industry: ${industry}`,
        `Jurisdiction: ${jurisdiction}`,
        "Answers:",
        buildQuestionAnswerBlock(answers),
        "Relevant context from knowledge base:",
        ragContext,
        "Return the following fields exactly: score, classification, riskMap, topGaps, categoryScores, interpretation, advisorSummary, immediateActionPlan, ctaBlock, crmPayload.",
        "Each topGaps item must include id, gap, status, impact, and optionally severity, regulatoryBasis, preparednessBasis, sectionTag.",
        "The crmPayload.topGaps items should mirror topGaps, but do not need to include id.",
        "Use plain strings only. Do not use Markdown formatting or bullet characters in field values.",
      ],
    },
  ];
};

const cleanJsonString = (value: string): string => {
  let text = value.trim();

  const fencedMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  if (fencedMatch?.[1]) {
    text = fencedMatch[1].trim();
  }

  const firstJsonChar = text.search(/[\[{]/);
  if (firstJsonChar > 0) {
    text = text.slice(firstJsonChar).trim();
  }

  const lastJsonChar = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastJsonChar !== -1 && lastJsonChar < text.length - 1) {
    text = text.slice(0, lastJsonChar + 1).trim();
  }

  return text;
};

const parseLlmResponse = (content: unknown): any => {
  if (content === null || content === undefined) return null;

  if (typeof content === "string") {
    const cleaned = cleanJsonString(content);
    if (!cleaned) return null;

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const fallback = cleaned.replace(/\r/g, "");
      const jsonStart = fallback.search(/[\[{]/);
      if (jsonStart !== -1) {
        try {
          return JSON.parse(fallback.slice(jsonStart));
        } catch {
          // fall through and throw original parse error
        }
      }
      throw err;
    }
  }

  if (typeof content === "object") {
    return content;
  }

  return null;
};

const normalizeAnswers = (answers: Record<string, string | boolean>): Record<string, AnswerValue> => {
  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => {
      const normalized =
        value === true ? "yes" :
        value === false ? "no" :
        String(value ?? "").trim();
      return [key, normalized];
    })
  ) as Record<string, AnswerValue>;
};

const validateAiResult: (candidate: any) => asserts candidate is AssessmentOutput = (candidate) => {
  if (typeof candidate !== "object" || candidate === null) {
    throw new Error("AI response did not return a valid object");
  }
  if (typeof candidate.score !== "number") {
    throw new Error("AI response missing numeric score");
  }
  if (typeof candidate.classification !== "string") {
    throw new Error("AI response missing classification");
  }
  if (!Array.isArray(candidate.topGaps) || typeof candidate.interpretation !== "string") {
    throw new Error("AI response missing required liability scan sections");
  }
};

export async function generateLiabilityScanResult(
  input: LiabilityScanAiInput
): Promise<AssessmentOutput> {
  console.log(`[liabilityScanAi] Starting liability scan generation for jurisdiction: ${input.jurisdiction}, industry: ${input.industry}`);
  
  const normalizedAnswers = normalizeAnswers(input.answers);
  if (!ENV.openAiApiKey) {
    throw new Error(
      "AI keys are missing from configuration. Liability scans now require Gemini or OpenAI and will not run on the legacy engine."
    );
  }

  console.log("[liabilityScanAi] AI PATH TAKEN - Using Gemini for liability scan");

  const ragContext = await retrieveRagDocuments();
  const messages = buildLiabilityScanPrompt(normalizedAnswers, input.jurisdiction || "Not specified", input.industry || "Not specified", ragContext);

  console.log(`[liabilityScanAi] invoking AI; model=${ENV.llmModel} baseUrl=${ENV.llmBaseUrl || "openai default"}`);

  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response;
    try {
      response = await invokeLLM({
        messages,
        outputSchema: LIABILITY_SCAN_RESPONSE_SCHEMA,
      });
      console.log(`[liabilityScanAi] AI response received successfully (attempt ${attempt})`);
    } catch (error) {
      console.error(`[liabilityScanAi] invokeLLM failed on attempt ${attempt}:`, error);
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`[liabilityScanAi] retrying liability scan generation (attempt ${attempt + 1}/${maxAttempts})`);
      continue;
    }

    const rawContent = response.choices?.[0]?.message?.content;
    console.log(`[liabilityScanAi] raw content length: ${rawContent?.length || 0}`);

    let parsed;
    try {
      parsed = parseLlmResponse(rawContent);
      console.log(`[liabilityScanAi] JSON parsing successful (attempt ${attempt})`);
    } catch (error) {
      console.error(`[liabilityScanAi] JSON parsing failed on attempt ${attempt}:`, error);
      console.error(`[liabilityScanAi] raw content:`, rawContent);
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`[liabilityScanAi] retrying liability scan generation (attempt ${attempt + 1}/${maxAttempts})`);
      continue;
    }

    try {
      validateAiResult(parsed);
      console.log(`[liabilityScanAi] validation successful (attempt ${attempt})`);
      return parsed;
    } catch (error) {
      console.error(`[liabilityScanAi] validation failed on attempt ${attempt}:`, error);
      console.error(`[liabilityScanAi] parsed result:`, JSON.stringify(parsed, null, 2));
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`[liabilityScanAi] retrying liability scan generation (attempt ${attempt + 1}/${maxAttempts})`);
    }
  }

  throw lastError;
}
