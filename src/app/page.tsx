import { CalendarPlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";

type Tournament = {
  id: number;
  name: string;
  game_title: string;
  song_title: string;
  difficulty: string;
  open_since: string;
  open_until: string;
};

type TournamentGroups = {
  current: TournamentPage;
  upcoming: TournamentPage;
  finished: TournamentPage;
};

type TournamentKind = keyof TournamentGroups;

type TournamentPage = {
  tournaments: Tournament[];
  currentPage: number;
  totalCount: number;
  totalPages: number;
};

type HomeProps = {
  searchParams?: Promise<{
    currentPage?: string | string[];
    upcomingPage?: string | string[];
    finishedPage?: string | string[];
  }>;
};

const TOURNAMENTS_PER_PAGE = 10;

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const pages = {
    current: parsePage(params?.currentPage),
    upcoming: parsePage(params?.upcomingPage),
    finished: parsePage(params?.finishedPage),
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-3">
      <div>
        <Image
          src="/images/logo.png"
          alt="IRmania logo by Sachi"
          width={385}
          height={85}
          priority={true}
          className="w-75"
        />
      </div>
      <div className="mt-6">
        <p className="mb-2">
          色々な音ゲーでカジュアルに大会を開くためのプラットフォーム
        </p>
        <a
          href="https://github.com/3kanAlpha/re-irmania"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">
            <GitHubInvertocatIcon /> GitHub
          </Button>
        </a>
      </div>
      <Suspense fallback={<AuthGuideSkeleton />}>
        <AuthGuide />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<TournamentSectionSkeleton />}>
          <TournamentSection pages={pages} />
        </Suspense>
      </div>
    </div>
  );
}

async function AuthGuide() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = user != null;

  return (
    <div className="mt-6">
      <div className="pl-4">
        {isLoggedIn ? (
          <p className="text-sm">
            スコア登録のやり方:
            <br />
            1. ログインページからログインする。
            <br />
            2.{" "}
            <Link
              href="/dashboard"
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              アカウント設定ページ
            </Link>
            から名前を登録する。
            <br />
            3. 各大会のページからスコアを登録する。
          </p>
        ) : (
          <p className="text-sm">
            スコア登録のやり方:
            <br />
            1.{" "}
            <Link
              href="/auth/sign-in"
              className="text-sky-600 dark:text-sky-400 hover:underline"
            >
              ログインページ
            </Link>
            からログインする。
            <br />
            2. アカウント設定ページから名前を登録する。
            <br />
            3. 各大会のページからスコアを登録する。
          </p>
        )}
      </div>
      <div className="mt-6 flex justify-center">
        <Button asChild size="xl" className="w-full sm:w-auto">
          <Link href="/new">
            <CalendarPlusIcon />
            大会を作成
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AuthGuideSkeleton() {
  return (
    <>
      <div className="mt-6 pl-4">
        <Skeleton className="h-20" />
      </div>
      <div className="mt-6 flex justify-center">
        <Skeleton className="h-5 w-24" />
      </div>
    </>
  );
}

async function TournamentSection({
  pages,
}: {
  pages: Record<TournamentKind, number>;
}) {
  const groups = await getTournamentGroups(pages);

  return (
    <section aria-labelledby="tournaments-heading" className="space-y-6">
      <div>
        <h2 id="tournaments-heading" className="text-xl font-semibold">
          大会を探す
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          現在参加できる大会を中心に表示しています。
        </p>
      </div>

      <TournamentGroup
        emptyText="現在開催中の大会はありません。"
        kind="current"
        page={groups.current}
        searchPages={pages}
        title="開催中の大会"
      />
      <TournamentGroup
        emptyText="開催予定の大会はありません。"
        kind="upcoming"
        page={groups.upcoming}
        searchPages={pages}
        title="開催予定の大会"
      />
      <TournamentGroup
        emptyText="終了済みの大会はありません。"
        kind="finished"
        page={groups.finished}
        searchPages={pages}
        title="終了済みの大会"
      />
    </section>
  );
}

async function getTournamentGroups(
  pages: Record<TournamentKind, number>,
): Promise<TournamentGroups> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const tournamentColumns =
    "id,name,desc,game_title,song_title,difficulty,open_since,open_until";

  const [current, upcoming, finished] = await Promise.all([
    supabase
      .from("tournaments")
      .select(tournamentColumns, { count: "exact" })
      .lte("open_since", now)
      .gte("open_until", now)
      .order("open_until", { ascending: true })
      .range(getPageStart(pages.current), getPageEnd(pages.current)),
    supabase
      .from("tournaments")
      .select(tournamentColumns, { count: "exact" })
      .gt("open_since", now)
      .order("open_since", { ascending: true })
      .range(getPageStart(pages.upcoming), getPageEnd(pages.upcoming)),
    supabase
      .from("tournaments")
      .select(tournamentColumns, { count: "exact" })
      .lt("open_until", now)
      .order("id", { ascending: false })
      .range(getPageStart(pages.finished), getPageEnd(pages.finished)),
  ]);

  if (current.error != null) {
    throw new Error(current.error.message);
  }
  if (upcoming.error != null) {
    throw new Error(upcoming.error.message);
  }
  if (finished.error != null) {
    throw new Error(finished.error.message);
  }

  return {
    current: createTournamentPage(current.data, current.count, pages.current),
    upcoming: createTournamentPage(
      upcoming.data,
      upcoming.count,
      pages.upcoming,
    ),
    finished: createTournamentPage(
      finished.data,
      finished.count,
      pages.finished,
    ),
  };
}

