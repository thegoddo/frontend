import { Send, Smile, Paperclip, FileText, Image as ImageIcon, MapPin } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useConversationStore } from "../../stores/conversationStore";
import { useSocketContext } from "../../contexts/SocketContext";
import { useRef, useState, useEffect } from "react";
import EmojiPicker,  {type EmojiClickData } from "emoji-picker-react"

const MessageInput: React.FC = () => {
    const { user } = useAuthStore();
    const { selectedConversation } = useConversationStore();
    const { socket } = useSocketContext();
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const attachmentRef = useRef<HTMLDivElement>(null);
    const attachmentBtnRef = useRef<HTMLButtonElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showAttachments &&
                attachmentRef.current &&
                !attachmentRef.current.contains(event.target as Node) &&
                attachmentBtnRef.current &&
                !attachmentBtnRef.current.contains(event.target as Node)
            ) {
                setShowAttachments(false);
            }

            if (
                showEmojiPicker &&
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node) &&
                emojiBtnRef.current &&
                !emojiBtnRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showAttachments, showEmojiPicker]);

    const typingTimeoutRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);

    const emitTyping = (isTyping: boolean) => {
        if (!socket || !user || !selectedConversation) return;

        socket.emit("conversation:typing", {
            userId: user.id,
            friendId: selectedConversation.friend.id,
            isTyping,
        })
        isTypingRef.current = isTyping;
    }

    if (!selectedConversation) return;

    const handleSendMessage = () => {
        if (message.trim() === '' || !user || !socket) return;

        socket.emit("conversation:send-message", {
            conversationId: selectedConversation.conversationId,
            userId: user.id,
            friendId: selectedConversation.friend.id,
            content: message.trim(),
        })

        setMessage('');

        if (isTypingRef.current) {
            emitTyping(false);
        }
    }

    const handleTyping = () => {
        if (!isTypingRef.current) {
            emitTyping(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            emitTyping(false);
        }, 500)
    }

    const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        handleTyping();
    }

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setMessage((prev) => prev + emojiData.emoji);
        handleTyping();
    }
    
    const handleDocument = (e: any) => {

    }
    
    const handleImage = (e: any) => {
        
    }
    
    const handleLocation = (e: any) => {
        
    }

    return <div className="p-4 border border-gray-200 bg-white relative">
        {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-20 left-4 z-10 shadow-xl rounded-xl">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
        )}
        {showAttachments && (
            <div ref={attachmentRef} className="absolute bottom-20 left-12 z-10 bg-white shadow-xl rounded-xl p-2 flex flex-col gap-1 border border-gray-100 w-48">
                <button type="button" className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors w-full text-left">
                    <div className="bg-purple-100 p-2 rounded-full">
                    <button 
                    title="Document"
                    onClick={handleDocument}
                    type="button"
                    >

                    </button>
                        <FileText className="size-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Document</span>
                </button>
                <button type="button" className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors w-full text-left">
                    <div className="bg-sky-100 p-2 rounded-full">
                    <button 
                    title="Image"
                    onClick={handleImage}
                    type="button"
                    >
                        <ImageIcon className="size-4 text-sky-600" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">Image</span>
                        <span className="text-[10px] text-gray-400">JPG, PNG</span>
                    </div>
                </button>
                <button type="button" className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors w-full text-left">
                    <div className="bg-orange-100 p-2 rounded-full">
                    <button 
                    title="Location"
                    onClick={handleLocation}
                    type="button"
                    >
                        <MapPin className="size-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">Location</span>
                </button>
            </div>
        )}
        <div className="flex items-center gap-2">
            <button
                ref={emojiBtnRef}
                title="emoji picker"
                type="button"
                onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowAttachments(false);
                }}
                className={`text-gray-500 hover:text-sky-500 transition-colors p-2 ${showEmojiPicker ? 'text-sky-500' : ''}`}
            >
                <Smile className="size-6" />
            </button>
            <button
                ref={attachmentBtnRef}
                title="attachments"
                type="button"
                onClick={() => {
                    setShowAttachments(!showAttachments);
                    setShowEmojiPicker(false);
                }}
                className={`text-gray-500 hover:text-sky-500 transition-colors p-2 ${showAttachments ? 'text-sky-500' : ''}`}
            >
                <Paperclip className="size-6" />
            </button>
            
            <div className="flex-1">
                <textarea 
                    placeholder="Type a message..."
                    className="w-full text-sm bg-gray-100 rounded-full py-3 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    value={message}
                    onChange={(e) => handleOnChange(e)}
                    rows={1}
                />
            </div>

            <div className="">
                <button
                    title="send button"
                    onClick={handleSendMessage}
                    type="button"
                    className="bg-sky-500 text-white rounded-full size-10 flex items-center justify-center hover:bg-sky-600 cursor-pointer"
                >
                    <Send className="size-4"/>
                </button>
            </div>
        </div>
    </div>
}

export default MessageInput;