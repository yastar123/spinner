import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[2rem] border border-border bg-card p-6 shadow-tile", className)}>
      {children}
    </div>
  );
}

export function Tile({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-[1.5rem] border border-border bg-card p-5", className)}>
      {children}
    </div>
  );
}

export function TileLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </p>
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-accent hover:brightness-95",
    soft: "border border-border bg-card text-secondary-foreground hover:border-primary/40 hover:text-primary",
    ghost: "text-muted-foreground hover:bg-secondary",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-input bg-background px-5 py-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card focus:ring-4 focus:ring-ring/10",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="ml-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
      {children}
    </p>
  );
}

export function Badge({
  children,
  tone = "sky",
}: {
  children: ReactNode;
  tone?: "sky" | "muted" | "warn";
}) {
  const tones = {
    sky: "bg-accent text-accent-foreground",
    muted: "bg-muted text-muted-foreground",
    warn: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-bold", tones[tone])}>{children}</span>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-[500px] flex-col gap-4">
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Webull Ƨpinner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Demo aplikasi spin hadiah</p>
        </div>
        {children}
      </div>
    </main>
  );
}
export function PrizeIcon({
  icon,
  name,
  className,
}: {
  icon: string;
  name?: string;
  className?: string;
}) {
  if (icon?.startsWith("data:") || icon?.startsWith("http")) {
    return (
      <img
        src={icon}
        alt={name ? `Ikon hadiah ${name}` : "Ikon hadiah"}
        className={cn("inline-block h-8 w-8 rounded-lg object-cover align-middle", className)}
      />
    );
  }
  return <span className={className}>{icon}</span>;
}
