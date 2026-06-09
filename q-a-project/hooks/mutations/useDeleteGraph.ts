import { useMutation, useQueryClient } from "@tanstack/react-query";

async function deleteGraphRequest(graphId: string): Promise<boolean> {
  const response = await fetch(`/api/graph?graphId=${graphId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to delete knowledge graph.");
  }
  return true;
}

export function useDeleteGraph() {
  const queryClient = useQueryClient();

  const mutation = useMutation<boolean, Error, string>({
    mutationFn: deleteGraphRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graphs"] });
    },
  });

  return {
    deleteGraph: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
