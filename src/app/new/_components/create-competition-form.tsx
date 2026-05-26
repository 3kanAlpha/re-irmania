"use client";

import { CalendarClock, Check, EyeOff, ListOrdered, Plus } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type CreateCompetitionFormState,
  createCompetition,
} from "../_lib/actions";

const NAME_MAX_LENGTH = 25;
const DESCRIPTION_MAX_LENGTH = 140;
const GAME_TITLE_SUGGESTIONS = [
  "beatmania IIDX",
  "SOUND VOLTEX",
  "pop'n music",
  "DanceDanceRevolution",
  "GITADORA",
  "CHUNITHM",
  "オンゲキ",
  "maimai でらっくす",
  "太鼓の達人",
];

const initialState: CreateCompetitionFormState = {
  status: "idle",
};

export function CreateCompetitionForm() {
  const [state, formAction, pending] = useActionState(
    createCompetition,
    initialState,
  );
  const [useManualOpenSince, setUseManualOpenSince] = useState(false);
  const defaultOpenUntil = useMemo(() => getDateTimeLocalAfterDays(7), []);
  const defaultOpenSince = useMemo(() => getDateTimeLocalAfterMinutes(10), []);

  const nameErrors = toFieldErrors(state.errors?.name);
  const descErrors = toFieldErrors(state.errors?.desc);
  const gameTitleErrors = toFieldErrors(state.errors?.gameTitle);
  const songTitleErrors = toFieldErrors(state.errors?.songTitle);
  const difficultyErrors = toFieldErrors(state.errors?.difficulty);
  const openUntilErrors = toFieldErrors(state.errors?.openUntil);
  const openSinceErrors = toFieldErrors(state.errors?.openSince);
  const hideScoreHrErrors = toFieldErrors(state.errors?.hideScoreHr);

  return (
    <form action={formAction} className="space-y-6">
      <FieldSet>
        <FieldLegend>基本設定</FieldLegend>
        <FieldGroup>
          <Field data-invalid={Boolean(nameErrors.length)}>
            <FieldLabel htmlFor="name">大会のタイトル</FieldLabel>
            <Input
              id="name"
              name="name"
              maxLength={NAME_MAX_LENGTH}
              required
              disabled={pending}
              aria-invalid={Boolean(nameErrors.length)}
            />
            <FieldDescription>
              {NAME_MAX_LENGTH}文字以内で入力してください。
            </FieldDescription>
            <FieldError errors={nameErrors} />
          </Field>

          <Field data-invalid={Boolean(descErrors.length)}>
            <FieldLabel htmlFor="desc">大会の説明文</FieldLabel>
            <Textarea
              id="desc"
              name="desc"
              maxLength={DESCRIPTION_MAX_LENGTH}
              disabled={pending}
              aria-invalid={Boolean(descErrors.length)}
              className="min-h-24"
            />
            <FieldDescription>
              {DESCRIPTION_MAX_LENGTH}文字以内で入力してください。（任意）
            </FieldDescription>
            <FieldError errors={descErrors} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field data-invalid={Boolean(gameTitleErrors.length)}>
              <FieldLabel htmlFor="gameTitle">ゲームタイトル</FieldLabel>
              <Input
                id="gameTitle"
                name="gameTitle"
                list="game-title-suggestions"
                required
                disabled={pending}
                aria-invalid={Boolean(gameTitleErrors.length)}
              />
              <datalist id="game-title-suggestions">
                {GAME_TITLE_SUGGESTIONS.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
              <FieldError errors={gameTitleErrors} />
            </Field>

            <Field data-invalid={Boolean(difficultyErrors.length)}>
              <FieldLabel htmlFor="difficulty">使用する譜面難易度</FieldLabel>
              <Input
                id="difficulty"
                name="difficulty"
                required
                disabled={pending}
                aria-invalid={Boolean(difficultyErrors.length)}
              />
              <FieldError errors={difficultyErrors} />
            </Field>
          </div>

          <Field data-invalid={Boolean(songTitleErrors.length)}>
            <FieldLabel htmlFor="songTitle">楽曲名</FieldLabel>
            <Input
              id="songTitle"
              name="songTitle"
              required
              disabled={pending}
              aria-invalid={Boolean(songTitleErrors.length)}
            />
            <FieldError errors={songTitleErrors} />
          </Field>
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>開催期間</FieldLegend>
        <FieldGroup>
          <Field data-invalid={Boolean(openUntilErrors.length)}>
            <FieldLabel htmlFor="openUntil">
              <CalendarClock className="size-4" />
              大会のスコア登録期限
            </FieldLabel>
            <Input
              id="openUntil"
              name="openUntil"
              type="datetime-local"
              step={60}
              defaultValue={defaultOpenUntil}
              required
              disabled={pending}
              aria-invalid={Boolean(openUntilErrors.length)}
            />
            <FieldDescription>
              分単位まで指定できます。入力値はJSTとして保存されます。
            </FieldDescription>
            <FieldError errors={openUntilErrors} />
          </Field>

          <Field orientation="horizontal" className="items-start">
            <input
              id="useManualOpenSince"
              name="useManualOpenSince"
              type="checkbox"
              checked={useManualOpenSince}
              disabled={pending}
              onChange={(event) => setUseManualOpenSince(event.target.checked)}
              className="mt-1 size-4 rounded border-input"
            />
            <FieldContent>
              <FieldLabel htmlFor="useManualOpenSince">
                大会の開始日時を指定する
              </FieldLabel>
              <FieldDescription>
                未来の日時を指定すると、開催を予約できます。
              </FieldDescription>
            </FieldContent>
          </Field>

          {useManualOpenSince ? (
            <Field data-invalid={Boolean(openSinceErrors.length)}>
              <FieldLabel htmlFor="openSince">
                <CalendarClock className="size-4" />
                大会の開始日時
              </FieldLabel>
              <Input
                id="openSince"
                name="openSince"
                type="datetime-local"
                step={60}
                defaultValue={defaultOpenSince}
                required={useManualOpenSince}
                disabled={pending}
                aria-invalid={Boolean(openSinceErrors.length)}
              />
              <FieldError errors={openSinceErrors} />
            </Field>
          ) : null}
        </FieldGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend>順位付けの設定</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal" className="items-start">
            <input
              id="ascOrder"
              name="ascOrder"
              type="checkbox"
              disabled={pending}
              className="mt-1 size-4 rounded border-input"
            />
            <FieldContent>
              <FieldLabel htmlFor="ascOrder">
                <ListOrdered className="size-4" />
                スコアのソートを昇順にする
              </FieldLabel>
              <FieldDescription>
                小さいスコアほど上位になる大会で使用します。
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field orientation="horizontal" className="items-start">
            <input
              id="altRank"
              name="altRank"
              type="checkbox"
              disabled={pending}
              className="mt-1 size-4 rounded border-input"
            />
            <FieldContent>
              <FieldLabel htmlFor="altRank">
                <Check className="size-4" />
                同じスコアに同じ順位をつける
              </FieldLabel>
              <FieldDescription>
                同点のプレイヤーを、提出時刻の差に関係なく同じ順位として表示します。
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(hideScoreHrErrors.length)}>
            <FieldLabel htmlFor="hideScoreHr">
              <EyeOff className="size-4" />
              順位表を非表示にする時間
            </FieldLabel>
            <Input
              id="hideScoreHr"
              name="hideScoreHr"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
              required
              disabled={pending}
              aria-invalid={Boolean(hideScoreHrErrors.length)}
            />
            <FieldDescription>
              0以上にすると、終了前の指定時間だけ他プレイヤーのスコアを非表示にします。例えば、24に設定すると最後の1日は参加者がお互いのスコアを確認できなくなります。
            </FieldDescription>
            <FieldError errors={hideScoreHrErrors} />
          </Field>
        </FieldGroup>
      </FieldSet>

      {state.message ? (
        <div
          aria-live="polite"
          className={
            state.status === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          }
        >
          <p>{state.message}</p>
          {state.competitionId ? (
            <Link
              href={`/comp/${state.competitionId}`}
              className="mt-1 inline-flex text-sm font-medium underline underline-offset-4"
            >
              作成した大会を開く
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-12 w-full text-base sm:h-10 sm:text-sm"
      >
        <Plus />
        {pending ? "作成中…" : "大会を作成する"}
      </Button>
    </form>
  );
}

function toFieldErrors(messages: string[] | undefined) {
  return messages?.map((message) => ({ message })) ?? [];
}

function getDateTimeLocalAfterDays(days: number) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return toJstDateTimeLocal(date);
}

function getDateTimeLocalAfterMinutes(minutes: number) {
  const date = new Date(Date.now() + minutes * 60 * 1000);
  return toJstDateTimeLocal(date);
}

function toJstDateTimeLocal(date: Date) {
  const jstTime = date.getTime() + 9 * 60 * 60 * 1000;
  const jstDate = new Date(jstTime);

  return jstDate.toISOString().slice(0, 16);
}
