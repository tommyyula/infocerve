import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui';
import { useLanguageStore } from '@/stores/useLanguageStore';

interface AddIngredientProps {
  onAdd: (name: string) => void;
}

export function AddIngredient({ onAdd }: AddIngredientProps) {
  const [value, setValue] = useState('');
  const { t } = useLanguageStore();

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('addIngredientPlaceholder')}
        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors"
      />
      <Button onClick={handleAdd} variant="secondary" size="md">
        {t('addButton')}
      </Button>
    </div>
  );
}
