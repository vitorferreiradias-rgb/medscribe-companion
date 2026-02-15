import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppDataProvider } from "@/hooks/useAppData";
import { AppLayout } from "@/components/AppLayout";
import AgendaPage from "@/pages/AgendaPage";
import Consultas from "@/pages/Consultas";
import ConsultaDetalhe from "@/pages/ConsultaDetalhe";
import Pacientes from "@/pages/Pacientes";
import Perfil from "@/pages/Perfil";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppDataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/agenda" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/consultas" element={<Consultas />} />
              <Route path="/consultas/:id" element={<ConsultaDetalhe />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
