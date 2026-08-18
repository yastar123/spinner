import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, PrizeIcon, PublicShell } from "@/components/ui-kit";
import { useStore, type Prize } from "@/lib/store";

export const Route = createFileRoute("/spinner")({
  head: () => ({
    meta: [
      { title: "Spin Hadiah — Webull Ƨpinner" },
      {
        name: "description",
        content: "Putar roda dan menangkan hadiah sesuai kuota kode OTP Anda.",
      },
      { property: "og:title", content: "Spin Hadiah — Webull Ƨpinner" },
      {
        property: "og:description",
        content: "Putar roda dan menangkan hadiah sesuai kuota kode OTP Anda.",
      },
    ],
  }),
  component: SpinnerPage,
});

const SEGMENT_COLORS = ["oklch(0.68 0.14 232)", "oklch(0.52 0.13 245)"];

function SpinnerPage() {
  const { state, currentUser, currentOtp, spin, logoutUser } = useStore();
  const navigate = useNavigate();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !currentUser) navigate({ to: "/login" });
    else if (ready && currentUser && !currentUser.otpCode) navigate({ to: "/otp" });
  }, [ready, currentUser, navigate]);

  if (!currentOtp) return <PublicShell>{null}</PublicShell>;

  const prizes = state.prizes;
  const winningId = currentOtp.winningPrizeId ?? currentOtp.prizeIds[0] ?? null;
  const remaining = currentOtp.limit - currentOtp.used;
  const seg = prizes.length ? 360 / prizes.length : 360;

  const handleSpin = async () => {
    setError("");
    setSpinning(true);
    const res = await spin();
    if (!res.ok) {
      setError(res.error ?? "Gagal");
      setSpinning(false);
      return;
    }
    const finalPrizeId = res.prize?.id ?? winningId;
    const target = prizes.findIndex((p) => p.id === finalPrizeId);
    const idx = target >= 0 ? target : 0;
    const final = 360 * 6 - (idx * seg + seg / 2);
    setAngle((a) => a + (final - (a % 360)) + 360);
    setTimeout(() => {
      setSpinning(false);
      setResult(res.prize ?? null);
    }, 4000);
  };

  const gradient = prizes.length
    ? `conic-gradient(${prizes
        .map((_, i) => `${SEGMENT_COLORS[i % 2]} ${i * seg}deg ${(i + 1) * seg}deg`)
        .join(", ")})`
    : "conic-gradient(oklch(0.9 0.06 225) 0deg 360deg)";

  return (
    <PublicShell>
      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{currentUser?.email}</p>
            <p className="text-xs text-muted-foreground">OTP {currentOtp.code}</p>
          </div>
          <Badge>Sisa spin: {remaining}</Badge>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-xs">
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-2xl">▼</div>
          <div
            className="h-full w-full rounded-full border-8 border-card shadow-lg"
            style={{
              background: gradient,
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.15,0.9,0.2,1)" : undefined,
            }}
          >
            {prizes.map((p, i) => {
              const rad = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
              return (
                <div
                  key={p.id}
                  className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center text-[11px] font-semibold leading-tight text-primary-foreground"
                  style={{
                    left: `${50 + 30 * Math.cos(rad)}%`,
                    top: `${50 + 30 * Math.sin(rad)}%`,
                  }}
                >
                  <div
                    className="flex flex-col items-center gap-1"
                    style={{
                      transform: `rotate(${-angle}deg)`,
                      transition: spinning
                        ? "transform 4s cubic-bezier(0.15,0.9,0.2,1)"
                        : undefined,
                    }}
                  >
                    <PrizeIcon icon={p.icon} name={p.name} className="h-5 w-5" />
                    <span className="drop-shadow">{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-primary bg-card" />
        </div>

        {error && <Alert>{error}</Alert>}
        {remaining <= 0 && !error && <Alert>Kuota spin Anda sudah habis.</Alert>}

        <Button
          className="w-full"
          onClick={handleSpin}
          disabled={spinning || remaining <= 0 || prizes.length === 0}
        >
          {spinning ? "Memutar..." : "Spin"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={async () => {
            await logoutUser();
            navigate({ to: "/login" });
          }}
        >
          Keluar
        </Button>
      </Card>

      {result && !spinning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4">
          <Card className="w-full max-w-sm space-y-4 text-center">
            <div className="text-5xl">
              <PrizeIcon icon={result.icon} name={result.name} className="mx-auto h-20 w-20" />
            </div>
            <h3 className="text-lg font-semibold">Selamat!</h3>
            <p className="text-sm text-muted-foreground">Anda mendapatkan {result.name}</p>
            <Button className="w-full" onClick={() => setResult(null)}>
              Tutup
            </Button>
          </Card>
        </div>
      )}
    </PublicShell>
  );
}
