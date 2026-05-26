"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAME_MAX_LENGTH = 25;
const DESCRIPTION_MAX_LENGTH = 140;
const HIDE_SCORE_HOUR_MAX = 32767;

export type CreateCompetitionFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  competitionId?: number;
  errors?: {
    name?: string[];
    desc?: string[];
    gameTitle?: string[];
    songTitle?: string[];
    difficulty?: string[];
    openUntil?: string[];
    openSince?: string[];
    hideScoreHr?: string[];
  };
};

export async function createCompetition(
  _prevState: CreateCompetitionFormState,
  formData: FormData,
): Promise<CreateCompetitionFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const desc = String(formData.get("desc") ?? "").trim();
  const gameTitle = String(formData.get("gameTitle") ?? "").trim();
  const songTitle = String(formData.get("songTitle") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "").trim();
  const openUntilValue = String(formData.get("openUntil") ?? "").trim();
  const useManualOpenSince = formData.get("useManualOpenSince") === "on";
  const openSinceValue = String(formData.get("openSince") ?? "").trim();
  const ascOrder = formData.get("ascOrder") === "on";
  const altRank = formData.get("altRank") === "on";
  const hideScoreHrText = String(formData.get("hideScoreHr") ?? "0").trim();

  const errors: NonNullable<CreateCompetitionFormState["errors"]> = {};

  if (name.length === 0) {
    errors.name = ["大会のタイトルを入力してください。"];
  } else if (Array.from(name).length > NAME_MAX_LENGTH) {
    errors.name = [`${NAME_MAX_LENGTH}文字以内で入力してください。`];
  }

  if (Array.from(desc).length > DESCRIPTION_MAX_LENGTH) {
    errors.desc = [`${DESCRIPTION_MAX_LENGTH}文字以内で入力してください。`];
  }

  if (gameTitle.length === 0) {
    errors.gameTitle = ["ゲームタイトルを入力してください。"];
  }

  if (songTitle.length === 0) {
    errors.songTitle = ["楽曲名を入力してください。"];
  }

  if (difficulty.length === 0) {
    errors.difficulty = ["譜面難易度を入力してください。"];
  }

  const openUntil = parseJstDateTimeLocal(openUntilValue);
  if (openUntil == null) {
    errors.openUntil = ["有効な日時を分単位で入力してください。"];
  } else if (openUntil.getTime() <= Date.now()) {
    errors.openUntil = ["過去の日時は指定できません。"];
  }

  const openSince = useManualOpenSince
    ? parseJstDateTimeLocal(openSinceValue)
    : new Date();

  if (useManualOpenSince && openSince == null) {
    errors.openSince = ["有効な日時を分単位で入力してください。"];
  } else if (
    useManualOpenSince &&
    openSince != null &&
    openSince.getTime() <= Date.now()
  ) {
    errors.openSince = ["過去の日時は指定できません。"];
  }

  if (
    openUntil != null &&
    openSince != null &&
    openSince.getTime() >= openUntil.getTime()
  ) {
    errors.openSince = ["開始日時は登録期限より前に設定してください。"];
  }

  const hideScoreHr = Number.parseInt(hideScoreHrText, 10);
  if (
    hideScoreHrText.length === 0 ||
    !Number.isInteger(hideScoreHr) ||
    hideScoreHr < 0 ||
    hideScoreHr > HIDE_SCORE_HOUR_MAX
  ) {
    errors.hideScoreHr = [
      `0から${HIDE_SCORE_HOUR_MAX}までの整数を入力してください。`,
    ];
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
      errors,
    };
  }

  if (openUntil == null || openSince == null) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name,
      desc,
      game_title: gameTitle,
      song_title: songTitle,
      difficulty,
      open_until: openUntil.toISOString(),
      open_since: openSince.toISOString(),
      created_by: user.id,
      asc_order: ascOrder,
      score_visible: true,
      extra_params: {},
      alt_rank: altRank,
      hide_score_hr: hideScoreHr,
    })
    .select("id")
    .single();

  if (error != null) {
    return {
      status: "error",
      message: "大会の作成に失敗しました。",
    };
  }

  revalidatePath("/");

  return {
    status: "success",
    message: "大会を作成しました。",
    competitionId: data.id as number,
  };
}

function parseJstDateTimeLocal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}:00+09:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
