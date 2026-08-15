"use client";

import { useEffect, useState } from "react";

import { DesktopMenu } from "./desktop-menu/desktop-menu";
import { MobileHeader } from "./mobile-header";
import { MobileMenuDrawer } from "./mobile-menu-drawer";
import type { SessionUser } from "@/types/user";

type Props = {
  currentUser: Pick<SessionUser, "name" | "role">;
  children: React.ReactNode;
};

export function AppShell({ currentUser, children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleChange = () => {
      if (mediaQuery.matches) {
        setMobileMenuOpen(false);
      }
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6fb_100%)]">
      <DesktopMenu currentUser={currentUser} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader currentUser={currentUser} onOpenMenu={() => setMobileMenuOpen(true)} />

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>

      <MobileMenuDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} currentUser={currentUser} />
    </div>
  );
}
