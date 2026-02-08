import { useEffect, type RefObject } from "react";
import { useAuthStore } from "../stores/authStore";
import { useSocketContext } from "../contexts/SocketContext";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Message } from "../services/messageService";

export function useMessageListen(
    conversationId: string | undefined,
    friendId: string | undefined,
    containerRef: RefObject<HTMLDivElement | null>
) {
    const { user } = useAuthStore();
    const { socket } = useSocketContext()
    const queryClient = useQueryClient();
    const sound = new Audio("/pop.mp3");
    

    useEffect(() => {
        if (!conversationId || !friendId || !socket) return;

        const handleSendMessageError = (error: { error: string }) => toast.error(error.error);
        
        const handleNewMessage = (payload: { conversationId: string, message: Message }) => {
            if (payload.conversationId !== conversationId) return;
            
            queryClient.setQueryData(
                ["messages", conversationId],
                (currentData: InfiniteData<{ messages: Message[], nextCursor: string, hasNext: boolean }>) => {
                    if (!currentData || !currentData.pages.length) return currentData;
                    
                    const messages = currentData.pages.flatMap((page) => page.messages);
                    if (messages.some((message: Message) => message._id === payload.message._id)) return currentData;

                    const updatePages = [...currentData.pages];
                    updatePages[0] = {
                        ...updatePages[0],
                        messages: [...updatePages[0].messages, payload.message]
                    }
                    
                    return { ...currentData, pages: updatePages };
                }
            )
            
            if (payload.message.sender._id !== user?.id) {
                try {
                    sound.currentTime = 0;
                    sound.play();
                } catch (error) {
                    console.warn("Audio playback failed", error);
                }
            }
            
            setTimeout(() => {
                if (!containerRef.current) return;

                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: 'smooth'
                })
            }, 0)
        }
        socket.on("conversation:new-message", handleNewMessage);
        socket.on("conversation:send-message:error", handleSendMessageError);

        return () => {
            socket.off("conversation:new-message", handleNewMessage);
            socket.off("conversation:send-message:error", handleSendMessageError);
        }
    }, [conversationId, friendId, user, socket, queryClient])
}