import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function signInWithDiscord() {
  "use server";

  const supabase = await createClient();
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3035";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/auth/sign-in?error=oauth");
  }

  redirect(data.url);
}

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const hasError = params?.error != null;

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-3 text-center">
      <h1 className="text-3xl font-bold mb-12">ログイン</h1>
      <div>
        <div className="mb-6">
          既にアカウントを作成済みの方もそうでない方も、下のボタンから同様にログインできます。
        </div>
        {hasError ? (
          <p className="mb-4 text-sm text-destructive">
            ログインに失敗しました。時間をおいてもう一度お試しください。
          </p>
        ) : null}
        <form action={signInWithDiscord}>
          <Button type="submit" size="lg" className="bg-indigo-500 text-white">
            Discordでログイン
          </Button>
        </form>
      </div>
    </div>
  );
}
