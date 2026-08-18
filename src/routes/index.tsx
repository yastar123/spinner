import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, Button, Card, Field, Input, PublicShell } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Webull Ƨpinner" },
      { name: "description", content: "Satu halaman login untuk user dan admin." },
      { property: "og:title", content: "Login — Webull Ƨpinner" },
      { property: "og:description", content: "Satu halaman login untuk user dan admin." },
    ],
  }),
  component: Index,
});

function Index() {
  const { loginUser, setAdmin } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <PublicShell>
      <Card className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Satu halaman login untuk user maupun admin.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (!email || !password) {
              setError("Email dan password wajib diisi");
              return;
            }

            // Try admin login first dynamically
            const isAdmin = await setAdmin(true, email.trim(), password);
            if (isAdmin) {
              navigate({ to: "/admin" });
              return;
            }

            // Fallback to user login
            const success = await loginUser(email.trim(), password);
            if (success) {
              navigate({ to: "/otp" });
            } else {
              setError("Gagal masuk, silakan periksa kredensial Anda");
            }
          }}
        >
          {error && <Alert>{error}</Alert>}
          <Field label="Email / Username">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com atau admin"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>
      </Card>
    </PublicShell>
  );
}
