// Gestión de usuarios del panel (solo administrador).
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listPanelUsers, invitarUsuarioPanel, actualizarRolUsuarioPanel, eliminarUsuarioPanel,
  type PanelUserRow, type RolPanel,
} from "@/lib/usuarios-panel.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Props = { accessToken: string; currentUserId: string };

const ROL_BADGE: Record<RolPanel, string> = {
  administrador: "bg-amber-100 text-amber-900",
  operador: "bg-emerald-100 text-emerald-900",
  lectura: "bg-stone-200 text-stone-700",
};

export function UsuariosPanelView({ accessToken, currentUserId }: Props) {
  const fetchList = useServerFn(listPanelUsers);
  const invitar = useServerFn(invitarUsuarioPanel);
  const updateRol = useServerFn(actualizarRolUsuarioPanel);
  const eliminar = useServerFn(eliminarUsuarioPanel);

  const [rows, setRows] = useState<PanelUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openInvite, setOpenInvite] = useState(false);
  const [toDelete, setToDelete] = useState<PanelUserRow | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchList({ data: { accessToken } })
      .then(setRows).catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [accessToken, tick, fetchList]);

  async function handleChangeRol(u: PanelUserRow, rol: RolPanel) {
    if (rol === u.rol) return;
    try {
      await updateRol({ data: { accessToken, id: u.id, rol } });
      toast.success("Rol actualizado");
      setTick(t => t + 1);
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await eliminar({ data: { accessToken, id: toDelete.id } });
      toast.success("Acceso revocado");
      setToDelete(null);
      setTick(t => t + 1);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Usuarios del panel</h2>
          <p className="text-sm text-stone-500">
            Gestiona quién puede acceder y con qué nivel de permisos.
          </p>
        </div>
        <Button onClick={() => setOpenInvite(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Invitar usuario
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr className="text-left">
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Correo</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Creado</th>
              <th className="px-4 py-2 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-stone-500">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-stone-500">Sin usuarios.</td></tr>
            ) : rows.map(u => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">
                    {u.nombre} {isSelf && <span className="text-xs text-stone-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-stone-600">{u.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    <Select
                      value={u.rol}
                      onValueChange={(v) => handleChangeRol(u, v as RolPanel)}
                      disabled={isSelf}
                    >
                      <SelectTrigger className={`h-8 w-36 ${ROL_BADGE[u.rol]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrador">administrador</SelectItem>
                        <SelectItem value="operador">operador</SelectItem>
                        <SelectItem value="lectura">lectura</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2 text-stone-600 text-xs">
                    {u.creado_en ? new Date(u.creado_en).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost" size="icon"
                      disabled={isSelf}
                      onClick={() => setToDelete(u)}
                      title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar acceso"}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <InviteDialog
        open={openInvite}
        onOpenChange={setOpenInvite}
        onSubmit={async (form) => {
          try {
            const redirectTo = `${window.location.origin}/admin/invite`;
            console.log("[InviteDebug] Enviando invitación", {
              redirectTo,
              origin: window.location.origin,
              pathname: window.location.pathname,
            });
            await invitar({ data: { accessToken, redirectTo, ...form } });
            toast.success("Invitación enviada por correo");
            setOpenInvite(false);
            setTick(t => t + 1);
          } catch (e: any) { toast.error(e.message); }
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar acceso de {toDelete?.nombre}</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará su fila en el panel y su cuenta en autenticación, por lo que no podrá
              volver a iniciar sesión. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InviteDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (form: { email: string; nombre: string; rol: RolPanel }) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<RolPanel>("operador");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) { setEmail(""); setNombre(""); setRol("operador"); }
  }, [open]);

  async function handle(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ email, nombre, rol });
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Invitar usuario al panel</DialogTitle></DialogHeader>
        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-email">Correo electrónico</Label>
            <Input id="inv-email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-stone-500">
              Recibirá un correo para configurar su contraseña.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-nombre">Nombre</Label>
            <Input id="inv-nombre" required value={nombre}
              onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as RolPanel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">administrador</SelectItem>
                <SelectItem value="operador">operador</SelectItem>
                <SelectItem value="lectura">lectura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar invitación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
