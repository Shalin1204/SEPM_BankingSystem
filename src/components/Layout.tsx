import type { ReactNode } from "react";
import type { Screen } from "../App";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

interface LayoutProps {
  children: ReactNode;
  current: Screen;
  navigate: (s: Screen) => void;
  onSelectTransaction: (id: string) => void;
  title: string;
  subtitle?: string;
}

export default function Layout({ children, current, navigate, onSelectTransaction, title, subtitle }: LayoutProps) {
  return (
    <div className="flex h-full bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar current={current} navigate={navigate} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          title={title}
          subtitle={subtitle}
          navigate={navigate}
          onSelectTransaction={onSelectTransaction}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
