"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, HomeIcon, LogOut } from "lucide-react";

import { getVisibleNavigationItems } from "./navigation";
import { MenuItem } from "./menu-item";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/authService";
import type { SessionUser } from "@/types/user";
import { useRouter } from "next/navigation";

type Props = {
  currentUser: Pick<SessionUser, 'name' | 'role'>
}

export function DesktopMenu({ currentUser }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = getVisibleNavigationItems(currentUser.role)

  const handleLogout = async () => {
    await AuthService.logout().catch(() => undefined)
    router.replace('/login')
    router.refresh()
  }

  return (
    <aside
      className={`hidden h-screen flex-col border-r border-slate-200 bg-background/95 backdrop-blur transition-[width] duration-300 ease-in-out lg:flex ${collapsed ? "w-20" : "w-64"
        }`}
    >
      <div className="border-b border-slate-200 p-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <HomeIcon size={40} className="shrink-0 text-sky-600" />

            {!collapsed && (
              <div>
                <h2 className="font-semibold">Souza Construções</h2>

                <p className="text-xs text-muted-foreground">
                  Materiais para Construção
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setCollapsed(true)}
              aria-label="Recolher menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mx-auto mt-3 h-8 w-8"
            onClick={() => setCollapsed(false)}
            aria-label="Abrir menu"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {visibleItems.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-200 p-3">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-xs text-slate-500">{currentUser.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="mx-auto h-9 w-9"
            onClick={() => void handleLogout()}
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
