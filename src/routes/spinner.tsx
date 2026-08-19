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

const SEGMENT_COLORS = [
  "#38BDF8", // Sky Blue
  "#A855F7", // Purple
  "#EAB308", // Yellow
  "#EF4444", // Red
  "#22C55E", // Green
  "#F97316", // Orange
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#F59E0B", // Amber
];

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

    // Target angle points to the center of the winning segment
    const target_angle = idx * seg + seg / 2;

    // Rotate multiple full cycles and stop at the winning segment smoothly
    const currentRotation = Math.floor(angle / 360);
    const finalAngle = (currentRotation + 6) * 360 + target_angle;
    setAngle(finalAngle);

    setTimeout(() => {
      setSpinning(false);
      setResult(res.prize ?? null);
    }, 4000);
  };

  const gradient = prizes.length
    ? `conic-gradient(${prizes
        .map(
          (_, i) =>
            `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`,
        )
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

        <div className="relative mx-auto aspect-square w-full max-w-xs select-none">
          {/* Static wheel with custom colors, thick black borders & dividers */}
          <div
            className="relative h-full w-full rounded-full border-[10px] border-neutral-900 bg-neutral-900 shadow-xl overflow-hidden"
            style={{
              background: gradient,
            }}
          >
            {/* Sector Divider Lines */}
            {prizes.map((_, i) => {
              const dividerAngle = i * seg;
              return (
                <div
                  key={`divider-${i}`}
                  className="absolute left-1/2 top-1/2 w-[3px] h-[50%] bg-neutral-900 origin-top -translate-x-1/2"
                  style={{
                    transform: `rotate(${dividerAngle}deg)`,
                  }}
                />
              );
            })}

            {/* Labels of Prizes */}
            {prizes.map((p, i) => {
              const rad = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
              return (
                <div
                  key={p.id}
                  className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center text-[11px] font-bold leading-tight text-white"
                  style={{
                    left: `${50 + 32 * Math.cos(rad)}%`,
                    top: `${50 + 32 * Math.sin(rad)}%`,
                  }}
                >
                  <div className="flex flex-col items-center gap-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    <PrizeIcon icon={p.icon} name={p.name} className="h-5 w-5" />
                    <span>{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Rotating Needle (Aesthetic Board Game Spinner) */}
          <div
            className="absolute left-1/2 top-1/2 z-20 h-[85%] w-[16%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.15,0.9,0.2,1)" : undefined,
            }}
          >
            <svg
              viewBox="0 0 60 300"
              className="w-full h-full drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)]"
            >
              {/* Retro spade arrow tip */}
              <path
                d="M 30 50 C 18 45, 8 32, 30 5 C 52 32, 42 45, 30 50 Z"
                fill="#1A1A1A"
                stroke="#333333"
                strokeWidth="2"
              />
              {/* Shaft */}
              <rect
                x="26"
                y="45"
                width="8"
                height="215"
                fill="#1A1A1A"
                stroke="#333333"
                strokeWidth="1"
              />

              {/* Circular counterweight */}
              <circle cx="30" cy="265" r="14" fill="#1A1A1A" stroke="#333333" strokeWidth="2" />

              {/* Center Pivot cap */}
              <circle cx="30" cy="150" r="18" fill="#111111" stroke="#333333" strokeWidth="2" />
              <circle cx="30" cy="150" r="7" fill="#2A2A2A" />
            </svg>
          </div>
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
