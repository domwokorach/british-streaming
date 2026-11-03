"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface NotificationItem {
  id: string;
  text: string;
}

/** The catalogue has no notification feed yet, so the badge only appears once real items are passed in. */
export function NotificationDropdown({ items = [] }: { items?: NotificationItem[] }) {
  const count = items.length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"} className="relative size-11 text-white hover:bg-transparent hover:text-white/80" />}>
        <Bell className="size-5" aria-hidden />
        {count > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-ws-blue text-[10px] font-bold leading-none text-white">{count > 99 ? "99+" : count}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mt-2 w-72 rounded-[4px] border-white/15 bg-black/95 p-3 text-white">
        <p className="text-sm font-medium">Notifications</p>
        {count === 0 ? <p className="mt-1 text-xs text-ws-text-2">You&apos;re all caught up.</p> : <ul className="mt-2 space-y-2 text-xs text-ws-text-2">{items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
