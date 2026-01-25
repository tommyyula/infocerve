interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, onRemove, className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md text-gray-700 ${className}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
        >
          &times;
        </button>
      )}
    </span>
  );
}
