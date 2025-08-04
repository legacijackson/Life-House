
import { ReactNode } from "react";
import { MobileSidebar } from "@/components/mobile-sidebar";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <MobileSidebar>
      {children}
    </MobileSidebar>
  );
}
