import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  consultas: "Consultas",
  pacientes: "Pacientes",
  perfil: "Meu Perfil",
};

export function AppLayout() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4">
            <SidebarTrigger />
            {segments.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {segments.map((seg, i) => {
                    const isLast = i === segments.length - 1;
                    const label = routeLabels[seg] ?? seg;
                    const href = "/" + segments.slice(0, i + 1).join("/");
                    return (
                      <BreadcrumbItem key={seg + i}>
                        {i > 0 && <BreadcrumbSeparator />}
                        {isLast ? (
                          <BreadcrumbPage>{label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </header>
          <div className="flex-1 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
