import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Globe,
  Save,
  Moon,
  Sun,
  LogOut,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

// ==============================
// CONFIGURATION
// ==============================
const THEMES = {
  light: { name: "Clair", icon: Sun },
  dark: { name: "Sombre", icon: Moon },
  auto: { name: "Auto", icon: Globe }
} as const;

type SettingsTab = "profile" | "notifications" | "appearance";
type ThemeType = keyof typeof THEMES;

type NotificationSettings = {
  email: boolean;
  push: boolean;
  newClient: boolean;
  dealUpdate: boolean;
};

const Settings = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving] = useState(false);

  // ==============================
  // PROFILE
  // ==============================
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // ==============================
  // NOTIFICATIONS
  // ==============================
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    newClient: true,
    dealUpdate: true
  });

  // ==============================
  // APPEARANCE
  // ==============================
  const [theme, setTheme] = useState<ThemeType>("auto");

  // ==============================
  // LOAD SETTINGS
  // ==============================
  useEffect(() => {
    const savedSettings = localStorage.getItem("crm_settings");
    const savedUser = localStorage.getItem("crm_user");

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTheme(settings.theme || "auto");
        setNotifications(settings.notifications || notifications);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Erreur lecture settings:", error);
        }
      }
    }

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setName(parsedUser.name || user?.name || "");
        setEmail(parsedUser.email || user?.email || "");
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Erreur lecture user:", error);
        }
      }
    }
  }, [user]);

  // ==============================
  // APPLY THEME
  // ==============================
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  // ==============================
  // AUTO SAVE SETTINGS
  // ==============================
  useEffect(() => {
    const settings = {
      theme,
      notifications
    };
    localStorage.setItem("crm_settings", JSON.stringify(settings));
  }, [theme, notifications]);

  // ==============================
  // HELPERS
  // ==============================
  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // ==============================
  // ACTIONS
  // ==============================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Le nom et l'email sont obligatoires");
      return;
    }

    setIsSaving(true);
    await new Promise((res) => setTimeout(res, 900));

    const updatedUser = {
      ...user,
      name,
      email
    };

    localStorage.setItem("crm_user", JSON.stringify(updatedUser));
    setIsSaving(false);
    toast.success("Profil mis à jour avec succès");
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    toast.success(`Thème ${THEMES[newTheme].name} activé`);
  };

  return (
    <div className="space-y-8 text-left">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200 bg-linear-to-r from-slate-50 to-blue-50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Paramètres</h1>
            <p className="text-slate-600">
              Configurez votre profil et vos préférences CRM
            </p>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition-all hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* MENU LATÉRAL */}
        <div className="w-full lg:w-80">
          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
            {[
              {
                id: "profile",
                label: "Profil",
                icon: User,
                description: "Informations personnelles"
              },
              {
                id: "notifications",
                label: "Notifications",
                icon: Bell,
                description: "Alertes et emails"
              },
              {
                id: "appearance",
                label: "Apparence",
                icon: Globe,
                description: "Thème"
              }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as SettingsTab)}
                className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div
                      className={`text-xs ${
                        activeTab === item.id ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CONTENU */}
        <div className="flex-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {/* PROFILE */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-800">
                    Profil Utilisateur
                  </h2>
                  <p className="text-slate-600">
                    Gérez vos informations personnelles
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Email professionnel
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-blue-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-800">
                    Notifications
                  </h2>
                  <p className="text-slate-600">
                    Choisissez les alertes que vous souhaitez recevoir
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "email" as const, label: "Notifications par email", description: "Recevez des alertes par email" },
                    { key: "push" as const, label: "Notifications push", description: "Alertes dans le navigateur" },
                    { key: "newClient" as const, label: "Nouveaux clients", description: "Quand un client est ajouté" },
                    { key: "dealUpdate" as const, label: "Mises à jour de deals", description: "Changements de statut" }
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-800">{item.label}</h3>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications[item.key] ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications[item.key] ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-2 text-2xl font-bold text-slate-800">
                    Apparence
                  </h2>
                  <p className="text-slate-600">
                    Personnalisez l'apparence de l'interface
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-4 font-semibold text-slate-800">Thème</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {Object.entries(THEMES).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => handleThemeChange(key as ThemeType)}
                          className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                            theme === key
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <value.icon className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{value.name}</div>
                            <div className="text-xs text-slate-500">
                              {key === "auto" ? "Automatique" : key === "dark" ? "Sombre" : "Clair"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
