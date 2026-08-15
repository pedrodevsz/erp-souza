"use client";

import { usePathname, useRouter } from "next/navigation";
import { HomeIcon, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AuthService } from "@/services/authService";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/user";
import { MenuItem } from "./desktop-menu/menu-item";
import { getVisibleNavigationItems } from "./desktop-menu/navigation";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: Pick<SessionUser, "name" | "role">;
};

function roleLabel(role: SessionUser["role"]) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}

export function MobileMenuDrawer({ open, onOpenChange, currentUser }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = getVisibleNavigationItems(currentUser.role);

  const handleLogout = async () => {
    onOpenChange(false);
    await AuthService.logout().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[85vw] max-w-sm" aria-label="Menu principal">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 py-5 pr-14">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <HomeIcon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">ConstróiFácil</p>
                <p className="truncate text-xs text-slate-500">Materiais para Construção</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel(currentUser.role)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="space-y-1" aria-label="Menu principal mobile">
              {visibleItems.map((item) => (
                <MenuItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href}
                  collapsed={false}
                  onClick={() => onOpenChange(false)}
                />
              ))}
            </nav>
          </div>

          <div className="border-t border-slate-100 p-4">
            <Button
              type="button"
              variant="outline"
              className={cn("h-11 w-full justify-start gap-2")}
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
