import { useQuery } from "@tanstack/react-query";
import { GraphOutput, GraphNode, GraphEdge } from "@/lib/schemas/graph-output";

async function fetchGraphDetail(graphId: string): Promise<GraphOutput> {
  const response = await fetch(`/api/graph?graphId=${graphId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch graph detail for ID: ${graphId}`);
  }
  const data = await response.json();
  // Find specific graph if multiple are returned in array
  const matched = data.graphs?.find((g: { graphId: string; nodes: GraphNode[]; edges: GraphEdge[] }) => g.graphId === graphId);
  if (!matched) {
    throw new Error("Knowledge graph not found.");
  }
  return {
    nodes: matched.nodes || [],
    edges: matched.edges || [],
  };
}

export function useGraph(graphId: string) {
  return useQuery<GraphOutput, Error>({
    queryKey: ["graph", graphId],
    queryFn: () => fetchGraphDetail(graphId),
    enabled: !!graphId,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
}
