import { CalendarDays, Stethoscope, Users, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Agenda", url: "/agenda", icon: CalendarDays },
  { title: "Consultas", url: "/consultas", icon: Stethoscope },
  { title: "Pacientes", url: "/pacientes", icon: Users },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="glass-sidebar border-r border-border/40">
      <SidebarHeader className="px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            M
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            MedScribe
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainItems.map((item) => {
                const isActive = location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10 rounded-lg px-3 transition-all duration-150"
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-[18px] w-[18px]" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        <SidebarSeparator className="mb-2 opacity-40" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/perfil"}
              className="h-10 rounded-lg px-3 transition-all duration-150"
            >
              <NavLink to="/perfil" className="flex items-center gap-3">
                <User className="h-[18px] w-[18px]" />
                <span className="text-sm font-medium">Meu Perfil</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}