import { Crown, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

type Tournament = {
  id: number;
  name: string;
  desc: string | null;
  game_title: string;
  song_title: string;
  difficulty: string;
  open_since: string;
  open_until: string;
  asc_order: boolean | null;
};

type ScoreRow = {
  id: number;
  score: number;
  updated_at: string | null;
  created_at: string;
  image_url: string | null;
  comment: string | null;
  users: { nickname: string } | { nickname: string }[] | null;
};

type RankingScore = {
  id: number;
  rank: number;
  nickname: string;
  score: number;
  updatedAt: string;
  imageUrl: string | null;
  comment: string | null;
};

type CompetitionPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: CompetitionPageProps): Promise<Metadata> {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id)) {
    return {
      title: "大会",
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: data?.name ?? "大会",
  };
}

export default async function CompetitionPage({
  params,
}: CompetitionPageProps) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id)) {
    notFound();
  }

  const { tournament, ranking } = await getCompetition(id);

  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-4">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-sky-600 hover:underline dark:text-sky-400"
        >
          大会一覧へ戻る
        </Link>
      </div>

      <section className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-sky-600 px-2.5 py-1 text-xs font-medium text-white">
            {getTournamentStatus(tournament)}
          </div>
          <h1
            id="comp-title"
            className="text-2xl sm:text-3xl font-bold leading-tight break-words"
          >
            {tournament.name}
          </h1>
        </div>

        <div>
          <p
            id="comp-task"
            className="text-xl font-semibold"
          >{`${tournament.song_title} [${tournament.difficulty}]`}</p>
          <p id="comp-duration" className="text-sm">
            スコア登録期間: {formatPeriod(tournament)}
          </p>
        </div>

        {tournament.desc && (
          <div>
            <p className="whitespace-pre-wrap break-words leading-7">
              {tournament.desc}
            </p>
          </div>
        )}

        <section aria-labelledby="ranking-heading" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ranking-heading" className="text-xl font-semibold">
              ランキング
            </h2>
            <p className="text-xs text-muted-foreground">
              {ranking.length}人の参加者
            </p>
          </div>

          {ranking.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">順位</TableHead>
                    <TableHead className="min-w-32">プレイヤー</TableHead>
                    <TableHead>スコア</TableHead>
                    <TableHead>更新日時</TableHead>
                    <TableHead>リザルト</TableHead>
                    <TableHead className="min-w-48">コメント</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((score) => (
                    <TableRow key={score.id}>
                      <TableCell className="text-center font-medium">
                        {score.rank === 1 ? (
                          <div className="flex justify-center">
                            <Crown className="text-amber-500 dark:text-amber-400" />
                          </div>
                        ) : (
                          score.rank
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {score.nickname}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {score.score}
                      </TableCell>
                      <TableCell>{formatDateTime(score.updatedAt)}</TableCell>
                      <TableCell>
                        {score.imageUrl ? (
                          <a
                            href={score.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
                          >
                            画像
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-80 whitespace-normal break-words">
                        {score.comment ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              まだスコアは提出されていません。
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

async function getCompetition(id: number) {
  const supabase = await createClient();
  const tournamentColumns =
    "id,name,desc,game_title,song_title,difficulty,open_since,open_until,asc_order";

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select(tournamentColumns)
    .eq("id", id)
    .maybeSingle();

  if (tournamentError != null) {
    throw new Error(tournamentError.message);
  }

  if (tournament == null) {
    notFound();
  }

  const typedTournament = tournament as Tournament;
  const { data: score, error: scoresError } = await supabase
    .from("score")
    .select("id,score,updated_at,created_at,image_url,comment,users(nickname)")
    .eq("tournament_id", id)
    .order("score", { ascending: typedTournament.asc_order === true })
    .order("updated_at", { ascending: true });

  if (scoresError != null) {
    throw new Error(scoresError.message);
  }

  return {
    tournament: typedTournament,
    ranking: buildRanking((score ?? []) as ScoreRow[]),
  };
}

function buildRanking(scores: ScoreRow[]): RankingScore[] {
  return scores.map((score, index) => ({
    id: score.id,
    rank: index + 1,
    nickname: getNickname(score.users),
    score: score.score,
    updatedAt: score.updated_at ?? score.created_at,
    imageUrl: score.image_url,
    comment: score.comment,
  }));
}

function getNickname(users: ScoreRow["users"]) {
  if (Array.isArray(users)) {
    return users[0]?.nickname ?? "名無し";
  }

  return users?.nickname ?? "名無し";
}

function getTournamentStatus(tournament: Tournament) {
  const now = Date.now();
  const startsAt = new Date(tournament.open_since).getTime();
  const endsAt = new Date(tournament.open_until).getTime();

  if (now < startsAt) {
    return "開催予定";
  }
  if (now > endsAt) {
    return "終了済み";
  }

  return "開催中";
}

function formatPeriod(tournament: Tournament) {
  const start = formatDateTime(tournament.open_since);
  const end = formatDateTime(tournament.open_until);

  return `${start} - ${end}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}
