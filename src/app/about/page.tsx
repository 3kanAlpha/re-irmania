import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "このサイトについて",
  description: "「IRmania」についての解説ページです。",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-4">
      <h1 className="text-3xl font-bold mb-4">このサイトについて</h1>

      <h2 className="text-xl font-bold mb-2">IRmania とは？</h2>
      <div className="mb-6">
        <p>
          <span className="font-bold">IRmania</span>
          は、様々な音楽ゲームで手軽に大会を開くためのプラットフォームです。
          <br />
          使用するゲームタイトルと譜面を指定することで誰でも簡単に大会を開くことができ、
          また他のプレイヤーが作成した大会に参加することもできます。
        </p>
      </div>

      <h2 className="text-xl font-bold mb-2">初めての方へ</h2>
      <div className="mb-6">
        <p className="mb-2">
          大会を作成する、または既存の大会へ参加するには
          <span className="font-bold">アカウントが必要となります</span>。<br />
          サイト上部にあるナビゲーションバーからログインページへ移動し、アカウントを作成してください。
        </p>
        <p>
          IRmaniaではDiscordアカウントと連携してアカウントを作成します。ログインをすることで、自動的にアカウントが作成されます。
        </p>
      </div>

      <h2 className="text-xl font-bold mb-2">大会に参加する</h2>
      <div className="mb-6">
        <p className="mb-2">
          現在開催中の大会は、トップページから確認することができます。
          <br />
          参加したい大会があったら、クリックすることで各大会の詳細ページへ移動できます。
        </p>
        <p className="mb-4">
          各大会のページでは、現在提出されているスコアのランキングを確認することができます。
          <br />
          またログイン済みの場合、大会へのスコア提出ができるようになります。「スコア提出」ボタンからフォームにアクセスできるので、フォームに必要な情報を入力して提出してください。
        </p>

        <h3 className="text-xl font-bold">スコアを提出する際の注意</h3>
        <p className="mb-2">
          アカウントを作成した後、最初はプレイヤー名が未設定となっているため、
          <Link
            href="/dashboard"
            className="text-sky-600 dark:text-sky-400 hover:underline"
          >
            ダッシュボード
          </Link>
          からプレイヤー名を設定してください。
          <br />
          プレイヤー名が未設定のままスコアを提出をしてしまった場合でも、後からプレイヤー名を設定できます。
        </p>
      </div>

      <h2 className="text-xl font-bold mb-2">大会を作成する</h2>
      <div className="mb-6">
        <p>工事中</p>
      </div>

      <h2 className="text-xl font-bold mb-2">クレジット</h2>
      <div className="mb-4">
        <ul>
          <li>
            開発 : まぐ{" "}
            <a
              href="https://twitter.com/luigi_0829_2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              @luigi_0829_2
            </a>
          </li>
          <li>
            ロゴ : さち{" "}
            <a
              href="https://twitter.com/keepthechain999"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              @keepthechain999
            </a>
          </li>
        </ul>
      </div>
    </main>
  );
}
