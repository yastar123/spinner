import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Alert, Badge, Button, Card, Field, Input, PrizeIcon } from "@/components/ui-kit";
import { randomOtpCode, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/otp")({
  head: () => ({
    meta: [
      { title: "Kode OTP — Webull Ƨpinner" },
      {
        name: "description",
        content: "Generate kode OTP dengan konfigurasi hadiah dan limit spin.",
      },
      { property: "og:title", content: "Kode OTP — Webull Ƨpinner" },
      {
        property: "og:description",
        content: "Generate kode OTP dengan konfigurasi hadiah dan limit spin.",
      },
    ],
  }),
  component: OtpAdminPage,
});

function OtpAdminPage() {
  const { state, createOtp, deleteOtp } = useStore();
  const [code, setCode] = useState(randomOtpCode());
  const nextCode = () => {
    let c = randomOtpCode();
    let guard = 0;
    while (state.otps.some((o) => o.code === c) && guard++ < 200) c = randomOtpCode();
    return c;
  };
  const duplicate = state.otps.some((o) => o.code === code);
  const [selected, setSelected] = useState<string | null>(null);
  const [limit, setLimit] = useState(1);
  const [error, setError] = useState("");

  return (
    <AdminShell title="Generate & Kelola Kode OTP">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="space-y-4">
          <h2 className="font-medium">Generate Kode Baru</h2>
          {error && <Alert>{error}</Alert>}
          <Field label="Kode OTP">
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
              />
              <Button variant="soft" type="button" onClick={() => setCode(nextCode())}>
                Acak
              </Button>
            </div>
            {duplicate && (
              <p className="mt-1 text-xs text-destructive">
                Kode ini sudah tersimpan, gunakan kode lain.
              </p>
            )}
          </Field>
          <Field label="Limit Spin">
            <Input
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
            />
          </Field>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hadiah di spinner
            </p>
            <div className="space-y-1">
              {state.prizes.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="otp-prize"
                    checked={selected === p.id}
                    onChange={() => setSelected(p.id)}
                  />
                  <span>
                    <PrizeIcon icon={p.icon} name={p.name} className="h-5 w-5" /> {p.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={duplicate || code.length !== 6 || !selected}
            onClick={async () => {
              if (code.length !== 6) return setError("Kode OTP harus 6 digit");
              if (state.otps.some((o) => o.code === code)) return setError("Kode sudah ada");
              if (!selected) return setError("Pilih 1 hadiah");
              await createOtp(code, [selected], selected, limit);
              setError("");
              setCode(nextCode());
              setSelected(null);
              setLimit(1);
            }}
          >
            Generate Kode
          </Button>
        </Card>

        <Card className="overflow-x-auto">
          {state.otps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kode OTP.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Kode</th>
                  <th>Hadiah</th>
                  <th>Limit</th>
                  <th>Used By</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.otps.map((o) => {
                  const remaining = o.limit - o.used;
                  const status =
                    remaining <= 0
                      ? { label: "Habis", tone: "warn" as const }
                      : o.usedBy
                        ? { label: "Sedang Dipakai", tone: "sky" as const }
                        : { label: "Belum Dipakai", tone: "muted" as const };
                  return (
                    <tr key={o.code}>
                      <td className="py-3 font-mono font-medium">{o.code}</td>
                      <td className="text-muted-foreground">
                        {o.prizeIds
                          .map((id) => state.prizes.find((p) => p.id === id)?.name ?? "-")
                          .join(", ")}
                      </td>
                      <td>
                        {o.used}/{o.limit}
                      </td>
                      <td className="text-muted-foreground">{o.usedBy ?? "—"}</td>
                      <td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="text-right">
                        <Button variant="danger" onClick={async () => await deleteOtp(o.code)}>
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
