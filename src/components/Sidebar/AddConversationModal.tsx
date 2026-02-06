import { useEffect } from "react";
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner"
import {Loader2, Wifi} from "lucide-react"

import { conversationService } from "../../services/conversationService";
import { useSocketContext } from "../../contexts/SocketContext";
import Modal from "../ui/Modal";
import { useQuery } from "@tanstack/react-query";

const addConversationSchema = z.object({
    connectCode: z.string().min(6, {message: "Invalid connect ID"})
})

type AddConversationFormData = z.infer<typeof addConversationSchema>

interface AddConversationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AddConversationModal: React.FC<AddConversationModalProps> = ({
    isOpen,
    onClose
}) => {
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors }
    } = useForm<AddConversationFormData>({
        resolver: zodResolver(addConversationSchema)
    })
    const { socket } = useSocketContext();

    const connectCode = watch('connectCode');

    const { isFetching, refetch } = useQuery({
        queryKey: ["checkConnectCode", connectCode],
        queryFn: () => conversationService.checkConnectCode(connectCode),
        enabled: false,
        retry: false
    })

    const onSubmit = async (formData: AddConversationFormData) => {
        const result = await refetch();

        if (result?.data?.success) {
            socket?.emit('conversation:request', {
                connectCode: formData.connectCode,
            })
            onClose();
        } else {
            toast.error(result.error?.response?.data.message ?? "Invalid connect ID");
        }
    }

    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset])

    return <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Conversation"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <label htmlFor="connectCode" className="block text-gray-700 mb-2 text-sm">Connect ID</label>
                <div className="relative mb-2">
                    <Wifi className="absolute inset-y-0 left-3 size-5 text-gray-400 top-1/2 -translate-y-1/2"/>
                    <input 
                        {...register('connectCode')}
                        className="text-black text-sm w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
                {errors.connectCode && <p className="text-red-500 text-sm">{errors.connectCode.message}</p>}
                <button
                    type="submit"
                    disabled={isFetching}
                    className="w-full flex justify-center items-center bg-sky-500 text-white py-2 rounded-lg hover:bg-blue-600 transition cursor-pointer mt-4"
                >
                    {isFetching ? <Loader2 className="animate-spin size-5"/> : "Connect"}
                </button>
            </form>
        </Modal>
    </>
}

export default AddConversationModal;