import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function CambiarPasswordDialog({
  open,
  onOpenChange,
  supabase,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supabase: SupabaseClient | null;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    toast.success("Contraseña actualizada correctamente");
    setPassword(""); setConfirm(""); setError(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) { setPassword(""); setConfirm(""); setError(null); }
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>Actualiza tu contraseña de acceso al panel.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">Nueva contraseña</Label>
            <Input id="np" type="password" autoComplete="new-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np2">Confirmar contraseña</Label>
            <Input id="np2" type="password" autoComplete="new-password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !supabase}>
              {submitting ? "Guardando…" : "Actualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
