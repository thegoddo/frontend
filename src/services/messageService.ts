import apiClient from "../utils/apiClient";

export type Message = {
    _id: string;
    conversation: string;
    sender: {
        _id: string;
        username: string;
    };
    content: string;
    read: boolean;
    createdAt: string;
}

interface MessageResponse {
    messages: Message[],
    nextCursor: string | undefined,
    hasNext: boolean
}

export const messageService = {
    fetchMessages: async (conversationId: string, cursor?: string): Promise<MessageResponse> => {
        const result = await apiClient.get(`/conversations/${conversationId}/messages`, {
            params: {
                cursor,
            }
        })
        
        return result.data;
    }
}