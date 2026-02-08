import { useConversationStore } from "../../stores/conversationStore";
import ChatHeader from "./ChatHeader";
import ChatPlaceholder from "./ChatPlaceholder";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

const ChatWindow: React.FC = () => {
    const {selectedConversation} = useConversationStore();

    return <div className="min-h-screen max-h-screen w-full bg-white flex flex-col justify-between">
        {selectedConversation && <ChatHeader />}
        {selectedConversation && <MessageList />}
        {!selectedConversation && <ChatPlaceholder />}
        {selectedConversation && <MessageInput />}
    </div>
}

export default ChatWindow;