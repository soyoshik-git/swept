import type { Variants, Transition } from "motion/react";

/** ページ内カードのフェードアップ */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0 },
};

/** モーダル・ダイアログのスケールイン */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1 },
  exit:   { opacity: 0, scale: 0.96 },
};

/** ボトムシートのスライドアップ */
export const slideUp: Variants = {
  hidden: { y: "100%" },
  show:   { y: 0 },
  exit:   { y: "100%" },
};

/** オーバーレイのフェード */
export const overlay: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
  exit:   { opacity: 0 },
};

/** リストを stagger で表示するコンテナ */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.05,
    },
  },
};

/** スプリング（スナップ感） */
export const spring: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 28,
};

/** スプリング（柔らかい） */
export const softSpring: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 24,
};

/** ボトムシート専用スプリング */
export const sheetSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 36,
  mass: 0.9,
};

/** すばやいフェード */
export const fastFade: Transition = {
  duration: 0.18,
  ease: [0.4, 0, 0.2, 1],
};
