import { useQuery } from "@tanstack/react-query";

export interface GraphSummary {
  graphId: string;
  title: string;
  updatedAt: string;
  nodesCount: number;
  isChatBuilt?: boolean;
}

async function fetchGraphs(): Promise<GraphSummary[]> {
  const response = await fetch("/api/graph");
  if (!response.ok) {
    throw new Error("Failed to fetch user knowledge graphs.");
  }
  const data = await response.json();
  return data.graphs || [];
}

export function useGraphs() {
  return useQuery<GraphSummary[], Error>({
    queryKey: ["graphs"],
    queryFn: fetchGraphs,
    staleTime: 60 * 1000, // 1 minute stale time
  });
}
