import { useState } from "react";
import { motion } from "framer-motion";
import { useAppData } from "@/hooks/useAppData";
import { updateSettings, resetToSeed, clearStorage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LogOut, User, Settings, Database, Shield } from "lucide-react";

const fadeUp = (i: number) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.25 } });

export default function Perfil() {
  const data = useAppData();
  const { toast } = useToast();
  const [clearOnLogout, setClearOnLogout] = useState(false);
  const [loggedOut, setLoggedOut] = useState(!data.settings.sessionSimulated.isLoggedIn);

  const handleResetSeed = () => {
    resetToSeed();
    toast({ title: "Dados de exemplo restaurados." });
  };

  const handleLogout = () => {
    if (clearOnLogout) clearStorage();
    updateSettings({ sessionSimulated: { isLoggedIn: false } });
    setLoggedOut(true);
    toast({ title: "Você saiu da conta (simulado)." });
  };

  const handleLogin = () => {
    updateSettings({ sessionSimulated: { isLoggedIn: true } });
    setLoggedOut(false);
  };

  const infoRows = [
    { label: "Nome", value: "Dr. Ricardo Mendes" },
    { label: "Email", value: "ricardo@medscribe.app" },
    { label: "CRM", value: "CRM/SP 123456" },
    { label: "Fuso horário", value: "América/São Paulo (pt-BR)" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Meu Perfil</h1>

      <motion.div {...fadeUp(0)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(1)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Preferências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="persist" className="text-sm">Persistência local</Label>
              <Switch
                id="persist"
                checked={data.settings.persistLocal}
                onCheckedChange={(v) => updateSettings({ persistLocal: v })}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="banner" className="text-sm">Mostrar aviso de modo simulado</Label>
              <Switch
                id="banner"
                checked={data.settings.showSimulatedBanner}
                onCheckedChange={(v) => updateSettings({ showSimulatedBanner: v })}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fadeUp(2)}>
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

      <motion.div {...fadeUp(3)}>
        <Card className="glass-card rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loggedOut ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Você saiu da conta (simulado).</p>
                <Button variant="outline" onClick={handleLogin} className="transition-all duration-150 ease-out">Entrar novamente</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox id="clear" checked={clearOnLogout} onCheckedChange={(v) => setClearOnLogout(!!v)} />
                  <Label htmlFor="clear" className="text-sm">Limpar dados locais ao sair</Label>
                </div>
                <Button variant="destructive" onClick={handleLogout} className="w-full transition-all duration-150 ease-out hover:shadow-md">
                  <LogOut className="mr-2 h-4 w-4" /> Logout (simulado)
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
