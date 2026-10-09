import { Outlet } from "react-router-dom";
import { SidebarProvider } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";
import NotificationsPanel from "../components/NotificationsPanel";

const DashboardLayoutContent = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <NotificationsPanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  );
};

export default DashboardLayout;