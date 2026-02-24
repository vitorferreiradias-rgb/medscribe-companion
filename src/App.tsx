import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { AppDataProvider } from "@/hooks/useAppData";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import AgendaPage from "@/pages/AgendaPage";
import Consultas from "@/pages/Consultas";
import ConsultaDetalhe from "@/pages/ConsultaDetalhe";
import Pacientes from "@/pages/Pacientes";
import PacienteDetalhe from "@/pages/PacienteDetalhe";
import Perfil from "@/pages/Perfil";
import NotFound from "@/pages/NotFound";
import Noticias from "@/pages/Noticias";
import NovaConsulta from "@/pages/NovaConsulta";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <AppDataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/agenda" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/consultas/nova" element={<NovaConsulta />} />
              <Route element={<AppLayout />}>
                <Route path="/agenda" element={<AgendaPage />} />
                <Route path="/consultas" element={<Consultas />} />
                <Route path="/consultas/:id" element={<ConsultaDetalhe />} />
                <Route path="/pacientes" element={<Pacientes />} />
                <Route path="/pacientes/:id" element={<PacienteDetalhe />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/noticias" element={<Noticias />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
