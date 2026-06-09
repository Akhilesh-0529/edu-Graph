import { graphOutputSchema, GraphOutput } from "../schemas/graph-output";
import { extractAndParseJSON } from "./json-parser";
import { z } from "zod";

export class InvalidOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOutputError";
  }
}

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma:4b";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export async function generateKnowledgeGraph(text: string): Promise<GraphOutput> {
  const systemPrompt = `You are a curriculum mapping assistant. Analyze the text and extract a knowledge graph in the exact JSON schema defined below.
JSON Schema:
{
  "nodes": [
    {
      "id": "unique-kebab-case-string",
      "label": "Human Readable Label",
      "type": "CONCEPT" | "DEFINITION" | "EXAMPLE" | "PREREQUISITE",
      "content": "Detailed academic explanation of this node",
      "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
    }
  ],
  "edges": [
    {
      "source": "id-of-source-node",
      "target": "id-of-target-node",
      "relationship": "prerequisite-of" | "includes" | "explains",
      "label": "explains" // optional relation label
    }
  ]
}

Example output:
{
  "nodes": [
    {
      "id": "noun-basics",
      "label": "Noun Basics",
      "type": "CONCEPT",
      "content": "A noun represents a person, place, or thing.",
      "difficulty": "BEGINNER"
    }
  ],
  "edges": []
}

Respond with ONLY the JSON object, no markdown, no explanation. Do not wrap in backticks unless absolutely necessary.`;

  const userPrompt = `Input text to analyze:\n\n${text}`;
  const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY;

  // 1. Try DeepSeek (Online) if key is present
  if (deepseekKey) {
    try {
      console.log("[AI_SERVICE] Attempting DeepSeek (online) for document");
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const rawData = await response.json();
        const rawText = rawData.choices?.[0]?.message?.content || "";
        const parsedData = extractAndParseJSON(rawText);

        if (parsedData) {
          const validated = graphOutputSchema.parse(parsedData);
          return validated;
        }
      } else {
        console.warn(`[AI_SERVICE] DeepSeek online returned status ${response.status}. Falling back to Ollama.`);
      }
    } catch (err) {
      console.warn("[AI_SERVICE] DeepSeek online failed. Falling back to Ollama:", err);
    }
  }

  // 2. Fallback to Ollama (Local)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AI_SERVICE] Attempting Ollama (local) - Attempt ${attempt}`);
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          system: systemPrompt,
          prompt: userPrompt,
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      if (response.ok) {
        const rawData = await response.json();
        const rawText = rawData.response || "";
        const parsedData = extractAndParseJSON(rawText);

        if (parsedData) {
          const validated = graphOutputSchema.parse(parsedData);
          return validated;
        }
      }
    } catch (err) {
      console.warn(`[AI_SERVICE] Ollama attempt ${attempt} failed:`, err);
    }
  }

  // 3. Last fallback: simulated mock data
  console.warn("[AI_SERVICE] Both DeepSeek and Ollama failed. Generating simulated graph.");
  return {
    nodes: [
      { id: "intro", label: "Introduction", type: "CONCEPT", content: "Overview of the uploaded document contents and main themes.", difficulty: "BEGINNER" },
      { id: "core-concept", label: "Core Concept", type: "CONCEPT", content: "The primary structural concept discussed inside the text.", difficulty: "INTERMEDIATE" },
      { id: "def", label: "Formal Definition", type: "DEFINITION", content: "A defined statement explaining key terminology.", difficulty: "BEGINNER" },
      { id: "example", label: "Applied Example", type: "EXAMPLE", content: "A practical application demonstrating the core concept in action.", difficulty: "INTERMEDIATE" }
    ],
    edges: [
      { source: "intro", target: "core-concept", relationship: "explains", label: "guides" },
      { source: "core-concept", target: "def", relationship: "includes", label: "defines" },
      { source: "core-concept", target: "example", relationship: "explains", label: "demonstrates" }
    ]
  };
}

export const chatGraphOutputSchema = z.object({
  response: z.string(),
  graph: graphOutputSchema,
});

export type ChatGraphOutput = z.infer<typeof chatGraphOutputSchema>;

