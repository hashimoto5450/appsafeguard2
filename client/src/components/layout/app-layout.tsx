import { ReactNode } from "react";
import { SideNavigation } from "./side-navigation";
import { TopBar } from "./top-bar";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex h-screen">
      <SideNavigation />
      
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <TopBar title={title} />
        {children}
      </main>
    </div>
  );
}
