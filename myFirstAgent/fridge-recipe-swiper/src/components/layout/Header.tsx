interface HeaderProps {
  onFavoritesClick: () => void;
}

export function Header({ onFavoritesClick }: HeaderProps) {
  return (
    <header className="flex justify-between items-center px-5 py-4 bg-white border-b border-gray-100">
      <h1 className="text-lg font-bold text-gray-800">🍳 冰箱食谱</h1>
      <button
        onClick={onFavoritesClick}
        className="text-2xl hover:scale-110 transition-transform"
        title="View favorites"
      >
        ❤️
      </button>
    </header>
  );
}
