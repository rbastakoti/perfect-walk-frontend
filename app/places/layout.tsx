import { SessionProvider } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function PlacesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
