/**
 * Supabase 認証エラーメッセージを日本語に変換するマッピング（拡張しやすい形）
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "メールアドレスまたはパスワードが間違っています",
  "Email not confirmed": "メールアドレスの確認が完了していません。メールボックスを確認してください",
};

export const DEFAULT_LOGIN_ERROR =
  "ログインに失敗しました。時間をおいて再度お試しください";
export const DEFAULT_SIGNUP_ERROR =
  "新規登録に失敗しました。時間をおいて再度お試しください";

export function getAuthErrorMessage(
  message: string,
  fallback: string = DEFAULT_LOGIN_ERROR
): string {
  return AUTH_ERROR_MESSAGES[message] ?? fallback;
}
