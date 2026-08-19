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
  const [limit, setLimit] = useState(1);
  const [selectedPrizes, setSelectedPrizes] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Initialize or adjust selectedPrizes array length when limit changes or prizes load
  const activePrizes = state.prizes;
  const defaultPrizeId = activePrizes[0]?.id || "";

  const currentPrizesList = Array.from({ length: limit }, (_, i) => {
    return selectedPrizes[i] || defaultPrizeId;
  });

  const handleLimitChange = (newLimit: number) => {
    const val = Math.max(1, Math.min(50, newLimit));
    setLimit(val);
    setSelectedPrizes((prev) => {
      const next = [...prev];
      while (next.length < val) {
        next.push(next[next.length - 1] || defaultPrizeId);
      }
      return next.slice(0, val);
    });
  };

  const handlePrizeChange = (index: number, prizeId: string) => {
    const next = [...currentPrizesList];
    next[index] = prizeId;
    setSelectedPrizes(next);
  };

  const handleApplyToAll = (prizeId: string) => {
    setSelectedPrizes(Array(limit).fill(prizeId));
  };

  return (
    <AdminShell title="Generate & Kelola Kode OTP">
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Card className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Generate Kode Baru</h2>
            <p className="text-xs text-muted-foreground">
              Tentukan kuota spin dan hadiah berbeda untuk setiap putaran.
            </p>
          </div>

          {error && <Alert>{error}</Alert>}

          <Field label="Kode OTP (6 Digit)">
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="font-mono tracking-widest font-bold"
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

          <Field label="Jumlah Limit Spin">
            <Input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
            />
          </Field>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Urutan Hadiah per Spin ({limit} Spin)
              </p>
              {limit > 1 && currentPrizesList[0] && (
                <button
                  type="button"
                  onClick={() => handleApplyToAll(currentPrizesList[0])}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Samakan Semua Spin
                </button>
              )}
            </div>

            {activePrizes.length === 0 ? (
              <p className="text-xs text-destructive">
                Belum ada data hadiah. Tambahkan hadiah di menu Hadiah terlebih dahulu.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {Array.from({ length: limit }).map((_, idx) => {
                  const currentSelected = currentPrizesList[idx] || defaultPrizeId;
                  const matchedPrize = activePrizes.find((p) => p.id === currentSelected);

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-secondary/30 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary font-mono font-bold">
                            #{idx + 1}
                          </span>
                          Spin ke-{idx + 1}
                        </span>
                        {matchedPrize && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <PrizeIcon
                              icon={matchedPrize.icon}
                              name={matchedPrize.name}
                              className="h-4 w-4"
                            />
                            <span className="font-medium text-foreground">{matchedPrize.name}</span>
                          </div>
                        )}
                      </div>

                      <select
                        value={currentSelected}
                        onChange={(e) => handlePrizeChange(idx, e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/10"
                      >
                        {activePrizes.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            className="w-full mt-2 font-bold"
            disabled={duplicate || code.length !== 6 || activePrizes.length === 0}
            onClick={async () => {
              if (code.length !== 6) return setError("Kode OTP harus 6 digit");
              if (state.otps.some((o) => o.code === code)) return setError("Kode sudah ada");
              if (activePrizes.length === 0) return setError("Hadiah belum tersedia");

              const finalPrizeIds = currentPrizesList.map((id) => id || defaultPrizeId);
              await createOtp(code, finalPrizeIds, finalPrizeIds[0], limit);
              setError("");
              setCode(nextCode());
              setSelectedPrizes([]);
              setLimit(1);
            }}
          >
            Generate Kode ({limit} Spin)
          </Button>
        </Card>

        <Card className="overflow-x-auto">
          {state.otps.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Belum ada kode OTP yang dibuat.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-2">Kode</th>
                  <th className="py-3 px-2">Daftar Hadiah (Per Putaran)</th>
                  <th className="py-3 px-2">Kuota Spin</th>
                  <th className="py-3 px-2">Used By</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
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
                    <tr key={o.code} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-foreground">{o.code}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {o.prizeIds.map((id, idx) => {
                            const p = state.prizes.find((pz) => pz.id === id);
                            return (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                              >
                                <span className="font-mono font-bold text-[10px] bg-secondary px-1.5 py-0.5 rounded text-foreground">
                                  Spin #{idx + 1}
                                </span>
                                {p ? (
                                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <PrizeIcon
                                      icon={p.icon}
                                      name={p.name}
                                      className="h-3.5 w-3.5"
                                    />
                                    {p.name}
                                  </span>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium">
                        {o.used} / {o.limit}
                      </td>
                      <td className="py-3 px-2 text-xs text-muted-foreground font-mono">
                        {o.usedBy ?? "—"}
                      </td>
                      <td className="py-3 px-2">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          variant="danger"
                          className="text-xs px-3 py-1.5 h-auto"
                          onClick={async () => await deleteOtp(o.code)}
                        >
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
