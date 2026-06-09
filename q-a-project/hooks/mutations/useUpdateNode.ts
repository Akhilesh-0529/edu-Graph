import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraphNode, GraphOutput } from "@/lib/schemas/graph-output";

interface UpdateNodeParams {
  graphId: string;
  node: GraphNode;
}

async function updateNodeRequest({ graphId, node }: UpdateNodeParams): Promise<boolean> {
  const response = await fetch(`/api/graph/node`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ graphId, node }),
  });

  if (!response.ok) {
    throw new Error("Failed to persist node update.");
  }
  return true;
}

export function useUpdateNode() {
  const queryClient = useQueryClient();

  const mutation = useMutation<boolean, Error, UpdateNodeParams, { previousGraph: GraphOutput | undefined }>({
    mutationFn: updateNodeRequest,
    // Optimistic Update Configuration
    onMutate: async ({ graphId, node }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["graph", graphId] });

      // Snapshot the previous value
      const previousGraph = queryClient.getQueryData<GraphOutput>(["graph", graphId]);

      // Optimistically update to the new value
      if (previousGraph) {
        queryClient.setQueryData<GraphOutput>(["graph", graphId], {
          ...previousGraph,
          nodes: previousGraph.nodes.map((n) => (n.id === node.id ? node : n)),
        });
      }

      // Return context with snapshotted value
      return { previousGraph };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTodo, context) => {
      if (context?.previousGraph) {
        queryClient.setQueryData(["graph", newTodo.graphId], context.previousGraph);
      }
    },
    // Always refetch after success or failure
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["graph", variables.graphId] });
    },
  });

  return {
    mutate: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
