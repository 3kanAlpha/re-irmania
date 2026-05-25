"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_NICKNAME_LENGTH = 12;

export type NicknameFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    nickname?: string[];
  };
};

export async function updateNickname(
  _prevState: NicknameFormState,
  formData: FormData,
): Promise<NicknameFormState> {
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (nickname.length === 0) {
    return {
      status: "error",
      message: "ニックネームを入力してください。",
      errors: {
        nickname: ["ニックネームを入力してください。"],
      },
    };
  }

  if (Array.from(nickname).length > MAX_NICKNAME_LENGTH) {
    return {
      status: "error",
      message: `ニックネームは${MAX_NICKNAME_LENGTH}文字以内で入力してください。`,
      errors: {
        nickname: [`${MAX_NICKNAME_LENGTH}文字以内で入力してください。`],
      },
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
    .from("users")
    .update({ nickname })
    .eq("user_uid", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      message: "ニックネームの更新に失敗しました。",
    };
  }

  if (!data) {
    return {
      status: "error",
      message: "ユーザー情報が見つかりませんでした。",
    };
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "ニックネームを更新しました。",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
