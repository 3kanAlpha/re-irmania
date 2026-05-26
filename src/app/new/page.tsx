import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CreateCompetitionForm } from "./_components/create-competition-form";

export const metadata: Metadata = {
  title: "新しく大会を作る",
  description: "IRmaniaの大会を新規作成できます。",
};

export default async function NewCompetitionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-4">
      <section className="space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            新しく大会を作る
          </h1>
          <p className="text-sm text-muted-foreground">
            必要な情報を入力してください。
          </p>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>大会設定</CardTitle>
            <CardDescription>
              タイトル、課題曲、開催期間、順位付けの条件を設定できます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateCompetitionForm />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
