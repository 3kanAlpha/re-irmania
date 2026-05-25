"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type NicknameFormState, updateNickname } from "../_lib/actions";

const MAX_NICKNAME_LENGTH = 12;

const initialState: NicknameFormState = {
  status: "idle",
};

type NicknameFormProps = {
  nickname: string;
};

export function NicknameForm({ nickname }: NicknameFormProps) {
  const [state, formAction, pending] = useActionState(
    updateNickname,
    initialState,
  );
  const nicknameErrors = state.errors?.nickname?.map((message) => ({
    message,
  }));
  const hasNicknameError = Boolean(nicknameErrors?.length);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field data-invalid={hasNicknameError}>
          <FieldLabel htmlFor="nickname">ニックネーム</FieldLabel>
          <Input
            id="nickname"
            name="nickname"
            defaultValue={nickname}
            maxLength={MAX_NICKNAME_LENGTH}
            required
            aria-invalid={hasNicknameError}
            aria-describedby="nickname-description"
            disabled={pending}
          />
          <FieldDescription id="nickname-description">
            {MAX_NICKNAME_LENGTH}文字以内で設定してください。
          </FieldDescription>
          <FieldError errors={nicknameErrors} />
        </Field>

        {state.message ? (
          <p
            aria-live="polite"
            className={
              state.status === "success"
                ? "text-sm text-emerald-700 dark:text-emerald-300"
                : "text-sm text-destructive"
            }
          >
            {state.message}
          </p>
        ) : null}

        <Field orientation="horizontal">
          <Button type="submit" disabled={pending}>
            <Save />
            {pending ? "保存中" : "変更を保存"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
