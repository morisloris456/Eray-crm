import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Globe,
  Save,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Briefcase,
  Star,
  Shield,
  Edit3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useRef } from "react";
import { authService } from "../services/auth";
import { userService } from "../services/users";
import { Settings as SettingsIcon } from "lucide-react";
// ==============================
// CONFIGURATION
// ==============================
const THEMES = {
  light: { name: "Clair", icon: Sun },
  dark: { name: "Sombre", icon: Moon },
  auto: { name: "Auto", icon: Globe },
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
  const { user, logout, setUser } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ==============================
  // HANDLE URL PARAMS
  // ==============================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") as SettingsTab;
    if (tab && ["profile", "notifications", "appearance"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // ==============================
  // PROFILE
  // ==============================
  const getInitialUserData = () => {
    const savedUser = localStorage.getItem("crm_user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        return {
          name: parsedUser.name || user?.name || "",
          email: parsedUser.email || user?.email || "",
          telephone: parsedUser.telephone || user?.telephone || "",
        };
      } catch {
        return {
          name: user?.name || "",
          email: user?.email || "",
          telephone: user?.telephone || "",
        };
      }
    }

    return {
      name: user?.name || "",
      email: user?.email || "",
      telephone: user?.telephone || "",
    };
  };

  const initialData = getInitialUserData();
  // Remplace tes 3 states actuels par ceci :
  const [name, setName] = useState(() => getInitialUserData().name);
  const [email, setEmail] = useState(() => getInitialUserData().email);
  const [telephone, setTelephone] = useState(
    () => getInitialUserData().telephone,
  );

  useEffect(() => {
    if (user && !name && !email) {
      // On ne remplit que si c'est vide
      setName(user.name || "");
      setEmail(user.email || "");
      setTelephone(user.telephone || "");
    }
  }, [user]);

  // ==============================
  // NOTIFICATIONS
  // ==============================
  const getInitialNotifications = (): NotificationSettings => {
    const savedSettings = localStorage.getItem("crm_settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return (
          settings.notifications || {
            email: true,
            push: true,
            newClient: true,
            dealUpdate: true,
          }
        );
      } catch {
        return {
          email: true,
          push: true,
          newClient: true,
          dealUpdate: true,
        };
      }
    }
    return {
      email: true,
      push: true,
      newClient: true,
      dealUpdate: true,
    };
  };

  const [notifications, setNotifications] = useState<NotificationSettings>(
    getInitialNotifications(),
  );

  // ==============================
  // APPEARANCE
  // ==============================
  const getInitialTheme = (): ThemeType => {
    const savedSettings = localStorage.getItem("crm_settings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        return settings.theme || "light";
      } catch {
        return "light";
      }
    }
    return "light";
  };

  const [theme, setTheme] = useState<ThemeType>(getInitialTheme());

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
      notifications,
    };
    localStorage.setItem("crm_settings", JSON.stringify(settings));
  }, [theme, notifications]);

  // ==============================
  // HELPERS
  // ==============================
  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ==============================
  // ACTIONS
  // ==============================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 🔒 VALIDATION NUMÉRO
      const cleanPhone = telephone.replace(/\s+/g, ""); // enlève espaces

      if (!/^\d*$/.test(cleanPhone)) {
        toast.error("Le numéro doit contenir uniquement des chiffres");
        setIsSaving(false);
        return;
      }

      if (cleanPhone.length > 10) {
        toast.error("Le numéro doit contenir exactement 10 chiffres");
        setIsSaving(false);
        return;
      }

      await authService.updateProfile({
        name,
        email,
        telephone: cleanPhone,
      });

      const refreshedUser = await userService.getMe();

      if (!refreshedUser) {
        throw new Error("User not returned from API");
      }

      setUser(refreshedUser);
      localStorage.setItem("crm_user", JSON.stringify(refreshedUser));

      toast.success("Profil mis à jour !");
    } catch (error) {
      console.error("PROFILE UPDATE ERROR:", error);
      toast.error("Erreur de mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    toast.success(`Thème ${THEMES[newTheme].name} activé`);
  };

  return (
    <div className="space-y-8 text-left">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-linear-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm sm:p-8">
        {/* Halos de couleur floutés */}
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            {/* Le petit badge bleu ajouté ici */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur">
              <SettingsIcon className="h-3.5 w-3.5" />
              Configuration Réglages
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-800">
              Paramètres
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base font-medium">
              Configurez votre profil et vos préférences.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition-all hover:-translate-y-0.5 hover:bg-red-100 active:scale-[0.98] shadow-sm shadow-red-100/40"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-8 ">
        {/* MENU LATÉRAL */}
        <div className="w-full">
          <div className="flex flex-row gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm overflow-x-auto">
            {[
              {
                id: "profile",
                label: "Profil",
                icon: User,
                description: "Informations personnelles",
              },

              {
                id: "appearance",
                label: "Apparence",
                icon: Globe,
                description: "Thème",
              },
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
                        activeTab === item.id
                          ? "text-blue-100"
                          : "text-slate-400"
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
                    Gérez vos informations personnelles et votre présence
                    professionnelle
                  </p>
                </div>

                {/* HEADER PROFIL AMÉLIORÉ */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]" />
                  <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8">
                    {/* Changé lg:items-start en lg:items-center pour un meilleur alignement vertical sur desktop */}

                    {/* Photo de profil avec Input caché */}
                    <div className="relative group shrink-0">
                      {/* 1. L'input modifié */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // 1. AFFICHAGE DE L'APERÇU (Visuel immédiat)
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setPreviewImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);

                            // 2. PRÉPARATION ET ENVOI AU BACKEND
                            const formData = new FormData();
                            formData.append("image", file);

                            try {
                              setIsSaving(true);

                              // Utilisation du service authService pour l'upload
                              const response =
                                await authService.uploadPicture(formData);

                              // On récupère l'URL renvoyée par Symfony (ex: /uploads/profiles/xxx.jpg)
                              const newPictureUrl = response.picture;

                              // 3. MISE À JOUR DU LOCALSTORAGE (Pour la persistance au refresh)
                              const storedUser = JSON.parse(
                                localStorage.getItem("crm_user") || "{}",
                              );
                              const updatedUser = {
                                ...storedUser,
                                picture: newPictureUrl,
                              };
                              localStorage.setItem(
                                "crm_user",
                                JSON.stringify(updatedUser),
                              );

                              // 4. MISE À JOUR DU CONTEXTE (Pour mettre à jour l'UI globalement)
                              // Si tu as 'setUser' via useAuth(), décommente la ligne suivante :
                              setUser(updatedUser);

                              toast.success("Photo de profil mise à jour !");
                            } catch (error) {
                              console.error("Erreur upload:", error);
                              toast.error(
                                "Erreur lors de la sauvegarde de l'image",
                              );
                              setPreviewImage(null); // On annule l'aperçu si le serveur refuse
                            } finally {
                              setIsSaving(false);
                            }
                          }
                        }}
                      />

                      {/* 2. L'affichage de l'image modifié */}
                      <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                        {/* On vérifie d'abord previewImage, puis user.picture */}
                        {previewImage || user?.picture ? (
                          <img
                            src={
                              previewImage
                                ? previewImage
                                : user?.picture?.startsWith("/uploads")
                                  ? `http://localhost:8000${user.picture}`
                                  : user?.picture // Ici, c'est l'URL complète (https://lh3.google...)
                            }
                            alt="Profil"
                            // Empêche Google de bloquer l'image sur localhost
                            referrerPolicy="no-referrer"
                            //  Pour que la miniature soit moins "dure"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 [image-rendering:optimizeQuality]"
                            onError={(e) => {
                              // Optionnel : si l'image ne charge vraiment pas, on peut remettre une icône par défaut
                              (e.target as HTMLImageElement).src =
                                "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white">
                            <User className="h-16 w-16" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex h-full w-full items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </button>
                      </div>

                      <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 border-4 border-white shadow-lg">
                        <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                      </div>
                    </div>

                    {/* Infos principales */}
                    <div className="flex flex-col items-center flex-1 text-center lg:items-start lg:text-left">
                      {/* Ajout de flex flex-col items-center pour forcer le centrage des textes */}
                      <div className="mb-3">
                        <h3 className="text-2xl font-bold text-slate-800">
                          {name || "Utilisateur"}
                        </h3>
                        <p className="text-slate-600">
                          {email || "email@example.com"}
                        </p>
                      </div>
                      {/* ROLE BADGE */}
                      <div className="mt-2 flex items-center justify-center lg:justify-start">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${
                            user?.roles?.includes("ROLE_ADMIN")
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-emerald-300 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {user?.roles?.includes("ROLE_ADMIN")
                            ? "Administrateur"
                            : "Utilisateur"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INFORMATIONS MODIFIABLES */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        Informations personnelles
                      </h3>
                      <p className="text-sm text-slate-500">
                        Modifiez directement vos informations
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSaveProfile}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                  >
                    {/* NOM */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <User className="h-4 w-4" />
                        Nom d'utilisateur
                      </div>

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Votre nom"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Mail className="h-4 w-4" />
                        Email professionnel
                      </div>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Votre email"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    {/* TELEPHONE */}
                    <div className="space-y-2 ">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </div>

                      <input
                        type="text"
                        value={telephone}
                        onChange={(e) => setTelephone(e.target.value)}
                        placeholder="votre telephone"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    {/* BOUTON SAVE */}
                    <div className="lg:col-span-2 flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-[1.02] disabled:opacity-60"
                      >
                        {isSaving ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <Save className="h-5 w-5" />
                        )}
                        Sauvegarder
                      </button>
                    </div>
                  </form>
                </div>
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
                    {
                      key: "email" as const,
                      label: "Notifications par email",
                      description: "Recevez des alertes par email",
                    },
                    {
                      key: "push" as const,
                      label: "Notifications push",
                      description: "Alertes dans le navigateur",
                    },
                    {
                      key: "newClient" as const,
                      label: "Nouveaux clients",
                      description: "Quand un client est ajouté",
                    },
                    {
                      key: "dealUpdate" as const,
                      label: "Mises à jour de deals",
                      description: "Changements de statut",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {item.label}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications[item.key]
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications[item.key]
                              ? "translate-x-5"
                              : "translate-x-0.5"
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
                              {key === "auto"
                                ? "Automatique"
                                : key === "dark"
                                  ? "Sombre"
                                  : "Clair"}
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