function TournamentGroup({
  emptyText,
  kind,
  page,
  searchPages,
  title,
}: {
  emptyText: string;
  kind: TournamentKind;
  page: TournamentPage;
  searchPages: Record<TournamentKind, number>;
  title: string;
}) {
  const isCurrent = kind === "current";
  const { currentPage, totalCount, totalPages, tournaments } = page;

  return (
    <section
      aria-labelledby={`${kind}-tournaments-heading`}
      className={isCurrent ? "space-y-3" : "space-y-2"}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          id={`${kind}-tournaments-heading`}
          className={
            isCurrent ? "text-lg font-semibold" : "text-base font-medium"
          }
        >
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">{totalCount}件</span>
      </div>
      {tournaments.length > 0 ? (
        <div className={isCurrent ? "space-y-3" : "grid gap-2"}>
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              kind={kind}
              tournament={tournament}
            />
          ))}
        </div>
      ) : (
        <p
          className={
            isCurrent
              ? "rounded-lg border border-dashed border-border bg-muted/40 px-4 py-5 text-center text-sm text-muted-foreground"
              : "text-sm text-muted-foreground"
          }
        >
          {emptyText}
        </p>
      )}
      {totalPages > 1 ? (
        <TournamentPagination
          currentPage={currentPage}
          kind={kind}
          searchPages={searchPages}
          totalPages={totalPages}
        />
      ) : null}
    </section>
  );
}

function TournamentCard({
  kind,
  tournament,
}: {
  kind: "current" | "upcoming" | "finished";
  tournament: Tournament;
}) {
  const detailHref = `/comp/${tournament.id}`;

  if (kind === "current") {
    return (
      <Link
        href={detailHref}
        className="block rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <article className="rounded-lg border border-sky-500/30 bg-sky-50/80 p-4 shadow-sm shadow-sky-900/5 transition-colors hover:border-sky-600/50 hover:bg-sky-100/80 dark:bg-sky-900/25 dark:hover:bg-sky-900/35">
          <div className="flex items-start justify-between">
            <div className="mb-2 inline-flex rounded-full bg-sky-600 px-2.5 py-1 text-xs font-medium text-white">
              開催中
            </div>
            <div className="text-right text-sm font-medium text-sky-900 dark:text-sky-100">
              {formatEndLabel(tournament.open_until)}
            </div>
          </div>
          <h4 className="text-2xl font-semibold leading-tight break-words">
            {tournament.name}
          </h4>
          <div className="mt-4 min-w-0 rounded-lg bg-background/80 px-4 py-3 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">課題曲</p>
            <p className="mt-1 text-xl font-semibold leading-tight break-words">
              {tournament.song_title} [{tournament.difficulty}]
            </p>
          </div>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <TournamentDetail
              label="ゲームタイトル"
              value={tournament.game_title}
            />
            <TournamentDetail label="期間" value={formatPeriod(tournament)} />
          </dl>
        </article>
      </Link>
    );
  }

  const showSong = kind === "finished";

  return (
    <Link
      href={detailHref}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <article className="rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/50">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="text-lg font-medium leading-tight">
              {tournament.name}
            </h4>
            <p className="mt-1 text-muted-foreground">
              {tournament.game_title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {kind === "upcoming"
              ? formatPeriod(tournament)
              : formatEndLabel(tournament.open_until)}
          </p>
        </div>
        {showSong ? (
          <p className="mt-2 text-muted-foreground">
            {tournament.song_title} [{tournament.difficulty}]
          </p>
        ) : null}
      </article>
    </Link>
  );
}

function TournamentDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/70 px-3 py-2 ring-1 ring-foreground/10">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function TournamentSectionSkeleton() {
  return (
    <section className="space-y-5" aria-label="大会を読み込み中">
      <div>
        <Skeleton className="h-7 w-14" />
        <Skeleton className="mt-2 h-4 w-60 max-w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-44 rounded-lg border border-border" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-20 rounded-lg border border-border" />
      </div>
    </section>
  );
}

