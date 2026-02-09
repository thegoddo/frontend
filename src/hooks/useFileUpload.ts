import { useState, useCallback } from "react";
// import axios from "axios";
import apiClient from "../utils/apiClient";
import { toast } from "sonner";

interface UseFileUploadReturn {
    uploadFile: (file: File) => Promise<string | null>;
    isUploading: boolean;
    error: string | null
}


const FILE_SIGNATURES: Record<string, string> = {
    "FFD8FF": "image/jpeg",
  "89504E47": "image/png",
  "47494638": "image/gif",
  "25504446": "application/pdf",
}

export const useFileUpload = (): UseFileUploadReturn => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Read first 4 bytes to determine type
    const validateFileSignature = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      // Read only the first 4 bytes
      reader.readAsArrayBuffer(file.slice(0, 4));

      reader.onload = (e) => {
        if (!e.target?.result) {
          resolve(false);
          return;
        }

        const buffer = e.target.result as ArrayBuffer;
        const uint8Array = new Uint8Array(buffer);
        
        // Convert bytes to Hex string
        let header = "";
        for (let i = 0; i < uint8Array.length; i++) {
          header += uint8Array[i].toString(16).toUpperCase().padStart(2, "0");
        }

        // Check if the header matches any known signature
        // Note: JPEG files can have slight variations, but they always start with FFD8FF
        const isMatches = Object.keys(FILE_SIGNATURES).some((signature) =>
          header.startsWith(signature)
        );

        if (!isMatches) {
          console.warn(`File header mismatch. Header: ${header}`);
        }
        
        resolve(isMatches);
      };

      reader.onerror = () => resolve(false);
    });
  };
  
    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        setIsUploading(true);
        setError(null);

        try {
            if (!file.name.match(/\.(jpg|jpeg|png)$/i)) {
                throw new Error("Invalid file extension. Only JPG and PNG are allowed.");
            }
            
            const isValidHeader = await validateFileSignature(file);
            if (!isValidHeader) {
                throw new Error("Security Alert: File content does not match its extension.");
            }
            
            const formData = new FormData();
            formData.append("image", file);

            const response = await apiClient.post("/upload/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            })
            
            if (response.data.success) {
                return response.data.imageUrl;
            } else {
                throw new Error(response.data.message || "Upload failed");
            }
                
        } catch (error: any) {
            const errorMessage = error.message || "An unexpected error occured"
            setError(errorMessage);
            toast.error(errorMessage);
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    return { uploadFile, isUploading, error };
}