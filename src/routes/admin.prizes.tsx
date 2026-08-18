import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card, Field, Input, PrizeIcon } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/prizes")({
  head: () => ({
    meta: [
      { title: "Kelola Hadiah — Webull Spinner" },
      { name: "description", content: "Tambah, ubah, dan hapus daftar hadiah spinner." },
      { property: "og:title", content: "Kelola Hadiah — Webull Spinner" },
      { property: "og:description", content: "Tambah, ubah, dan hapus daftar hadiah spinner." },
    ],
  }),
  component: PrizesPage,
});

function PrizesPage() {
  const { state, addPrize, updatePrize, deletePrize } = useStore();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIcon(String(reader.result));
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setEditingId(null);
    setName("");
    setIcon("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <AdminShell title="Kelola Hadiah">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="space-y-4">
          <h2 className="font-medium">{editingId ? "Ubah Hadiah" : "Tambah Hadiah"}</h2>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) return;
              if (editingId) await updatePrize(editingId, name, icon || "🎁");
              else await addPrize(name, icon);
              reset();
            }}
          >
            <Field label="Nama Hadiah">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bonus $10"
              />
            </Field>
            <Field label="Gambar Hadiah">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="w-full cursor-pointer rounded-2xl border border-input bg-background px-4 py-3 text-sm text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-secondary-foreground"
              />
            </Field>
            {icon && (
              <div className="flex items-center gap-3">
                <PrizeIcon icon={icon} name={name} className="h-14 w-14 text-3xl" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIcon("");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Hapus gambar
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? "Simpan" : "Tambah"}
              </Button>
              {editingId && (
                <Button type="button" variant="soft" onClick={reset}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          {state.prizes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada hadiah.</p>
          ) : (
            <ul className="divide-y divide-border">
              {state.prizes.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <PrizeIcon icon={p.icon} name={p.name} className="text-2xl" />
                  <span className="mr-auto text-sm font-medium">{p.name}</span>
                  <Button
                    variant="soft"
                    onClick={() => {
                      setEditingId(p.id);
                      setName(p.name);
                      setIcon(p.icon);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Ubah
                  </Button>
                  <Button variant="danger" onClick={async () => await deletePrize(p.id)}>
                    Hapus
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
