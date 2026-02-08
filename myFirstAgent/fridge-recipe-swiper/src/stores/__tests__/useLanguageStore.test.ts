import { describe, it, expect, beforeEach } from 'vitest';
import { useLanguageStore } from '../useLanguageStore';

describe('useLanguageStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLanguageStore.setState({ language: 'zh' });
  });

  describe('language state', () => {
    it('should have Chinese as default language', () => {
      const { language } = useLanguageStore.getState();
      expect(language).toBe('zh');
    });

    it('should be able to change language to English', () => {
      const { setLanguage } = useLanguageStore.getState();
      setLanguage('en');
      expect(useLanguageStore.getState().language).toBe('en');
    });

    it('should be able to change language back to Chinese', () => {
      const { setLanguage } = useLanguageStore.getState();
      setLanguage('en');
      setLanguage('zh');
      expect(useLanguageStore.getState().language).toBe('zh');
    });
  });

  describe('translation function', () => {
    it('should return Chinese translation by default', () => {
      const { t } = useLanguageStore.getState();
      expect(t('appName')).toBe('冰箱食谱');
    });

    it('should return English translation when language is set to English', () => {
      const { setLanguage } = useLanguageStore.getState();
      setLanguage('en');
      const { t } = useLanguageStore.getState();
      expect(t('appName')).toBe('Fridge Recipe');
    });

    it('should handle nested translation keys', () => {
      const { t } = useLanguageStore.getState();
      expect(t('difficulty.easy')).toBe('简单');
      expect(t('difficulty.medium')).toBe('中等');
      expect(t('difficulty.hard')).toBe('困难');
    });

    it('should handle parameters in translations', () => {
      const { t } = useLanguageStore.getState();
      expect(t('savedRecipes', { count: 5 })).toBe('你收藏了 5 个食谱');
    });

    it('should return the key if translation is not found', () => {
      const { t } = useLanguageStore.getState();
      expect(t('nonExistentKey')).toBe('nonExistentKey');
    });

    it('should return the key for non-string values', () => {
      const { t } = useLanguageStore.getState();
      // Accessing nested object without going to leaf
      expect(t('difficulty')).toBe('difficulty');
    });
  });
});
