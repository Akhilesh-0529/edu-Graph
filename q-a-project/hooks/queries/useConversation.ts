import { useQuery } from "@tanstack/react-query";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

async function fetchConversation(graphId: string): Promise<ChatMessage[]> {
  const response = await fetch(`/api/chat/history?graphId=${graphId}`);
  if (!response.ok) {
    throw new Error("Failed to retrieve conversation logs.");
  }
  const data = await response.json();
  return data.messages || [];
}

export function useConversation(graphId: string) {
  return useQuery<ChatMessage[], Error>({
    queryKey: ["conversation", graphId],
    queryFn: () => fetchConversation(graphId),
    enabled: !!graphId,
    staleTime: 30 * 1000, // 30 seconds stale time
  });
}
