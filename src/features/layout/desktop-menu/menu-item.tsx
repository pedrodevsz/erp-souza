"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}

export function MenuItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm transition-all duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-sky-500/50",
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2",
        active
          ? "bg-sky-50 text-sky-700"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />

      <span
        className={cn(
          "overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
        )}
      >
        {label}
      </span>
    </Link>
  );
}
