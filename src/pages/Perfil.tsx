import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppData } from "@/hooks/useAppData";
import { updateClinician } from "@/lib/store";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LogOut, User, Settings, Database, Shield, Building2, Plus, Trash2, Save, Pencil } from "lucide-react";
import { Clinic } from "@/types";

const fadeUp = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.25 } });

export default function Perfil() {
  const { signOut } = useAuth();
  const data = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clearOnLogout, setClearOnLogout] = useState(false);

  const clinician = data.clinicians[0];

  // Editable profile state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(clinician?.name ?? "");
  const [specialty, setSpecialty] = useState(clinician?.specialty ?? "");
  const [crm, setCrm] = useState(clinician?.crm ?? "");
  const [cpf, setCpf] = useState(clinician?.cpf ?? "");
  const [email, setEmail] = useState(clinician?.email ?? "");
  const [clinics, setClinics] = useState<Clinic[]>(clinician?.clinics ?? []);

  const startEdit = () => {
    setName(clinician?.name ?? "");
    setSpecialty(clinician?.specialty ?? "");
    setCrm(clinician?.crm ?? "");
    setCpf(clinician?.cpf ?? "");
    setEmail(clinician?.email ?? "");
    setClinics(clinician?.clinics ? [...clinician.clinics] : []);
    setEditing(true);
  };

  const handleSaveProfile = () => {
    if (!clinician) return;
    updateClinician(clinician.id, { name, specialty, crm, cpf, email, clinics });
    setEditing(false);
    toast({ title: "Perfil atualizado." });
  };

  const addClinic = () => {
    setClinics([...clinics, { id: `clinic_${Date.now().toString(36)}`, name: "", address: "" }]);
  };

  const removeClinic = (id: string) => {
    setClinics(clinics.filter((c) => c.id !== id));
  };

  const updateClinicField = (id: string, field: "name" | "address", value: string) => {
    setClinics(clinics.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleResetSeed = () => {
    toast({ title: "Funcionalidade desabilitada com Cloud." });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Meu Perfil</h1>

      <motion.div {...fadeUp(0)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Informações da Conta
              </CardTitle>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={startEdit} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Especialidade</Label><Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">CRM</Label><Input value={crm} onChange={(e) => setCrm(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">CPF</Label><Input value={cpf} onChange={(e) => setCpf(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveProfile} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <>
                {[
                  { label: "Nome", value: clinician?.name },
                  { label: "Especialidade", value: clinician?.specialty },
                  { label: "CRM", value: clinician?.crm },
                  { label: "CPF", value: clinician?.cpf },
                  { label: "E-mail", value: clinician?.email },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value ?? "—"}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Clínicas */}
      <motion.div {...fadeUp(1)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Clínicas / Locais
              </CardTitle>
              {editing && (
                <Button variant="ghost" size="sm" onClick={addClinic} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              clinics.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada.</p>
              ) : (
                clinics.map((c) => (
                  <div key={c.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input value={c.name} onChange={(e) => updateClinicField(c.id, "name", e.target.value)} placeholder="Nome da clínica" className="text-sm" />
                      <Input value={c.address} onChange={(e) => updateClinicField(c.id, "address", e.target.value)} placeholder="Endereço" className="text-sm" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeClinic(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )
            ) : (
              (clinician?.clinics ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada.</p>
              ) : (
                (clinician?.clinics ?? []).map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-1 text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.address}</span>
                  </div>
                ))
              )
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(2)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Dados armazenados no Lovable Cloud.</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(3)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={handleResetSeed} className="w-full transition-all duration-150 ease-out hover:shadow-md">
              <RefreshCw className="mr-2 h-4 w-4" /> Recarregar dados de exemplo
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(4)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox id="clear" checked={clearOnLogout} onCheckedChange={(v) => setClearOnLogout(!!v)} />
              <Label htmlFor="clear" className="text-sm">Limpar dados locais ao sair</Label>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="w-full transition-all duration-150 ease-out hover:shadow-md">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
