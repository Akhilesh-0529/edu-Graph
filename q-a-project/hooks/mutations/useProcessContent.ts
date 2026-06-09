import { useMutation } from "@tanstack/react-query";

interface ProcessParams {
  filename: string;
  contentUrl?: string;
}

interface ProcessResponse {
  success: boolean;
  message: string;
  jobId: string;
}

async function processContent(params: ProcessParams): Promise<ProcessResponse> {
  const response = await fetch("/api/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to trigger processing queue.");
  }

  return response.json();
}

export function useProcessContent() {
  const mutation = useMutation<ProcessResponse, Error, ProcessParams>({
    mutationFn: processContent,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
