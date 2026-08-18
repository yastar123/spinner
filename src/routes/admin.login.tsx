import { createFileRoute, redirect } from "@tanstack/react-router";

// Login admin memakai halaman login yang sama dengan user di "/".
export const Route = createFileRoute("/admin/login")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
