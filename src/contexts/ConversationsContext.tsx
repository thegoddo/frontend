import React, { createContext, useContext, useEffect, useState } from "react"
import type { User } from "../stores/authStore"
import { useConversations } from "../hooks/useConversations"
import { useSocketContext } from "./SocketContext"
import { toast } from "sonner";

export type Conversation = {
    conversationId: string,
    friend: User & {
        online: boolean
    },
    unreadCounts: Record<string, number>,
    lastMessage: {
        content: string
        timestamp: Date
    }
}

type ConversationsContextType = {
    conversations: Conversation[],
    filteredConversations: Conversation[],
    searchTerm: string,
    setSearchTerm: (term: string) => void;

    isLoading: boolean
    isError: boolean
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export const useConversationsContext = () => {
    const context = useContext(ConversationsContext);
    if (!context) throw new Error("useConversationsContext must be used within ConversationsProvider")
    return context;
}

export const ConversationsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const {data, isLoading, isError} = useConversations();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const { socket } = useSocketContext();

    useEffect(() => {
        if (data) setConversations(data.data);
    }, [data])

    const filteredConversations = conversations.filter(conversation =>
        conversation.friend.username.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleConversationOnlineStatus = ({friendId, username, online}: {friendId: string, username: string, online: boolean}) => {
        setConversations((prev) => {
            return prev.map((conversation) => {
                if (conversation.friend.id === friendId) {
                    if (conversation.friend.online != online) {
                        toast.info(`${username} is ${online ? 'online' : 'offline'}`);
                    }

                    return {...conversation, friend: {...conversation.friend, online}};
                }

                return conversation;
            })
        })
    }
    const handleNewConversation = (conversation: Conversation) => {
        console.log("conversation:accept", conversation);
        setConversations((prev) => {
            return [...prev, conversation];
        })
        toast.success(`You and ${conversation.friend.username} are now friends!`);

        if (socket) {
            socket.disconnect();
            socket.connect();
        }
    }

    const handleConversationUpdateUnreadCounts = (conversation: {conversationId: string, unreadCounts: Record<string, number>}) => {
        console.log("conversation:update-unread-counts", conversation)
        setConversations((prev) => {
            return prev.map((c) => {
                if (c.conversationId === conversation.conversationId) {
                    return {...c, unreadCounts: conversation.unreadCounts}
                } else {
                    return c;
                }
            })
        })
    }

    const handleConversationUpdate = (conversation: Pick<Conversation, "conversationId" | "lastMessage" | "unreadCounts">) => {
        console.log(conversation);
        setConversations((prev) => {
            return prev.map((c) => {
                if (c.conversationId === conversation.conversationId) {
                    return {...c, lastMessage: conversation.lastMessage, unreadCounts: conversation.unreadCounts}
                }

                return c;
            })
        });
    }

    const handleErrorNewConversation = () => toast.error("Unable to add conversation!");
    const handleErrorConversationMarkAsRead = () => toast.error("Unable to mark conversation as read!");

    useEffect(() => {
        socket?.on("conversation:online-status", handleConversationOnlineStatus);
        socket?.on("conversation:accept", handleNewConversation);
        socket?.on("conversation:update-unread-counts", handleConversationUpdateUnreadCounts);
        socket?.on("conversation:update-conversation", handleConversationUpdate);
        socket?.on("conversation:request:error", handleErrorNewConversation);
        socket?.on("conversation:mark-as-read:error", handleErrorConversationMarkAsRead);

        return () => {
            socket?.off("conversation:online-status", handleConversationOnlineStatus);
            socket?.off("conversation:accept", handleNewConversation);
            socket?.off("conversation:update-unread-counts", handleConversationUpdateUnreadCounts);
            socket?.off("conversation:update-conversation", handleConversationUpdate);
            socket?.off("conversation:request:error", handleErrorNewConversation);
            socket?.off("conversation:mark-as-read:error", handleErrorConversationMarkAsRead);
        }
    }, [socket])

    return <ConversationsContext.Provider value={{conversations, filteredConversations, searchTerm, setSearchTerm, isLoading, isError}}>
        {children}
    </ConversationsContext.Provider>
}