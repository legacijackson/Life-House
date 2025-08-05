
import { ReactNode } from "react";

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}
