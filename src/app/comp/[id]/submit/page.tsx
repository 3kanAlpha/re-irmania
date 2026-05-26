import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";
import { SubmitScoreForm } from "./_components/submit-score-form";

const DEFAULT_PLAYER_NAME = "No Name";

type Tournament = {
  id: number;
  name: string;
  song_title: string;
  difficulty: string;
  open_since: string;
  open_until: string;
  passwd: string | null;
};

type SubmitPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: SubmitPageProps): Promise<Metadata> {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id)) {
    return {
      title: "スコア提出",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: data?.name ? `${data.name} - スコア提出` : "スコア提出",
  };
}

export default async function SubmitPage({ params }: SubmitPageProps) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id,name,song_title,difficulty,open_since,open_until,passwd")
    .eq("id", id)
    .maybeSingle();

  if (tournamentError != null) {
    throw new Error(tournamentError.message);
  }

  if (tournament == null) {
    notFound();
  }

  const typedTournament = tournament as Tournament;
  if (!isTournamentOpen(typedTournament)) {
    redirect(`/comp/${id}`);
  }

  const [{ count, error: scoreCountError }, { data: profile }] =
    await Promise.all([
      supabase
        .from("score")
        .select("id", { count: "exact", head: true })
        .eq("user_uid", user.id)
        .eq("tournament_id", id),
      supabase
        .from("users")
        .select("nickname")
        .eq("user_uid", user.id)
        .maybeSingle(),
    ]);

  if (scoreCountError != null) {
    throw new Error(scoreCountError.message);
  }

  const isPrivate = Boolean(typedTournament.passwd);
  const hasScore = Boolean(count && count > 0);
  const nickname = profile?.nickname ?? DEFAULT_PLAYER_NAME;

  return (
    <main className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-4">
      <section className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
            スコア受付中
          </div>
          <h1 className="text-2xl font-bold leading-tight break-words sm:text-3xl">
            {typedTournament.name}
          </h1>
          <div>
            <p className="text-lg font-semibold">
              {typedTournament.song_title} [{typedTournament.difficulty}]
            </p>
            <p className="text-sm text-muted-foreground">
              スコア登録期間: {formatPeriod(typedTournament)}
            </p>
          </div>
        </div>

        {nickname === DEFAULT_PLAYER_NAME ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            プレイヤー名が未設定です。必要に応じてダッシュボードから変更してください。
          </p>
        ) : null}

        {isPrivate && !hasScore ? (
          <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
            この大会はプライベート大会です。初回提出にはパスワードが必要です。
          </p>
        ) : null}

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>スコア提出</CardTitle>
            <CardDescription>
              既に提出済みのスコアがある場合は、最後に提出した内容で更新されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmitScoreForm
              tournamentId={typedTournament.id}
              isPrivate={isPrivate}
              hasScore={hasScore}
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function isTournamentOpen(tournament: Tournament) {
  const now = Date.now();
  const startsAt = new Date(tournament.open_since).getTime();
  const endsAt = new Date(tournament.open_until).getTime();

  return now >= startsAt && now <= endsAt;
}

function formatPeriod(tournament: Tournament) {
  const start = formatDateTime(tournament.open_since);
  const end = formatDateTime(tournament.open_until);

  return `${start} - ${end}`;
}
