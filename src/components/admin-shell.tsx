import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Gift, KeyRound, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui-kit";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useStore } from "@/lib/store";

const nav = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/admin/prizes", label: "Kelola Hadiah", icon: Gift },
  { to: "/admin/otp", label: "Kode OTP", icon: KeyRound },
  { to: "/admin/users", label: "Data User", icon: Users },
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { state, setAdmin } = useStore();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !state.adminLoggedIn) navigate({ to: "/" });
  }, [ready, state.adminLoggedIn, navigate]);

  if (!ready || !state.adminLoggedIn) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-b from-accent/30 to-background">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5 font-semibold group-data-[collapsible=icon]:justify-center">
              <LayoutDashboard className="size-5 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Webull Spinner</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((n) => (
                    <SidebarMenuItem key={n.to}>
                      <SidebarMenuButton asChild tooltip={n.label}>
                        <Link
                          to={n.to}
                          activeOptions={{ exact: n.to === "/admin" }}
                          className="data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-sidebar-accent-foreground"
                        >
                          <n.icon />
                          <span>{n.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Keluar"
                  onClick={async () => {
                    await setAdmin(false);
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut />
                  <span>Keluar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-transparent">
          <header className="flex items-center gap-2 border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
            <SidebarTrigger />
            <span className="font-semibold">Admin Dashboard</span>
            <Button
              variant="ghost"
              className="ml-auto"
              onClick={async () => {
                await setAdmin(false);
                navigate({ to: "/" });
              }}
            >
              Keluar
            </Button>
          </header>
          <main className="space-y-6 px-4 py-8 md:px-8">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
