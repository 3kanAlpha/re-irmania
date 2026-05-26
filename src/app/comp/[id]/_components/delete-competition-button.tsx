"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteCompetition } from "../_lib/actions";

type DeleteCompetitionButtonProps = {
  tournamentId: number;
  children: ReactNode;
};

export function DeleteCompetitionButton({
  tournamentId,
  children,
}: DeleteCompetitionButtonProps) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteCompetition(tournamentId);
      setErrorMessage(result.message);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setErrorMessage(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="destructive"
          size="lg"
          className="w-full sm:w-auto"
        >
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>大会を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            大会を削除した場合、この大会に登録されたスコアも同時に削除されます。この操作は取り消すことができません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>キャンセル</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "削除中..." : "削除"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
