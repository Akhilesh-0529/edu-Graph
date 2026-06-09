import { z } from "zod";

export const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["CONCEPT", "DEFINITION", "EXAMPLE", "PREREQUISITE"]),
  content: z.string(), // AI-generated explanation
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
});

export const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  relationship: z.string(),
  label: z.string().optional()
});

export const graphOutputSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema)
});

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type GraphOutput = z.infer<typeof graphOutputSchema>;
