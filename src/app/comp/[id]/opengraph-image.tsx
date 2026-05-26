import { ImageResponse } from "next/og";
import { formatDateTime } from "@/lib/date-utils";
import { createClient } from "@/lib/supabase/server";

type Tournament = {
  name: string;
  desc: string | null;
  game_title: string;
  song_title: string;
  difficulty: string;
  open_since: string;
  open_until: string;
};

type OpenGraphImageProps = {
  params: Promise<{ id: string }>;
};

export const alt = "IRmania 大会";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: OpenGraphImageProps) {
  const id = Number((await params).id);
  const tournament = Number.isSafeInteger(id) ? await getTournament(id) : null;

  if (tournament == null) {
    return createImage({
      title: "大会が見つかりません",
      task: "IRmania",
      period: "",
      description: "指定された大会情報を表示できませんでした。",
    });
  }

  return createImage({
    title: tournament.name,
    task: `${tournament.song_title} [${tournament.difficulty}]`,
    period: `スコア登録期間: ${formatPeriod(tournament)}`,
    description: tournament.desc?.trim(),
    gameTitle: tournament.game_title,
  });
}

async function getTournament(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tournaments")
    .select("name,desc,game_title,song_title,difficulty,open_since,open_until")
    .eq("id", id)
    .maybeSingle();

  if (error != null) {
    throw new Error(error.message);
  }

  return data as Tournament | null;
}

function createImage({
  title,
  task,
  period,
  description,
  gameTitle,
}: {
  title: string;
  task: string;
  period: string;
  description?: string;
  gameTitle?: string;
}) {
  const displayTitle = truncateText(title, 52);
  const displayTask = truncateText(task, 58);
  const displayDescription =
    description == null || description === ""
      ? null
      : truncateText(description, 185);

  return new ImageResponse(
    <div
      lang="ja-JP"
      style={{
        width: "100%",
        height: "100%",
        background: "#f8fafc",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
        padding: "58px 68px",
        position: "relative",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(2, 132, 199, 0.16), rgba(16, 185, 129, 0.12))",
          bottom: 0,
          display: "flex",
          height: "100%",
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
          width: "100%",
        }}
      />
      <div
        style={{
          border: "1px solid rgba(14, 165, 233, 0.26)",
          background: "rgba(255, 255, 255, 0.82)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent:
            displayDescription == null ? "flex-start" : "space-between",
          padding: "42px 48px",
          position: "relative",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "#0284c7",
                color: "white",
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                padding: "10px 18px",
              }}
            >
              IRmania
            </div>
            {gameTitle != null && (
              <div
                style={{
                  color: "#0369a1",
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {truncateText(gameTitle, 34)}
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                color: "#0f172a",
                display: "flex",
                fontSize: getTitleFontSize(displayTitle),
                fontWeight: 800,
                lineHeight: 1.18,
                maxHeight: 142,
                overflow: "hidden",
              }}
            >
              {displayTitle}
            </div>
            <div
              style={{
                borderLeft: "8px solid #10b981",
                color: "#134e4a",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingLeft: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 800,
                  lineHeight: 1.25,
                }}
              >
                {displayTask}
              </div>
              {period !== "" && (
                <div
                  style={{
                    color: "#475569",
                    display: "flex",
                    fontSize: 25,
                    fontWeight: 600,
                  }}
                >
                  {period}
                </div>
              )}
            </div>
          </div>
        </div>

        {displayDescription != null && (
          <div
            style={{
              background: "#e0f2fe",
              color: "#0f172a",
              display: "flex",
              fontSize: 27,
              lineHeight: 1.5,
              maxHeight: 132,
              overflow: "hidden",
              padding: "20px 24px",
              whiteSpace: "pre-wrap",
            }}
          >
            {displayDescription}
          </div>
        )}
      </div>
    </div>,
    size,
  );
}

function getTitleFontSize(value: string) {
  if (value.length > 40) {
    return 46;
  }
  if (value.length > 28) {
    return 54;
  }

  return 64;
}

function truncateText(value: string, maxLength: number) {
  const normalized = value.replace(/\r\n/g, "\n").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

function formatPeriod(tournament: Tournament) {
  const start = formatDateTime(tournament.open_since);
  const end = formatDateTime(tournament.open_until);

  return `${start} - ${end}`;
}
