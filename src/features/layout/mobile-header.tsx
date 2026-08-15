"use client";

import { Menu, HomeIcon, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/types/user";

type Props = {
  currentUser: Pick<SessionUser, "name" | "role">;
  onOpenMenu: () => void;
};

function roleLabel(role: SessionUser["role"]) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}

export function MobileHeader({ currentUser, onOpenMenu }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-xl border border-slate-200 bg-white/90"
          onClick={onOpenMenu}
          aria-label="Abrir menu principal"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 shadow-sm ring-1 ring-sky-100">
            <HomeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">ConstróiFácil</p>
            <p className="truncate text-[11px] text-slate-500">Olá, {currentUser.name}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
          <UserRound className="h-3.5 w-3.5 text-slate-400" />
          <span className="max-w-[82px] truncate">{roleLabel(currentUser.role)}</span>
        </div>
      </div>
    </header>
  );
}
