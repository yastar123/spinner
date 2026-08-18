import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Field, Input, PublicShell } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/otp")({
  head: () => ({
    meta: [
      { title: "Verifikasi OTP — Webull Ƨpinner" },
      {
        name: "description",
        content: "Masukkan kode OTP 6 digit dari admin untuk membuka spinner.",
      },
      { property: "og:title", content: "Verifikasi OTP — Webull Ƨpinner" },
      {
        property: "og:description",
        content: "Masukkan kode OTP 6 digit dari admin untuk membuka spinner.",
      },
    ],
  }),
  component: OtpPage,
});

function OtpPage() {
  const { submitOtp, currentUser } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (ready && !currentUser) navigate({ to: "/login" });
  }, [ready, currentUser, navigate]);

  return (
    <PublicShell>
      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Kode OTP</h2>
          <p className="text-sm text-muted-foreground">
            Masukkan kode 6 digit yang diberikan admin.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const res = await submitOtp(code);
            if (!res.ok) setError(res.error ?? "Gagal");
            else navigate({ to: "/spinner" });
          }}
        >
          {error && <Alert>{error}</Alert>}
          <Field label="Kode OTP">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em]"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={code.length !== 6}>
            Verifikasi
          </Button>
        </form>
      </Card>
    </PublicShell>
  );
}
