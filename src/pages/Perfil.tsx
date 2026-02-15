import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { updateSettings, resetToSeed, clearStorage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, LogOut } from "lucide-react";

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

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Meu Perfil</h1>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Informações da Conta</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span>Dr. Ricardo Mendes</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>ricardo@medscribe.app</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">CRM</span><span>CRM/SP 123456</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fuso horário</span><span>América/São Paulo (pt-BR)</span></div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="persist">Persistência local</Label>
            <Switch
              id="persist"
              checked={data.settings.persistLocal}
              onCheckedChange={(v) => updateSettings({ persistLocal: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="banner">Mostrar aviso de modo simulado</Label>
            <Switch
              id="banner"
              checked={data.settings.showSimulatedBanner}
              onCheckedChange={(v) => updateSettings({ showSimulatedBanner: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button variant="secondary" onClick={handleResetSeed} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Recarregar dados de exemplo
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Sessão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loggedOut ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Você saiu da conta (simulado).</p>
              <Button variant="outline" onClick={handleLogin}>Entrar novamente</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Checkbox id="clear" checked={clearOnLogout} onCheckedChange={(v) => setClearOnLogout(!!v)} />
                <Label htmlFor="clear" className="text-sm">Limpar dados locais ao sair</Label>
              </div>
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" /> Logout (simulado)
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
