import { Eye } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface PreviewButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export function PreviewButton({ onClick }: PreviewButtonProps) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
        theme === 'dark'
          ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
          : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
      }`}
      aria-label="Preview"
      title="View preview"
    >
      <Eye size={20} />
    </button>
  );
}