function TournamentPagination({
  currentPage,
  kind,
  searchPages,
  totalPages,
}: {
  currentPage: number;
  kind: TournamentKind;
  searchPages: Record<TournamentKind, number>;
  totalPages: number;
}) {
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <Pagination className="pt-1">
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={currentPage <= 1}
            className={
              currentPage <= 1 ? "pointer-events-none opacity-50" : undefined
            }
            href={getTournamentPageHref(kind, currentPage - 1, searchPages)}
            text="前へ"
          />
        </PaginationItem>
        {pages.map((page) =>
          typeof page === "string" ? (
            <PaginationItem key={`${kind}-${page}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={getTournamentPageHref(kind, page, searchPages)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            aria-disabled={currentPage >= totalPages}
            className={
              currentPage >= totalPages
                ? "pointer-events-none opacity-50"
                : undefined
            }
            href={getTournamentPageHref(kind, currentPage + 1, searchPages)}
            text="次へ"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function parsePage(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue ?? "", 10);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return page;
}

function getPageStart(page: number) {
  return (page - 1) * TOURNAMENTS_PER_PAGE;
}

function getPageEnd(page: number) {
  return getPageStart(page) + TOURNAMENTS_PER_PAGE - 1;
}

function createTournamentPage(
  data: unknown[] | null,
  count: number | null,
  currentPage: number,
): TournamentPage {
  const totalCount = count ?? 0;

  return {
    currentPage,
    totalCount,
    totalPages: Math.ceil(totalCount / TOURNAMENTS_PER_PAGE),
    tournaments: (data ?? []) as Tournament[],
  };
}

function getTournamentPageHref(
  kind: TournamentKind,
  page: number,
  searchPages: Record<TournamentKind, number>,
) {
  const params = new URLSearchParams();
  const nextPages = {
    ...searchPages,
    [kind]: Math.max(page, 1),
  };

  for (const tournamentKind of Object.keys(nextPages) as TournamentKind[]) {
    const nextPage = nextPages[tournamentKind];

    if (nextPage > 1) {
      params.set(getTournamentPageParam(tournamentKind), String(nextPage));
    }
  }

  const query = params.toString();

  return `/${query ? `?${query}` : ""}#${kind}-tournaments-heading`;
}

function getTournamentPageParam(kind: TournamentKind) {
  return `${kind}Page`;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "start-ellipsis" | "end-ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("start-ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("end-ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

function formatPeriod(tournament: Tournament) {
  const start = formatDateTime(tournament.open_since);
  const end = formatDateTime(tournament.open_until);

  return `${start} - ${end}`;
}

function formatEndLabel(openUntil: string) {
  return `${formatDateTime(openUntil)} 終了`;
}

function GitHubInvertocatIcon() {
  return (
    <svg
      width="98"
      height="96"
      viewBox="0 0 98 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>GitHub Invertocat</title>
      <g clipPath="url(#clip0_730_27126)">
        <path
          d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_730_27126">
          <rect width="98" height="96" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
