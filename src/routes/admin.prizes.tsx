import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Button, Card, Field, Input, PrizeIcon } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin/prizes")({
  head: () => ({
    meta: [
      { title: "Kelola Hadiah — Webull Ƨpinner" },
      { name: "description", content: "Tambah, ubah, dan hapus daftar hadiah spinner." },
      { property: "og:title", content: "Kelola Hadiah — Webull Ƨpinner" },
      { property: "og:description", content: "Tambah, ubah, dan hapus daftar hadiah spinner." },
    ],
  }),
  component: PrizesPage,
});

function PrizesPage() {
  const { state, addPrize, updatePrize, deletePrize, seedDummyPrizes } = useStore();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingDummy, setLoadingDummy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const FIXED_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];
  const RANDOM_PALETTE = [
    "#F97316",
    "#14B8A6",
    "#EC4899",
    "#6366F1",
    "#06B6D4",
    "#84CC16",
    "#D946EF",
    "#0284C7",
    "#E11D48",
  ];

  const getColor = (index: number) => {
    if (index < FIXED_COLORS.length) return FIXED_COLORS[index];
    return RANDOM_PALETTE[(index - FIXED_COLORS.length) % RANDOM_PALETTE.length];
  };

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
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">
              {editingId ? "Ubah Hadiah" : "Tambah Hadiah"}
            </h2>
            <Button
              type="button"
              variant="soft"
              className="text-xs px-2.5 py-1.5 h-auto"
              disabled={loadingDummy}
              onClick={async () => {
                setLoadingDummy(true);
                await seedDummyPrizes();
                setLoadingDummy(false);
              }}
            >
              {loadingDummy ? "Memuat..." : "⚡ Isi 10 Dummy"}
            </Button>
          </div>
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
                placeholder="Contoh: iPhone 15 Pro"
              />
            </Field>
            <Field label="Gambar / Ikon Hadiah">
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
              <Button type="submit" className="flex-1 font-bold">
                {editingId ? "Simpan Perubahan" : "Tambah Hadiah"}
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Daftar Hadiah Roda Spinner ({state.prizes.length} Hadiah)
            </h3>
            <span className="text-xs text-muted-foreground">
              Warna 1-5: Hijau, Biru, Ungu, Kuning, Merah
            </span>
          </div>

          {state.prizes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Belum ada hadiah.</p>
              <Button
                variant="soft"
                className="mt-3 text-xs"
                onClick={async () => await seedDummyPrizes()}
              >
                Isi 10 Data Dummy Hadiah
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {state.prizes.map((p, idx) => {
                const color = getColor(idx);
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 py-3 hover:bg-secondary/20 px-2 rounded-xl transition-colors"
                  >
                    <span
                      className="h-4 w-4 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: color }}
                      title={`Warna Sektor Roda: ${color}`}
                    />
                    <span className="font-mono text-xs font-bold text-muted-foreground w-6">
                      #{idx + 1}
                    </span>
                    <PrizeIcon
                      icon={p.icon}
                      name={p.name}
                      className="text-2xl h-8 w-8 object-contain"
                    />
                    <span className="mr-auto text-sm font-bold text-foreground">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="soft"
                        className="text-xs px-3 py-1.5 h-auto"
                        onClick={() => {
                          setEditingId(p.id);
                          setName(p.name);
                          setIcon(p.icon);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        Ubah
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs px-3 py-1.5 h-auto"
                        onClick={async () => await deletePrize(p.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
