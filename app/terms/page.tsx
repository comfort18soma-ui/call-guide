export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black pb-20 text-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">利用規約</h1>
        <p className="mb-4 text-xs text-zinc-400">
          本規約は、本サービス「CallGuide」（以下、「本サービス」といいます）の利用条件を定めるものです。
          本サービスを利用するすべてのユーザーは、本規約に同意したものとみなします。
        </p>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">第1条（適用）</h2>
          <p>
            本規約は、本サービスの提供条件および本サービスの利用に関する運営者とユーザーとの間の権利義務関係を定めることを目的とし、
            ユーザーによる本サービスの利用に関わる一切の行為に適用されます。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">第2条（禁止事項）</h2>
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-zinc-400">
            <li>法令または公序良俗に違反する行為</li>
            <li>他のユーザーまたは第三者の権利・利益を侵害する行為</li>
            <li>本サービスの運営を妨害する行為、不正アクセスや負荷を与える行為</li>
            <li>本サービスを利用した宣伝・勧誘等、運営者が不適切と判断する行為</li>
          </ul>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">第3条（コンテンツの取り扱い）</h2>
          <p>
            ユーザーが本サービスに投稿したテキストその他のコンテンツは、ユーザー自身がその責任を負うものとし、
            運営者はこれらの内容について一切の責任を負いません。
          </p>
          <p>
            運営者は、本サービスの円滑な運営および品質向上のため、ユーザーの投稿内容を本サービス内で表示・編集・削除・利用することができるものとします。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">第4条（免責事項）</h2>
          <p>
            運営者は、本サービスに関して、事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定目的適合性等を含みますが、これらに限られません）がないことを保証するものではありません。
          </p>
          <p>
            本サービスの利用によりユーザーに生じた損害について、運営者は故意または重過失がある場合を除き、一切の責任を負いません。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">
            第5条（広告およびアフィリエイトプログラムに関する表示）
          </h2>
          <p>
            本サービスは、第三者配信の広告サービス（Google
            AdSense等）を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。
          </p>
          <p>
            また、本サービスはAmazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供する、
            Amazonアソシエイト・プログラムの参加者である場合があります。
          </p>
          <p>
            これらの広告リンク等を通じて商品・サービスを購入した場合のトラブルや損害について、運営者は一切の責任を負いません。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">第6条（規約の変更）</h2>
          <p>
            運営者は、必要と判断した場合には、ユーザーに事前通知することなく本規約を変更することができます。
            変更後の本規約は、本サービス上に表示された時点より効力を生じるものとします。
          </p>
        </section>

        <section className="mb-4 space-y-1.5 text-xs text-zinc-300">
          <h2 className="text-sm font-semibold text-zinc-100">第7条（準拠法・管轄）</h2>
          <p>
            本規約の解釈および適用は日本法に準拠するものとし、本サービスに関連して生じた紛争については、運営者の指定する裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <p className="mt-6 text-[10px] text-zinc-500">
          制定日：{new Date().getFullYear()}年
        </p>
      </div>
    </main>
  );
}

