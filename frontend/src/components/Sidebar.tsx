import {
  LayoutDashboard,
  Users,
  GitBranch,
  Calendar,
  Briefcase,
  Archive,
  Settings,
  LogOut as LogoutIcon,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import logo from "../assets/images/logo-eray.jpg";
import { Users as UsersIcon, UserCog } from "lucide-react";
import { UserRound } from "lucide-react";
import { Star } from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  // console.log(user);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", path: "/clients", icon: UserRound },
    { name: "Pipeline", path: "/pipeline", icon: GitBranch },
    { name: "Agenda", path: "/agenda", icon: Calendar },
    { name: "Projets", path: "/projects", icon: Briefcase },
    { name: "Archives", path: "/archives", icon: Archive },

    // Visible uniquement pour l'admin
    ...(user?.roles?.includes("ROLE_ADMIN")
      ? [
          {
            name: "Utilisateurs",
            path: "/users",
            icon: Users,
          },
        ]
      : []),

    { name: "Paramètres", path: "/settings", icon: Settings },
  ];

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  return (
    <div
      className={`fixed lg:relative h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-300 ease-in-out z-40 overflow-x-hidden ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* HEADER DU SIDEBAR */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-linear-to-r from-gray-50 to-blue-50">
        {!isCollapsed && (
          <div
            className={`relative transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed
                ? "w-0 opacity-0 scale-90"
                : "w-10 opacity-100 scale-100"
            }`}
          >
            <img
              src={logo}
              alt="Logo"
              className="h-10 w-10 rounded-xl object-cover shadow-md hover:shadow-lg transform transition-all duration-300"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-2 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 text-gray-600 hover:text-blue-600"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-3 space-y-1.5">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.path}
              className={`group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[11px] font-semibold transition-all duration-200 relative cursor-pointer transform hover:scale-[1.02]
                ${
                  isActive
                    ? "bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-linear-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:shadow-md"
                }
              `}
              onClick={() => navigate(item.path)}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div
                className={`relative ${
                  isActive ? "text-white" : "text-gray-600"
                }`}
              >
                <item.icon
                  className={`shrink-0 transition-all duration-300 ${
                    isCollapsed ? "h-5 w-5" : "h-5 w-5"
                  } group-hover:scale-110 ${isActive ? "text-white" : ""}`}
                />
                {isActive && (
                  <div className="absolute inset-0 blur-sm bg-white opacity-30 rounded-full animate-pulse" />
                )}
              </div>

              {!isCollapsed && (
                <span className="truncate whitespace-nowrap transition-all duration-300 group-hover:translate-x-1 font-medium flex items-center gap-1">
                  {item.name}

                  {item.name === "Utilisateurs"}
                </span>
              )}

              {isActive && !isCollapsed && (
                <div className="absolute right-2 w-1 h-6 bg-white rounded-full shadow-lg animate-pulse" />
              )}
            </div>
          );
        })}
      </nav>

      {/* PROFIL UTILISATEUR */}
      <div
        className={`p-4 border-t border-gray-100 ${
          isCollapsed ? "text-center" : ""
        }`}
      >
        <div
          className={`flex items-center gap-3 ${isCollapsed ? "flex-col" : ""}`}
        >
          <div
            className={`flex items-center justify-center shrink-0 rounded-full overflow-hidden ${
              user?.picture
                ? "border-2 border-blue-500/20"
                : "bg-linear-to-r from-blue-500 to-blue-600 text-white"
            } ${
              isCollapsed ? "h-9 w-9" : "h-11 w-11"
            } cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105`}
            onClick={() => navigate("/settings?tab=profile")}
          >
            {user?.picture ? (
              <img
                src={
                  user.picture && user.picture.startsWith("http")
                    ? user.picture
                    : user.picture
                      ? `http://localhost:8000${user.picture}`
                      : "" // Si pas de photo, src vide (le onError prendra le relais)
                }
                alt={user.name}
                // INDISPENSABLE pour Google Photos
                referrerPolicy="no-referrer"
                // Lissage Tailwind v4 (si configuré) ou crochet
                className="h-full w-full object-cover [image-rendering:optimizeQuality]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  // On s'assure que le cercle ne reste pas vide en ajoutant une couleur ou une icône
                  target.parentElement?.classList.add(
                    "bg-slate-200",
                    "flex",
                    "items-center",
                    "justify-center",
                  );
                }}
              />
            ) : (
              <UserIcon className={`${isCollapsed ? "h-4 w-4" : "h-5 w-5"}`} />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex-1 overflow-hidden min-w-0">
              <div
                className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => navigate("/settings?tab=profile")}
              >
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-gray-800 leading-tight">
                    {user?.name}
                  </p>

                  {isAdmin && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur">
                      Admin
                    </span>
                  )}
                </div>
                <p className="break-all whitespace-normal text-[11px] text-gray-500 leading-tight mt-1">
                  {user?.email}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOUTONS DÉCONNEXION (Gardés tels quels) */}
        {!isCollapsed && (
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all mt-3 hover:shadow-md"
          >
            <LogoutIcon className="h-5 w-5" />
            Déconnexion
          </button>
        )}

        {isCollapsed && (
          <button
            onClick={logout}
            className="flex w-full items-center justify-center rounded-xl p-3 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all mt-3 hover:shadow-md"
            title="Déconnexion"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
