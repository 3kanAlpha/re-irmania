"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type DeleteCompetitionResult = {
  status: "error";
  message: string;
};

export async function deleteCompetition(
  tournamentId: number,
): Promise<DeleteCompetitionResult> {
  if (!Number.isSafeInteger(tournamentId)) {
    return {
      status: "error",
      message: "大会情報を確認できませんでした。",
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
    .select("id,created_by")
    .eq("id", tournamentId)
    .maybeSingle();

  if (tournamentError != null) {
    return {
      status: "error",
      message: "大会情報の取得に失敗しました。",
    };
  }

  if (tournament == null || tournament.created_by !== user.id) {
    return {
      status: "error",
      message: "この大会を削除する権限がありません。",
    };
  }

  const { error: deleteError } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId)
    .eq("created_by", user.id);

  if (deleteError != null) {
    return {
      status: "error",
      message: "大会の削除に失敗しました。",
    };
  }

  revalidatePath("/");
  revalidatePath(`/comp/${tournamentId}`);
  redirect("/");
}
