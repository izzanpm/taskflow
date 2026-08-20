"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  type: "COMMENT" | "ASSIGNMENT";
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
  task: {
    id: string;
    title: string;
    column: { board: { id: string; workspace: { slug: string } } };
  } | null;
};

type NotificationResponse = {
  unreadCount: number;
  notifications: NotificationItem[];
};

type ApiResponse<T> = { data?: T; error?: string };

async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || result.data === undefined) {
    throw new Error(result.error ?? "The request could not be completed.");
  }
  return result.data;
}

function notificationCopy(item: NotificationItem) {
  const actor = item.actor?.name ?? "A teammate";
  return item.type === "COMMENT"
    ? `${actor} commented on ${item.task?.title ?? "a task"}.`
    : `${actor} assigned ${item.task?.title ?? "a task"} to you.`;
}

export function NotificationBadge() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const queryKey = ["notifications"] as const;
  const { data, isError } = useQuery<NotificationResponse>({
    queryKey,
    queryFn: () => requestApi<NotificationResponse>("/api/notifications"),
    refetchInterval: 30_000,
  });
  const markAllReadMutation = useMutation({
    mutationFn: () =>
      requestApi<{ success: boolean }>("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <Button
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        className="relative size-11 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#004BB0] focus-visible:border-taskflow-brand focus-visible:ring-taskflow-brand/60"
        onClick={() => setIsOpen((open) => !open)}
        size="icon"
        title="Notifications"
        type="button"
        variant="ghost"
      >
        <Bell aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-[#B91C1C] px-1 text-[10px] font-bold leading-4 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2.5rem))] border border-[#E2E8F0] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <Button
                className="h-7 gap-1 px-2 text-[11px] text-[#004BB0]"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                type="button"
                variant="ghost"
              >
                <CheckCheck aria-hidden="true" />
                Mark read
              </Button>
            ) : null}
          </div>

          {isError ? (
            <p className="py-5 text-xs leading-5 text-[#B91C1C]">
              Notifications are unavailable right now.
            </p>
          ) : data?.notifications.length ? (
            <ul className="max-h-80 divide-y divide-[#F1F5F9] overflow-y-auto">
              {data.notifications.map((item) => (
                <li key={item.id}>
                  <div
                    className={`py-3 text-xs leading-5 ${item.readAt ? "text-[#64748B]" : "font-medium text-[#0F172A]"}`}
                  >
                    <p>{notificationCopy(item)}</p>
                    <time className="mt-1 block text-[11px] font-normal text-[#94A3B8]">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(new Date(item.createdAt))}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-5 text-xs leading-5 text-[#64748B]">
              You are all caught up.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
