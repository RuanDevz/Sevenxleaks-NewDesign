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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`
          relative w-[90vw] max-w-[600px] h-auto max-h-[80vh]
          md:w-[80vw] md:max-w-[800px] md:max-h-[85vh]
          rounded-xl shadow-2xl overflow-hidden
          animate-scaleIn
          ${theme === 'dark' ? 'bg-gray-900/95' : 'bg-white/95'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={`
            absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200
            ${theme === 'dark'
              ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white'
              : 'bg-gray-100/80 hover:bg-gray-200 text-gray-600 hover:text-gray-900'}
          `}
        >
          <X size={24} />
        </button>

        <img
          src={imageUrl}
          alt={contentName || 'Preview'}
          className="w-full h-full object-contain"
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
