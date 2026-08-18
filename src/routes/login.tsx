import { createFileRoute, redirect } from "@tanstack/react-router";

// Halaman login user sama dengan homepage: arahkan ke "/".
export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
