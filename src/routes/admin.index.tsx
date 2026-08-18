import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Webull Spinner" },
      {
        name: "description",
        content: "Ringkasan hadiah, kode OTP, dan user pada demo Webull Spinner.",
      },
      { property: "og:title", content: "Dashboard Admin — Webull Spinner" },
      { property: "og:description", content: "Ringkasan hadiah, kode OTP, dan user." },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { state } = useStore();
  const stats = [
    { label: "Total Hadiah", value: state.prizes.length },
    { label: "Kode OTP", value: state.otps.length },
    { label: "OTP Terpakai", value: state.otps.filter((o) => o.usedBy).length },
    { label: "Total User", value: state.users.length },
  ];
  return (
    <AdminShell title="Ringkasan">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-semibold text-primary">{s.value}</p>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
