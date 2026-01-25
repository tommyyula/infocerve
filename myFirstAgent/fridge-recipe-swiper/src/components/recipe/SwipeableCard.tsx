import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '@/types';

interface SwipeableCardProps {
  recipe: Recipe;
  onSwipe: (direction: 'left' | 'right') => void;
  onClick: () => void;
  isTop: boolean;
  index: number;
}

export function SwipeableCard({
  recipe,
  onSwipe,
  onClick,
  isTop,
  index,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Visual indicators
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipe(direction);
    }
  };

  // Stacking effect for cards below
  const scale = 1 - index * 0.05;
  const y = index * 10;

  return (
    <motion.div
      className="absolute w-full max-w-[340px]"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1,
        scale,
        y,
        zIndex: 10 - index,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale, opacity: 1, y }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        rotate: x.get() > 0 ? 30 : -30,
        transition: { duration: 0.3 },
      }}
    >
      {/* Like/Nope indicators */}
      {isTop && (
        <>
          <motion.div
            className="absolute top-8 right-8 z-10 px-4 py-2 border-4 border-green-500 text-green-500 text-2xl font-bold rounded-lg rotate-12"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-8 left-8 z-10 px-4 py-2 border-4 border-red-500 text-red-500 text-2xl font-bold rounded-lg -rotate-12"
            style={{ opacity: nopeOpacity }}
          >
            NOPE
          </motion.div>
        </>
      )}

      <RecipeCard recipe={recipe} onClick={isTop ? onClick : undefined} />
    </motion.div>
  );
}
