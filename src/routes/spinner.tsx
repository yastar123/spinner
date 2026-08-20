import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, Badge, Button, PrizeIcon } from "@/components/ui-kit";
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

const FIXED_INITIAL_COLORS = [
  "#10B981", // 1. Hijau (Green)
  "#3B82F6", // 2. Biru (Blue)
  "#8B5CF6", // 3. Ungu (Purple)
  "#F59E0B", // 4. Kuning (Yellow)
  "#EF4444", // 5. Merah (Red)
];

const RANDOM_PALETTE = [
  "#F97316", // 6. Orange
  "#14B8A6", // 7. Teal
  "#EC4899", // 8. Pink
  "#6366F1", // 9. Indigo
  "#06B6D4", // 10. Cyan
  "#84CC16", // 11. Lime
  "#D946EF", // 12. Fuchsia
  "#0284C7", // 13. Sky
  "#E11D48", // 14. Rose
];

function getSegmentColor(index: number): string {
  if (index < FIXED_INITIAL_COLORS.length) {
    return FIXED_INITIAL_COLORS[index];
  }
  return RANDOM_PALETTE[(index - FIXED_INITIAL_COLORS.length) % RANDOM_PALETTE.length];
}

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

  if (!currentOtp) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  const prizes = state.prizes;
  const currentSpinIndex = currentOtp.used;
  const winningId =
    (Array.isArray(currentOtp.prizeIds) ? currentOtp.prizeIds[currentSpinIndex] : null) ??
    (Array.isArray(currentOtp.prizeIds) ? currentOtp.prizeIds[0] : null) ??
    currentOtp.winningPrizeId ??
    null;
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
    const finalAngle = (currentRotation + 10) * 360 + target_angle;
    setAngle(finalAngle);

    setTimeout(() => {
      setSpinning(false);
      setResult(res.prize ?? null);
    }, 8000);
  };

  const gradient = prizes.length
    ? `conic-gradient(${prizes
        .map((_, i) => `${getSegmentColor(i)} ${i * seg}deg ${(i + 1) * seg}deg`)
        .join(", ")})`
    : "conic-gradient(#10B981 0deg 360deg)";

  return (
    <main className="flex min-h-screen w-full flex-col justify-between bg-background text-foreground">
      {/* Top Full-Width Header Bar */}
      <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-border bg-card/90 px-4 py-3 sm:px-8 sm:py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Webull Ƨpinner
          </h1>
          <span className="hidden sm:inline-block text-xs font-mono bg-secondary px-3 py-1 rounded-full text-muted-foreground font-semibold">
            {currentUser?.email}
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <div className="text-right">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
              OTP:{" "}
              <span className="font-bold text-foreground tracking-wider">{currentOtp.code}</span>
            </p>
          </div>
          <Badge className="text-xs sm:text-sm px-3 py-1 font-bold">Sisa Spin: {remaining}</Badge>
          <Button
            variant="ghost"
            className="text-xs px-3 py-1.5 h-auto rounded-lg"
            onClick={async () => {
              await logoutUser();
              navigate({ to: "/login" });
            }}
          >
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-6 sm:py-10">
        {/* Large Spinner Container */}
        <div className="relative mx-auto aspect-square w-full max-w-[340px] min-[420px]:max-w-[420px] sm:max-w-[500px] md:max-w-[560px] lg:max-w-[620px] select-none my-2 sm:my-4">
          {/* Static wheel with custom colors, thick black borders & dividers */}
          <div
            className="relative h-full w-full rounded-full border-[10px] sm:border-[14px] md:border-[18px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden"
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
                  className="absolute left-1/2 top-1/2 w-[3px] sm:w-[4px] md:w-[5px] h-[50%] bg-neutral-900 origin-top -translate-x-1/2"
                  style={{
                    transform: `rotate(${dividerAngle}deg)`,
                  }}
                />
              );
            })}

            {/* Labels & Icons of Prizes */}
            {prizes.map((p, i) => {
              const rad = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
              const distPercent = prizes.length > 8 ? 35 : 32;
              return (
                <div
                  key={p.id}
                  className="absolute flex w-20 min-[420px]:w-24 sm:w-32 md:w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center text-white pointer-events-none"
                  style={{
                    left: `${50 + distPercent * Math.cos(rad)}%`,
                    top: `${50 + distPercent * Math.sin(rad)}%`,
                  }}
                >
                  <div className="flex flex-col items-center gap-1 sm:gap-1.5 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)] max-w-full px-0.5">
                    <PrizeIcon
                      icon={p.icon}
                      name={p.name}
                      className="h-6 w-6 min-[420px]:h-7 min-[420px]:w-7 sm:h-9 sm:w-9 md:h-11 md:w-11 object-contain shrink-0"
                    />
                    <span className="line-clamp-2 break-words text-[10px] min-[420px]:text-xs sm:text-sm md:text-base font-extrabold leading-tight drop-shadow-md">
                      {p.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Rotating Needle (Aesthetic Board Game Spinner - Exactly Centered) */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "50% 50%",
              transition: spinning ? "transform 8s cubic-bezier(0.15,0.9,0.2,1)" : undefined,
            }}
          >
            <svg
              viewBox="0 0 300 300"
              className="h-full w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.75)]"
            >
              <defs>
                <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2c2c2c" />
                  <stop offset="50%" stopColor="#1a1a1a" />
                  <stop offset="100%" stopColor="#0d0d0d" />
                </linearGradient>
                <radialGradient id="capGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#484848" />
                  <stop offset="65%" stopColor="#1c1c1c" />
                  <stop offset="100%" stopColor="#0a0a0a" />
                </radialGradient>
              </defs>

              {/* Retro spade arrow tip */}
              <path
                d="M 150 16 Q 132 38 144 56 L 156 56 Q 168 38 150 16 Z"
                fill="url(#needleGrad)"
                stroke="#111111"
                strokeWidth="1.5"
              />

              {/* Shaft */}
              <rect
                x="146"
                y="54"
                width="8"
                height="182"
                fill="url(#needleGrad)"
                stroke="#111111"
                strokeWidth="1"
              />

              {/* Circular counterweight at the bottom */}
              <circle
                cx="150"
                cy="242"
                r="14"
                fill="url(#needleGrad)"
                stroke="#111111"
                strokeWidth="2"
              />
              <circle cx="150" cy="242" r="5" fill="#333333" />

              {/* Center Pivot cap (3D metallic effect exactly at 150, 150) */}
              <circle
                cx="150"
                cy="150"
                r="20"
                fill="url(#capGrad)"
                stroke="#444444"
                strokeWidth="2.5"
              />
              <circle cx="150" cy="150" r="11" fill="#141414" stroke="#252525" strokeWidth="1.5" />
              <circle cx="147" cy="147" r="3.5" fill="#666666" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Action Controls Container */}
        <div className="w-full max-w-md mt-6 sm:mt-8 space-y-3">
          {error && <Alert>{error}</Alert>}
          {remaining <= 0 && !error && (
            <p className="rounded-xl border border-border bg-secondary/80 px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
              Kuota spin Anda sudah habis.
            </p>
          )}

          <Button
            className="w-full text-base sm:text-lg py-4 sm:py-5 font-black uppercase tracking-wider shadow-2xl transition-transform active:scale-[0.98] rounded-2xl"
            onClick={handleSpin}
            disabled={spinning || remaining <= 0 || prizes.length === 0}
          >
            {spinning ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                Memutar Roda...
              </span>
            ) : (
              "PUTAR SEKARANG 🎲"
            )}
          </Button>
        </div>

        {/* Full-width Riwayat Hadiah Section (Clean flat layout without card borders) */}
        <div className="w-full max-w-4xl mt-12 sm:mt-16 border-t border-border pt-8 pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <span>🏆</span> Riwayat Hadiah Anda
            </h2>
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              Total: {currentUser?.prizesWon?.length ?? 0} Hadiah
            </span>
          </div>

          {currentUser?.prizesWon && currentUser.prizesWon.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentUser.prizesWon.map((prizeName, idx) => {
                const matchedPrize = state.prizes.find((p) => p.name === prizeName);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between border border-border bg-secondary/30 p-3.5 rounded-xl hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-xs shrink-0">
                        {matchedPrize ? (
                          <PrizeIcon
                            icon={matchedPrize.icon}
                            name={prizeName}
                            className="h-6 w-6 object-contain"
                          />
                        ) : (
                          <span className="text-base">🎁</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-foreground">{prizeName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Putaran Spin #{idx + 1}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      ✓ Berhasil
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border p-6 rounded-xl text-center">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Belum ada hadiah yang didapatkan.
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-1">
                Putar roda spinner sekarang untuk memenangkan hadiah!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Winning Modal */}
      {result && !spinning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm space-y-4 text-center p-6 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-secondary/80 p-2 shadow-inner">
              <PrizeIcon
                icon={result.icon}
                name={result.name}
                className="h-16 w-16 object-contain drop-shadow-md"
              />
            </div>
            <div className="space-y-1">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                SELAMAT! 🎉
              </span>
              <h3 className="text-xl font-bold text-foreground">Hadiah Berhasil Diraih</h3>
              <p className="text-lg font-extrabold text-primary pt-1">{result.name}</p>
            </div>
            <Button
              className="w-full py-3 text-sm font-bold shadow-md rounded-xl"
              onClick={() => setResult(null)}
            >
              Tutup & Lanjutkan
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
