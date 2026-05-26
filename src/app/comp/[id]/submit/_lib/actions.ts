"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const COMMENT_MAX_LENGTH = 25;
const PASSWORD_MAX_LENGTH = 50;
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024;
const PUBLIC_IMAGE_DOMAIN = "https://irpics.mgcup.net/";

type Tournament = {
  id: number;
  open_since: string;
  open_until: string;
  passwd: string | null;
};

type ExistingScore = {
  image_url: string | null;
};

export type SubmitScoreFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    score?: string[];
    resultImage?: string[];
    resultImageUrl?: string[];
    comment?: string[];
    password?: string[];
  };
};

export async function submitScore(
  _prevState: SubmitScoreFormState,
  formData: FormData,
): Promise<SubmitScoreFormState> {
  const tournamentId = Number(formData.get("tournamentId"));
  const scoreText = String(formData.get("score") ?? "").trim();
  const useExternalImage = formData.get("useExternalImage") === "on";
  const imageUrl = String(formData.get("resultImageUrl") ?? "").trim();
  const resultImage = formData.get("resultImage");
  const comment = String(formData.get("comment") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const errors: NonNullable<SubmitScoreFormState["errors"]> = {};

  if (!Number.isSafeInteger(tournamentId)) {
    return {
      status: "error",
      message: "大会情報を確認できませんでした。",
    };
  }

  const parsedScore = Number.parseFloat(scoreText);
  if (scoreText.length === 0 || !Number.isFinite(parsedScore)) {
    errors.score = ["有効な数値を入力してください。"];
  }

  if (Array.from(comment).length > COMMENT_MAX_LENGTH) {
    errors.comment = [
      `コメントは${COMMENT_MAX_LENGTH}文字以内で入力してください。`,
    ];
  }

  if (useExternalImage && imageUrl.length > 0 && !isValidHttpUrl(imageUrl)) {
    errors.resultImageUrl = ["有効なURLを入力してください。"];
  }

  const imageFile =
    resultImage instanceof File && resultImage.size > 0 ? resultImage : null;

  if (!useExternalImage && imageFile != null) {
    if (!imageFile.type.startsWith("image/")) {
      errors.resultImage = ["画像ファイルを選択してください。"];
    }

    if (imageFile.size > IMAGE_SIZE_LIMIT) {
      errors.resultImage = [
        `画像ファイルのサイズは${IMAGE_SIZE_LIMIT / 1024 / 1024}MB以下にしてください。`,
      ];
    }
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = [
      `パスワードは${PASSWORD_MAX_LENGTH}文字以内で入力してください。`,
    ];
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "入力内容を確認してください。",
      errors,
    };
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
    .select("id,open_since,open_until,passwd")
    .eq("id", tournamentId)
    .maybeSingle();

  if (tournamentError != null) {
    return {
      status: "error",
      message: "大会情報の取得に失敗しました。",
    };
  }

  if (tournament == null) {
    return {
      status: "error",
      message: "大会が見つかりませんでした。",
    };
  }

  const typedTournament = tournament as Tournament;
  if (!isTournamentOpen(typedTournament)) {
    redirect(`/comp/${tournamentId}`);
  }

  const { data: existingScore, error: existingScoreError } = await supabase
    .from("score")
    .select("image_url")
    .eq("user_uid", user.id)
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  if (existingScoreError != null) {
    return {
      status: "error",
      message: "提出済みスコアの確認に失敗しました。",
    };
  }

  const typedExistingScore = existingScore as ExistingScore | null;
  const hasScore = typedExistingScore != null;
  const isPrivate = Boolean(typedTournament.passwd);

  if (isPrivate && !hasScore) {
    if (password.length === 0) {
      return {
        status: "error",
        message: "パスワードを入力してください。",
        errors: {
          password: ["パスワードを入力してください。"],
        },
      };
    }

    const digest = await sha256Hex(password);
    if (digest !== typedTournament.passwd) {
      return {
        status: "error",
        message: "パスワードが一致しません。",
        errors: {
          password: ["パスワードが一致しません。"],
        },
      };
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";

  const deleteResult = await deleteOldImageIfExists(
    typedExistingScore?.image_url ?? null,
    accessToken,
  );

  if (!deleteResult.ok) {
    return {
      status: "error",
      message: deleteResult.message,
    };
  }

  let nextImageUrl = useExternalImage ? imageUrl : "";

  if (!useExternalImage && imageFile != null) {
    const uploadResult = await uploadResultImage({
      file: imageFile,
      userId: user.id,
      tournamentId,
      accessToken,
    });

    if (!uploadResult.ok) {
      return {
        status: "error",
        message: uploadResult.message,
        errors: {
          resultImage: [uploadResult.message],
        },
      };
    }

    nextImageUrl = uploadResult.url;
  }

  const { error: upsertError } = await supabase.from("score").upsert(
    {
      user_uid: user.id,
      tournament_id: tournamentId,
      score: parsedScore,
      image_url: nextImageUrl,
      updated_at: new Date().toISOString(),
      comment,
    },
    { onConflict: "user_uid,tournament_id" },
  );

  if (upsertError != null) {
    return {
      status: "error",
      message: "スコアの登録に失敗しました。",
    };
  }

  revalidatePath(`/comp/${tournamentId}`);

  return {
    status: "success",
    message: "スコアを登録しました。",
  };
}

function isTournamentOpen(tournament: Tournament) {
  const now = Date.now();
  const startsAt = new Date(tournament.open_since).getTime();
  const endsAt = new Date(tournament.open_until).getTime();

  return now >= startsAt && now <= endsAt;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function deleteOldImageIfExists(
  imageUrl: string | null,
  accessToken: string,
) {
  if (imageUrl == null || !imageUrl.startsWith(PUBLIC_IMAGE_DOMAIN)) {
    return { ok: true as const };
  }

  if (accessToken.length === 0) {
    return {
      ok: false as const,
      message: "画像削除の認証情報を取得できませんでした。",
    };
  }

  const imageUploaderUrlBase = process.env.IMAGE_UPLOADER_URL_BASE;
  if (!imageUploaderUrlBase) {
    return {
      ok: false as const,
      message: "画像アップロード先が設定されていません。",
    };
  }

  // biome-ignore lint/style/useTemplate: Match the requested imageUploaderEndpoint expression.
  const imageUploaderEndpoint = imageUploaderUrlBase + "/api/image";
  const response = await fetch(imageUploaderEndpoint, {
    method: "DELETE",
    body: JSON.stringify({
      fileKey: imageUrl.replace(PUBLIC_IMAGE_DOMAIN, ""),
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return {
      ok: false as const,
      message: "以前のリザルト画像の削除に失敗しました。",
    };
  }

  return { ok: true as const };
}

async function uploadResultImage({
  file,
  userId,
  tournamentId,
  accessToken,
}: {
  file: File;
  userId: string;
  tournamentId: number;
  accessToken: string;
}) {
  if (accessToken.length === 0) {
    return {
      ok: false as const,
      message: "画像アップロードの認証情報を取得できませんでした。",
    };
  }

  const imageUploaderUrlBase = process.env.IMAGE_UPLOADER_URL_BASE;
  if (!imageUploaderUrlBase) {
    return {
      ok: false as const,
      message: "画像アップロード先が設定されていません。",
    };
  }

  // biome-ignore lint/style/useTemplate: Match the requested imageUploaderEndpoint expression.
  const imageUploaderEndpoint = imageUploaderUrlBase + "/api/image";
  const uploadFormData = new FormData();
  uploadFormData.append("file", file);
  uploadFormData.append("uuid", userId);
  uploadFormData.append("compId", tournamentId.toString());

  const response = await fetch(imageUploaderEndpoint, {
    method: "POST",
    body: uploadFormData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return {
      ok: false as const,
      message: "リザルト画像のアップロードに失敗しました。",
    };
  }

  const url = (await response.text()).trim();
  if (url.length === 0) {
    return {
      ok: false as const,
      message: "リザルト画像のアップロードに失敗しました。",
    };
  }

  return {
    ok: true as const,
    url,
  };
}
