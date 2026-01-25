/**
 * Format cooking time in minutes to human readable string
 * @param minutes - Cooking time in minutes
 * @returns Formatted string like "15分钟" or "1小时30分钟"
 */
export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${remainingMinutes}分钟`;
}

/**
 * Format difficulty level to Chinese string
 * @param difficulty - Difficulty level
 * @returns Chinese string for difficulty
 */
export function formatDifficulty(
  difficulty: 'easy' | 'medium' | 'hard'
): string {
  const map = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return map[difficulty];
}
