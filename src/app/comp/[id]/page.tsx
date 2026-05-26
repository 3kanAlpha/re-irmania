import { Crown, ExternalLink, Lock } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  alt_rank: boolean | null;
  hide_score_hr: number;
};

type ScoreRow = {
  id: number;
  user_uid: string;
  score: number;
  updated_at: string | null;
  created_at: string;
  image_url: string | null;
  comment: string | null;
  users: { nickname: string } | { nickname: string }[] | null;
};

type RankingScore = {
  id: number;
  userUid: string;
  rank: number | null;
  nickname: string;
  score: number;
  updatedAt: string;
  imageUrl: string | null;
  comment: string | null;
  isCurrentUser: boolean;
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

  const description = `「${data?.name}」の順位表ページです`;

  return {
    title: data?.name ?? "大会",
    description,
    openGraph: {
      title: `${data?.name} | IRmania`,
      description,
      url: `/comp/${id}`,
      siteName: "IRmania",
      locale: "ja_JP",
      type: "website",
    },
  };
}

export default async function CompetitionPage({
  params,
}: CompetitionPageProps) {
  const id = Number((await params).id);

  if (!Number.isSafeInteger(id)) {
    notFound();
  }

  const { tournament, ranking, participantCount, isScoreHidden } =
    await getCompetition(id);

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
              {participantCount}人の参加者
            </p>
          </div>
          {isScoreHidden && (
            <p className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <Lock className="size-4 shrink-0" />
              大会終了直前のため、他プレイヤーのスコアは閲覧できません。
            </p>
          )}

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
                    <TableRow
                      key={score.id}
                      className={cn(
                        score.isCurrentUser &&
                          "bg-sky-50/80 hover:bg-sky-50 dark:bg-sky-950/40 dark:hover:bg-sky-950/50",
                      )}
                    >
                      <TableCell className="text-center font-medium">
                        {score.rank == null ? (
                          "?"
                        ) : score.rank === 1 ? (
                          <div className="flex justify-center">
                            <Crown className="text-amber-500 dark:text-amber-400" />
                          </div>
                        ) : (
                          score.rank
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          score.isCurrentUser &&
                            "text-sky-700 dark:text-sky-300",
                        )}
                      >
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
              {isScoreHidden
                ? "表示できるスコアはありません。"
                : "まだスコアは提出されていません。"}
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
    "id,name,desc,game_title,song_title,difficulty,open_since,open_until,asc_order,alt_rank,hide_score_hr";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;
  const isScoreHidden = shouldHideScore(typedTournament);

  const { count: participantCount, error: countError } = await supabase
    .from("score")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", id);

  if (countError != null) {
    throw new Error(countError.message);
  }

  if (isScoreHidden && currentUserId == null) {
    return {
      tournament: typedTournament,
      ranking: [],
      participantCount: participantCount ?? 0,
      isScoreHidden,
    };
  }

  let scoresQuery = supabase
    .from("score")
    .select(
      "id,user_uid,score,updated_at,created_at,image_url,comment,users(nickname)",
    )
    .eq("tournament_id", id);

  if (isScoreHidden) {
    scoresQuery = scoresQuery.eq("user_uid", currentUserId);
  }

  const { data: score, error: scoresError } = await scoresQuery
    .order("score", { ascending: typedTournament.asc_order === true })
    .order("updated_at", { ascending: true });

  if (scoresError != null) {
    throw new Error(scoresError.message);
  }

  return {
    tournament: typedTournament,
    ranking: buildRanking((score ?? []) as ScoreRow[], {
      currentUserId,
      hideRank: isScoreHidden,
      useAltRank: typedTournament.alt_rank === true,
    }),
    participantCount: participantCount ?? score?.length ?? 0,
    isScoreHidden,
  };
}

function buildRanking(
  scores: ScoreRow[],
  options: {
    currentUserId: string | null;
    hideRank: boolean;
    useAltRank: boolean;
  },
): RankingScore[] {
  let previousScore: number | null = null;
  let previousRank = 0;

  return scores.map((score, index) => {
    const rank =
      options.useAltRank && previousScore === score.score
        ? previousRank
        : index + 1;

    previousScore = score.score;
    previousRank = rank;

    return {
      id: score.id,
      userUid: score.user_uid,
      rank: options.hideRank ? null : rank,
      nickname: getNickname(score.users),
      score: score.score,
      updatedAt: score.updated_at ?? score.created_at,
      imageUrl: score.image_url,
      comment: score.comment,
      isCurrentUser: options.currentUserId === score.user_uid,
    };
  });
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

function shouldHideScore(tournament: Tournament) {
  if (tournament.hide_score_hr <= 0) {
    return false;
  }

  const now = Date.now();
  const endsAt = new Date(tournament.open_until).getTime();
  const startsHidingAt = endsAt - tournament.hide_score_hr * 60 * 60 * 1000;

  return now >= startsHidingAt && now <= endsAt;
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
