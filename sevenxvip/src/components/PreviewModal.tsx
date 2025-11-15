import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect } from 'react';

interface PreviewModalProps {
  imageUrl: string;
  onClose: () => void;
  contentName?: string;
}

export function PreviewModal({ imageUrl, onClose, contentName }: PreviewModalProps) {
  const { theme } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`
          relative w-full h-full max-h-full max-w-full overflow-y-auto p-6 rounded-none
          ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between pb-4 mb-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <h3
            className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            {contentName ? `Preview — ${contentName}` : 'Preview'}
          </h3>

          <button
            onClick={onClose}
            className={`
              p-2 rounded-md
              ${theme === 'dark'
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}
            `}
          >
            <X size={28} />
          </button>
        </div>

        <img
          src={imageUrl}
          alt={contentName || 'Preview'}
          className="w-full h-auto max-h-[calc(100vh-100px)] object-contain rounded-lg mx-auto"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            t.src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23333" width="400" height="300"/%3E%3Ctext fill="%23fff" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>
    </div>
  );
}
