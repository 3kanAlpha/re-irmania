"use client";

import { ArrowLeft, ImageUp, LinkIcon, Upload } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type SubmitScoreFormState, submitScore } from "../_lib/actions";

const COMMENT_MAX_LENGTH = 25;
const IMAGE_SIZE_LIMIT_MB = 5;

const initialState: SubmitScoreFormState = {
  status: "idle",
};

type SubmitScoreFormProps = {
  tournamentId: number;
  isPrivate: boolean;
  hasScore: boolean;
};

export function SubmitScoreForm({
  tournamentId,
  isPrivate,
  hasScore,
}: SubmitScoreFormProps) {
  const [state, formAction, pending] = useActionState(
    submitScore,
    initialState,
  );
  const [useExternalImage, setUseExternalImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl.length > 0) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const scoreErrors = toFieldErrors(state.errors?.score);
  const resultImageErrors = toFieldErrors(state.errors?.resultImage);
  const resultImageUrlErrors = toFieldErrors(state.errors?.resultImageUrl);
  const commentErrors = toFieldErrors(state.errors?.comment);
  const passwordErrors = toFieldErrors(state.errors?.password);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="tournamentId" value={tournamentId} />

      <FieldGroup>
        <Field data-invalid={Boolean(scoreErrors.length)}>
          <FieldLabel htmlFor="score">スコア</FieldLabel>
          <Input
            id="score"
            name="score"
            inputMode="decimal"
            required
            disabled={pending}
            aria-invalid={Boolean(scoreErrors.length)}
            placeholder="例: 123456"
          />
          <FieldError errors={scoreErrors} />
        </Field>

        <Field orientation="horizontal" className="items-start">
          <input
            id="useExternalImage"
            name="useExternalImage"
            type="checkbox"
            checked={useExternalImage}
            disabled={pending}
            onChange={(event) => setUseExternalImage(event.target.checked)}
            className="mt-1 size-4 rounded border-input"
          />
          <FieldContent>
            <FieldLabel htmlFor="useExternalImage">
              <LinkIcon className="size-4" />
              アップロード済みの画像を使う
            </FieldLabel>
            <FieldDescription>
              画像URLを直接入力する場合に選択してください。
            </FieldDescription>
          </FieldContent>
        </Field>

        {useExternalImage ? (
          <Field data-invalid={Boolean(resultImageUrlErrors.length)}>
            <FieldLabel htmlFor="resultImageUrl">リザルト画像URL</FieldLabel>
            <Input
              id="resultImageUrl"
              name="resultImageUrl"
              type="url"
              disabled={pending}
              aria-invalid={Boolean(resultImageUrlErrors.length)}
            />
            <FieldDescription>
              リザルト画像のURLを入力してください。（任意）
            </FieldDescription>
            <FieldError errors={resultImageUrlErrors} />
          </Field>
        ) : (
          <Field data-invalid={Boolean(resultImageErrors.length)}>
            <FieldLabel htmlFor="resultImage">
              <ImageUp className="size-4" />
              リザルト画像
            </FieldLabel>
            <Input
              id="resultImage"
              name="resultImage"
              type="file"
              accept="image/*"
              disabled={pending}
              aria-invalid={Boolean(resultImageErrors.length)}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPreviewUrl((current) => {
                  if (current.length > 0) {
                    URL.revokeObjectURL(current);
                  }

                  return file == null ? "" : URL.createObjectURL(file);
                });
              }}
            />
            <FieldDescription>
              {IMAGE_SIZE_LIMIT_MB}MB以下の画像を選択してください。（任意）
            </FieldDescription>
            <FieldError errors={resultImageErrors} />
            {previewUrl.length > 0 ? (
              // biome-ignore lint/performance/noImgElement: Blob URL previews cannot be optimized by next/image.
              <img
                src={previewUrl}
                alt="選択したリザルト画像のプレビュー"
                className="mt-2 max-h-72 w-full rounded-lg border object-contain"
              />
            ) : null}
          </Field>
        )}

        <Field data-invalid={Boolean(commentErrors.length)}>
          <FieldLabel htmlFor="comment">コメント</FieldLabel>
          <Textarea
            id="comment"
            name="comment"
            maxLength={COMMENT_MAX_LENGTH}
            disabled={pending}
            aria-invalid={Boolean(commentErrors.length)}
            placeholder="コメントを入力してください"
          />
          <FieldDescription>
            {COMMENT_MAX_LENGTH}文字以内で入力してください。（任意）
          </FieldDescription>
          <FieldError errors={commentErrors} />
        </Field>

        {isPrivate && !hasScore ? (
          <Field data-invalid={Boolean(passwordErrors.length)}>
            <FieldLabel htmlFor="password">パスワード</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              required
              maxLength={50}
              disabled={pending}
              aria-invalid={Boolean(passwordErrors.length)}
            />
            <FieldDescription>
              プライベート大会の初回提出にはパスワードが必要です。
            </FieldDescription>
            <FieldError errors={passwordErrors} />
          </Field>
        ) : null}

        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "success"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            }
          >
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button asChild variant="outline">
            <Link href={`/comp/${tournamentId}`}>
              <ArrowLeft />
              大会トップへ戻る
            </Link>
          </Button>
          <Button type="submit" disabled={pending} className="sm:min-w-40">
            <Upload />
            {pending ? "送信中…" : "スコアを提出"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function toFieldErrors(messages: string[] | undefined) {
  return messages?.map((message) => ({ message })) ?? [];
}
