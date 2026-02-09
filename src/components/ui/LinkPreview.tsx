import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

interface LinkPreviewProps {
  url: string;
}

interface PreviewData {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
}

const LinkPreview: React.FC<LinkPreviewProps> = ({ url }) => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        // Call YOUR backend, not the target URL directly
        const { data } = await apiClient.post("/utils/link-preview", { url });
        if (isMounted) setPreview(data);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error || !preview) return null; // Hide if failed

  // If loading, you can return a skeleton or null
  if (loading)
    return (
      <div className="mt-2 w-full h-24 bg-gray-100 rounded-lg animate-pulse" />
    );

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 mb-1 no-underline group"
    >
      <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:bg-gray-100 transition-colors">
        {/* Image Section */}
        {preview.image && (
          <div className="h-32 w-full overflow-hidden bg-gray-200">
            <img
              src={preview.image}
              alt={preview.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Text Section */}
        <div className="p-3">
          <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1">
            {preview.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
            {preview.description}
          </p>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">
            {preview.siteName || new URL(url).hostname}
          </span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
