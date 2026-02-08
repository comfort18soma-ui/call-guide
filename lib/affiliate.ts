const AFFILIATE_TAG = "callguide2026-22";

/**
 * Amazon 系URL（amazon.co.jp / amzn.to）の場合のみ、
 * クエリに tag=callguide2026-22 を追加または上書きして返す。
 * 既存のクエリパラメータは維持する。
 */
export function convertAmazonLink(url: string | null | undefined): string | null {
  const raw = (url ?? "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (!lower.includes("amazon.co.jp") && !lower.includes("amzn.to")) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    parsed.searchParams.set("tag", AFFILIATE_TAG);
    return parsed.toString();
  } catch {
    return raw;
  }
}
