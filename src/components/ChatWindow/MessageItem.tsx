import { Download } from "lucide-react"; // Import Download icon
import type { Message } from "../../services/messageService";
import { useAuthStore } from "../../stores/authStore";
import LocationMap from "../ui/LocationMap";
import { toast } from "sonner";

const MessageItem: React.FC<Message> = ({ sender, content, createdAt }) => {
  const { user } = useAuthStore();
  const userIsSender = sender._id === user?.id;

  const created = new Date(createdAt);
  const now = new Date();
  const diffInMs = now.getTime() - created.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  const time = created.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = created.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const displayTime = diffInDays > 1 ? `${date} ${time}` : time;

  // --- CONTENT TYPE CHECKS ---
  const isLocation = content.startsWith("geo:");
  const isImage = content.startsWith("img:");

  // --- DOWNLOAD HANDLER ---
  const handleDownload = async (url: string) => {
    try {
      // Fetch as blob to force download (avoids opening in new tab)
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `shared-image-${Date.now()}.jpg`; // Default filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
      toast.success("Image downloaded");
    } catch (error) {
      console.error("Download failed", error);
      toast.error("Failed to download image");
    }
  };

  // --- RENDER HELPER ---
  const renderContent = () => {
    // 1. RENDER MAP
    if (isLocation) {
      const coords = content.replace("geo:", "").split(",");
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return <LocationMap latitude={lat} longitude={lng} />;
      }
    }

    // 2. RENDER IMAGE
    if (isImage) {
      const imageUrl = content.replace("img:", "");
      return (
        <div className="relative group mt-1">
          {/* Image Display */}
          <div className="rounded-lg overflow-hidden border border-black/10">
            <img
              src={imageUrl}
              alt="attachment"
              className="max-w-full h-auto max-h-[300px] object-cover cursor-pointer"
              onClick={() => window.open(imageUrl, "_blank")} // Click to view full size
            />
          </div>

          {/* Download Button (Visible on Hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening image when clicking download
              handleDownload(imageUrl);
            }}
            className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
            title="Download Image"
          >
            <Download className="size-4" />
          </button>
        </div>
      );
    }

    // 3. RENDER TEXT
    return <p className="text-sm">{content}</p>;
  };

  if (userIsSender) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-sky-500 text-white p-3 max-w-xs lg:max-w-md rounded-2xl overflow-hidden relative">
          {renderContent()}
          <span className="text-xs flex items-center gap-1 text-blue-100 mt-1 justify-end">
            {displayTime}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex mb-4">
      <img
        src="https://avatar.iran.liara.run/public"
        alt={sender.username}
        className="size-8 rounded-full object-cover mr-2"
      />
      <div className="bg-white p-3 max-w-xs lg:max-w-md rounded-2xl overflow-hidden relative border border-gray-100 shadow-sm">
        {renderContent()}
        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1 justify-end">
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
