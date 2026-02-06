export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black pb-20 text-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">プライバシーポリシー</h1>
        <p className="mb-4 text-xs text-zinc-400">
          本プライバシーポリシーは、本サービス「CallGuide」（以下、「本サービス」といいます）における、ユーザーの個人情報および関連情報の取り扱い方針を示すものです。
        </p>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">1. 収集する情報</h2>
          <p>本サービスでは、以下の情報を取得する場合があります。</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-zinc-400">
            <li>ユーザーが登録時に入力した情報（ニックネーム、メールアドレス等）</li>
            <li>本サービス上でユーザーが投稿したテキストその他のコンテンツ</li>
            <li>Cookieや類似の技術を用いて取得されるアクセス情報、端末情報、利用履歴</li>
          </ul>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">2. 情報の利用目的</h2>
          <p>取得した情報は、以下の目的で利用します。</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-zinc-400">
            <li>本サービスの提供・運営・改善のため</li>
            <li>不具合・不正利用の監視および対応のため</li>
            <li>お問い合わせ対応や重要なお知らせの通知のため</li>
            <li>利用状況の分析や新機能・サービスの検討のため</li>
            <li>広告の最適化およびアフィリエイトプログラムの効果測定のため</li>
          </ul>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">
            3. 広告配信およびCookieの使用について
          </h2>
          <p>
            本サービスでは、第三者配信の広告サービス（Google
            AdSense等）を利用する場合があります。これらの事業者は、ユーザーの興味・関心に応じた広告を表示するためにCookieを使用することがあります。
          </p>
          <p>
            ユーザーは、ブラウザの設定を変更することでCookieの利用を制限・拒否することができますが、その場合、一部の機能が正常に動作しない可能性があります。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">
            4. Amazonアソシエイト・プログラムに関する表示
          </h2>
          <p>
            本サービスはAmazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供する、
            Amazonアソシエイト・プログラムの参加者である場合があります。
          </p>
          <p>
            本サービス内の商品リンク等を経由して行われた購入に関する情報は、Amazonアソシエイト・プログラムの仕組みに基づき計測されますが、
            その詳細な個人情報は原則として本サービス運営者には開示されません。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">5. 第三者への提供</h2>
          <p>
            運営者は、法令で認められる場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">6. 情報の管理</h2>
          <p>
            運営者は、取得した情報が不正アクセス、紛失、破壊、改ざん、漏えい等されないよう、合理的な範囲で安全管理措置を講じます。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">7. プライバシーポリシーの変更</h2>
          <p>
            本ポリシーの内容は、必要に応じて予告なく変更される場合があります。変更後のプライバシーポリシーは、本サービス上に掲載された時点より効力を生じるものとします。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">8. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、お問い合わせフォーム（「お問い合わせ」ページ）よりご連絡ください。
          </p>
        </section>

        <p className="mt-6 text-[10px] text-zinc-500">
          制定日：{new Date().getFullYear()}年
        </p>
      </div>
    </main>
  );
}

