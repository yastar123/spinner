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
      <Card className="space-y-4 sm:space-y-6 p-4 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 sm:pb-4">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-xs sm:text-sm font-semibold text-foreground"
              title={currentUser?.email}
            >
              {currentUser?.email}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
              OTP:{" "}
              <span className="font-semibold text-foreground tracking-wider">
                {currentOtp.code}
              </span>
            </p>
          </div>
          <Badge className="shrink-0 text-[10px] sm:text-xs px-2.5 py-1">Sisa: {remaining}</Badge>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[270px] min-[360px]:max-w-[300px] sm:max-w-[360px] md:max-w-[390px] select-none my-1 sm:my-2">
          {/* Static wheel with custom colors, thick black borders & dividers */}
          <div
            className="relative h-full w-full rounded-full border-[8px] sm:border-[10px] md:border-[12px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden"
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
                  className="absolute left-1/2 top-1/2 w-[2.5px] sm:w-[3.5px] h-[50%] bg-neutral-900 origin-top -translate-x-1/2"
                  style={{
                    transform: `rotate(${dividerAngle}deg)`,
                  }}
                />
              );
            })}

            {/* Labels of Prizes */}
            {prizes.map((p, i) => {
              const rad = ((i * seg + seg / 2 - 90) * Math.PI) / 180;
              const distPercent = prizes.length > 8 ? 35 : 32;
              return (
                <div
                  key={p.id}
                  className="absolute flex w-16 min-[360px]:w-20 sm:w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center text-white pointer-events-none"
                  style={{
                    left: `${50 + distPercent * Math.cos(rad)}%`,
                    top: `${50 + distPercent * Math.sin(rad)}%`,
                  }}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full px-0.5">
                    <PrizeIcon
                      icon={p.icon}
                      name={p.name}
                      className="h-4 w-4 min-[360px]:h-5 min-[360px]:w-5 sm:h-6 sm:w-6 object-contain shrink-0"
                    />
                    <span className="line-clamp-2 break-words text-[9px] min-[360px]:text-[10px] sm:text-xs font-bold leading-tight drop-shadow-md">
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
              transition: spinning ? "transform 4s cubic-bezier(0.15,0.9,0.2,1)" : undefined,
            }}
          >
            <svg
              viewBox="0 0 300 300"
              className="h-full w-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)]"
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

        {error && <Alert>{error}</Alert>}
        {remaining <= 0 && !error && <Alert>Kuota spin Anda sudah habis.</Alert>}

        <Button
          className="w-full text-sm sm:text-base py-3.5 sm:py-4 font-extrabold shadow-lg transition-transform active:scale-[0.98]"
          onClick={handleSpin}
          disabled={spinning || remaining <= 0 || prizes.length === 0}
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Memutar Roda...
            </span>
          ) : (
            "PUTAR SEKARANG 🎲"
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-xs sm:text-sm py-2.5"
          onClick={async () => {
            await logoutUser();
            navigate({ to: "/login" });
          }}
        >
          Keluar
        </Button>
      </Card>

      {/* Riwayat Hadiah yang Didapatkan */}
      <Card className="space-y-3 p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <span>🏆</span> Riwayat Hadiah Anda
          </h3>
          <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            Total: {currentUser?.prizesWon?.length ?? 0} Hadiah
          </span>
        </div>

        {currentUser?.prizesWon && currentUser.prizesWon.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {currentUser.prizesWon.map((prizeName, idx) => {
              const matchedPrize = state.prizes.find((p) => p.name === prizeName);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-secondary/40 p-2.5 sm:p-3 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background shadow-xs shrink-0">
                      {matchedPrize ? (
                        <PrizeIcon
                          icon={matchedPrize.icon}
                          name={prizeName}
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <span className="text-sm">🎁</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">{prizeName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Putaran Spin #{idx + 1}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                    ✓ Berhasil
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 p-4 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Belum ada hadiah yang didapatkan.
            </p>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
              Putar roda spinner sekarang untuk memenangkan hadiah!
            </p>
          </div>
        )}
      </Card>

      {result && !spinning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm space-y-4 text-center p-6 bg-card border-border shadow-2xl animate-in zoom-in-95 duration-200">
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
              className="w-full py-3 text-sm font-bold shadow-md"
              onClick={() => setResult(null)}
            >
              Tutup & Lanjutkan
            </Button>
          </Card>
        </div>
      )}
    </PublicShell>
  );
}
