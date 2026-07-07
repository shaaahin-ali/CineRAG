"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import { LimelightNav, NavItem } from "@/components/ui/limelight-nav";
import {
  Home,
  Clock3,
  LayoutDashboard,
  LogOut,
  UserCircle2,
  Wand2,
} from "lucide-react";

export function AppTopDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home />,
      onClick: () => router.push("/"),
    },
    {
      id: "history",
      label: "History",
      icon: <Clock3 />,
      onClick: () => {
        if (pathname.startsWith("/query/")) {
          router.push(`${pathname}#query-history`);
          return;
        }
        router.push("/dashboard");
      },
    },
    ...(isAuthenticated
      ? [
          {
            id: "screenplay",
            label: "Write",
            icon: <Wand2 />,
            onClick: () => router.push("/dashboard?assist=1"),
          },
          {
            id: "profile",
            label: "Profile",
            icon: <UserCircle2 />,
            onClick: () => router.push("/profile"),
          },
          {
            id: "dashboard",
            label: "Dashboard",
            icon: <LayoutDashboard />,
            onClick: () => router.push("/dashboard"),
          },
          {
            id: "logout",
            label: "Sign out",
            icon: <LogOut />,
            onClick: () => void logout(),
          },
        ]
      : []),
  ];

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4">
      <LimelightNav
        items={navItems}
        tone="dark"
        className="bg-black/90 border-white/8"
        iconClassName="text-zinc-500 hover:text-white"
        limelightClassName="bg-white shadow-[0_28px_24px_rgba(255,255,255,0.08)]"
      />
    </div>
  );
}
