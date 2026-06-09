import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatMessage } from "../queries/useConversation";

interface SendMessageParams {
  graphId: string;
  query: string;
  messages?: { role: "user" | "assistant"; content: string }[];
  context?: string;
}

interface SendMessageResponse {
  success: boolean;
  response: string;
  provider: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

async function sendMessageRequest(params: SendMessageParams): Promise<SendMessageResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      graphId: params.graphId,
      query: params.query,
      messages: params.messages || [],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message to AI.");
  }
  return response.json();
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SendMessageResponse, Error, SendMessageParams, { previousChat: ChatMessage[] }>({
    mutationFn: sendMessageRequest,
    // Optimistic Update Configuration
    onMutate: async ({ graphId, query }) => {
      await queryClient.cancelQueries({ queryKey: ["conversation", graphId] });

      const previousChat = queryClient.getQueryData<ChatMessage[]>(["conversation", graphId]) || [];

      const optimisticUserMessage: ChatMessage = {
        id: Math.random().toString(),
        sender: "user",
        text: query,
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(["conversation", graphId], [
        ...previousChat,
        optimisticUserMessage,
      ]);

      return { previousChat };
    },
    onError: (err, variables, context) => {
      if (context?.previousChat) {
        queryClient.setQueryData(["conversation", variables.graphId], context.previousChat);
      }
    },
    onSuccess: (data, variables) => {
      const currentChat = queryClient.getQueryData<ChatMessage[]>(["conversation", variables.graphId]) || [];
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(),
        sender: "assistant",
        text: data.response,
        timestamp: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(["conversation", variables.graphId], [
        ...currentChat,
        assistantMessage,
      ]);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", variables.graphId] });
    },
  });

  return {
    mutate: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message || null,
  };
}

