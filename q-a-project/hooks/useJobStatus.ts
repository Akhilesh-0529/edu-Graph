import { useQuery } from "@tanstack/react-query";

export interface JobStatusResponse {
  success: boolean;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  result?: unknown;
  error?: string;
}

async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/process/${jobId}/status`);
  if (!response.ok) {
    throw new Error(`Failed to poll status for job: ${jobId}`);
  }
  return response.json();
}

export function useJobStatus(jobId: string) {
  const query = useQuery<JobStatusResponse, Error>({
    queryKey: ["jobStatus", jobId],
    queryFn: () => fetchJobStatus(jobId),
    enabled: !!jobId,
    // Poll every 2 seconds (2000ms). Disable polling once status is COMPLETED or FAILED.
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state && (state.status === "COMPLETED" || state.status === "FAILED")) {
        return false;
      }
      return 2000;
    },
    staleTime: 0, // Always fetch fresh
  });

  return {
    status: query.data?.status || "PENDING",
    progress: query.data?.progress ?? 0,
    result: query.data?.result,
    error: query.data?.error || query.error?.message,
    isLoading: query.isLoading,
  };
}
