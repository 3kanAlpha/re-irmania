import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { NicknameForm } from "./_components/nickname-form";
import { signOut } from "./_lib/actions";

export const metadata: Metadata = {
  title: "ダッシュボード",
  description: "アカウントの設定などを変更できます。",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nickname")
    .eq("user_uid", user.id)
    .maybeSingle();

  return (
    <div className="w-full max-w-xl mx-auto py-6 px-3 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">ダッシュボード</h1>
      <p className="text-muted-foreground mb-6">
        {profile?.nickname}としてログイン中
      </p>
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>アカウント設定</CardTitle>
          <CardDescription>
            ランキング上に表示される名前を変更できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <NicknameForm nickname={profile?.nickname ?? ""} />

          <form action={signOut}>
            <Button type="submit" variant="outline">
              <LogOut />
              ログアウト
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
