/** 掲示板カテゴリの値（DB保存用） */
export type BoardCategoryValue = "ground" | "underground" | "mens_underground" | "other";

/** カテゴリ値と表示ラベルの対応 */
export const BOARD_CATEGORIES: { value: BoardCategoryValue; label: string }[] = [
  { value: "ground", label: "地上" },
  { value: "underground", label: "地下アイドル" },
  { value: "mens_underground", label: "メン地下" },
  { value: "other", label: "その他" },
];

/** 値からラベルを取得 */
export function getBoardCategoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const found = BOARD_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? value;
}
