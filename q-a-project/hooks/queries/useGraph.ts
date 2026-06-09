import { useQuery } from "@tanstack/react-query";
import { GraphOutput, GraphNode, GraphEdge } from "@/lib/schemas/graph-output";

export interface GraphDetailResponse extends GraphOutput {
  messages?: { role: "user" | "assistant"; content: string }[];
  isChatBuilt?: boolean;
}

async function fetchGraphDetail(graphId: string): Promise<GraphDetailResponse> {
  const response = await fetch(`/api/graph?graphId=${graphId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch graph detail for ID: ${graphId}`);
  }
  const data = await response.json();
  const matched = data.graphs?.find((g: { graphId: string; nodes: GraphNode[]; edges: GraphEdge[]; messages?: any[]; isChatBuilt?: boolean }) => g.graphId === graphId);
  if (!matched) {
    throw new Error("Knowledge graph not found.");
  }
  return {
    nodes: matched.nodes || [],
    edges: matched.edges || [],
    messages: matched.messages || [],
    isChatBuilt: !!matched.isChatBuilt,
  };
}

export function useGraph(graphId: string) {
  return useQuery<GraphDetailResponse, Error>({
    queryKey: ["graph", graphId],
    queryFn: () => fetchGraphDetail(graphId),
    enabled: !!graphId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
}
