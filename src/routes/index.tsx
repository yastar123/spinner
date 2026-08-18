import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, Button, Card, Field, Input, PublicShell } from "@/components/ui-kit";
import { DEMO_ADMIN, DEMO_USER, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Login — Webull Spinner" },
      { name: "description", content: "Satu halaman login untuk user dan admin." },
      { property: "og:title", content: "Login — Webull Spinner" },
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
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!email || !password) {
              setError("Email dan password wajib diisi");
              return;
            }
            if (email.trim() === DEMO_ADMIN.username && password === DEMO_ADMIN.password) {
              setAdmin(true);
              navigate({ to: "/admin" });
              return;
            }
            loginUser(email.trim(), password);
            navigate({ to: "/otp" });
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

        <div className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-sm font-medium">Akun demo</p>
          <p className="text-xs text-muted-foreground">
            User: {DEMO_USER.email} / {DEMO_USER.password}
            <br />
            Admin: {DEMO_ADMIN.username} / {DEMO_ADMIN.password}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="soft"
              className="flex-1"
              onClick={() => {
                setEmail(DEMO_USER.email);
                setPassword(DEMO_USER.password);
              }}
            >
              Isi akun user
            </Button>
            <Button
              type="button"
              variant="soft"
              className="flex-1"
              onClick={() => {
                setEmail(DEMO_ADMIN.username);
                setPassword(DEMO_ADMIN.password);
              }}
            >
              Isi akun admin
            </Button>
          </div>
        </div>
      </Card>
    </PublicShell>
  );
}
