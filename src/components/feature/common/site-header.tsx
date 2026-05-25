import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../theme/mode-toggle";

export default function SiteHeader() {
  return (
    <div className="w-full h-12 px-3 py-1 bg-sky-500 text-white flex items-center">
      <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
        <Link className="text-2xl font-bold" href="/">
          IRmania
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/auth/sign-in">
            <Button
              size="icon"
              className="border border-sky-300 bg-transparent"
            >
              <CircleUserRound />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
