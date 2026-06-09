import { useMutation } from "@tanstack/react-query";

interface UploadParams {
  filename: string;
  contentType: string;
  size: number;
}

interface UploadResponse {
  success: boolean;
  message: string;
  uploadUrl: string;
  filename: string;
}

async function uploadContent(params: UploadParams): Promise<UploadResponse> {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to request upload authorization.");
  }

  return response.json();
}

export function useUploadContent() {
  const mutation = useMutation<UploadResponse, Error, UploadParams>({
    mutationFn: uploadContent,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}