export async function generateChatGraphAndResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  currentGraph?: GraphOutput
): Promise<ChatGraphOutput> {
  const systemPrompt = `You are an expert tutor and interactive knowledge graph builder.
Your task is to:
1. Provide a clear, engaging, and educational response to the user's latest query (explaining concepts, answering questions, or guiding the lesson).
2. Generate or update a visual knowledge graph of the topics being taught. The graph must structure concepts, definitions, examples, and prerequisites.

You must respond in the following EXACT JSON format:
{
  "response": "Your conversational reply to the user (can use formatting like bold, bullet points, but keep it in the JSON string)...",
  "graph": {
    "nodes": [
      {
        "id": "unique-kebab-case-string",
        "label": "Human Readable Label",
        "type": "CONCEPT" | "DEFINITION" | "EXAMPLE" | "PREREQUISITE",
        "content": "Explanation of this node",
        "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
      }
    ],
    "edges": [
      {
        "source": "id-of-source-node",
        "target": "id-of-target-node",
        "relationship": "prerequisite-of" | "includes" | "explains",
        "label": "relationship description"
      }
    ]
  }
}

Current Knowledge Graph:
${JSON.stringify(currentGraph || { nodes: [], edges: [] })}

Guidelines:
- Keep existing nodes if they are still correct, or update them. Add new nodes and edges as new concepts are discussed.
- Ensure all source and target IDs in edges exist in the nodes list.
- Return ONLY the raw JSON object. Do not wrap in markdown code blocks.`;

  const userPrompt = `Conversation History:\n${messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n")}\n\nGenerate the updated response and graph based on the latest query.`;

  const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY;

  // 1. Try DeepSeek (Online) if key is present
  if (deepseekKey) {
    try {
      console.log("[AI_SERVICE] Attempting DeepSeek (online) for chat-build");
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const rawData = await response.json();
        const rawText = rawData.choices?.[0]?.message?.content || "";
        const parsedData = extractAndParseJSON(rawText);

        if (parsedData) {
          const validated = chatGraphOutputSchema.parse(parsedData);
          return validated;
        }
      } else {
        console.warn(`[AI_SERVICE] DeepSeek online returned status ${response.status}. Falling back to Ollama.`);
      }
    } catch (err) {
      console.warn("[AI_SERVICE] DeepSeek online failed. Falling back to Ollama:", err);
    }
  }

  // 2. Fallback to Ollama (Local)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AI_SERVICE] Attempting Ollama (local chat-build) - Attempt ${attempt}`);
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          system: systemPrompt,
          prompt: userPrompt,
          stream: false,
          options: { temperature: 0.3 }
        })
      });

      if (response.ok) {
        const rawData = await response.json();
        const rawText = rawData.response || "";
        const parsedData = extractAndParseJSON(rawText);

        if (parsedData) {
          const validated = chatGraphOutputSchema.parse(parsedData);
          return validated;
        }
      }
    } catch (err) {
      console.warn(`[AI_SERVICE] Ollama attempt ${attempt} failed:`, err);
    }
  }

  // 3. Fallback to simulated response + mock graph generation
  console.warn("[AI_SERVICE] Both DeepSeek and Ollama failed. Generating simulated learning response.");
  const lastMessage = messages[messages.length - 1]?.content || "study topic";
  const responseText = `Here's an explanation about "${lastMessage}". Let's add some core concept nodes to your visual graph so you can inspect them. Ask me follow-up questions to expand this!`;
  const mockNodes = [
    { id: "intro-node", label: lastMessage.slice(0, 15), type: "CONCEPT" as const, content: `Introduction to ${lastMessage}`, difficulty: "BEGINNER" as const },
    { id: "def-node", label: "Definition", type: "DEFINITION" as const, content: `A formal definition of ${lastMessage}`, difficulty: "BEGINNER" as const }
  ];
  const mockEdges = [
    { source: "intro-node", target: "def-node", relationship: "explains", label: "defines" }
  ];

  const graphNodes = currentGraph?.nodes && currentGraph.nodes.length > 0 ? [...currentGraph.nodes] : [];
  const graphEdges = currentGraph?.edges && currentGraph.edges.length > 0 ? [...currentGraph.edges] : [];

  mockNodes.forEach(mn => {
    if (!graphNodes.find(n => n.id === mn.id)) graphNodes.push(mn);
  });
  mockEdges.forEach(me => {
    if (!graphEdges.find(e => e.source === me.source && e.target === me.target)) graphEdges.push(me);
  });

  return {
    response: responseText,
    graph: {
      nodes: graphNodes,
      edges: graphEdges
    }
  };
}
