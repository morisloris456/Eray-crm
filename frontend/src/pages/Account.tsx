import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, Chrome } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/logo-eray.jpg";
import { useGoogleLogin } from "@react-oauth/google";

type TabType = "login" | "register";

const Account = () => {
  const { user, loading, login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabType>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isGoogleSubmitting] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [telephone, setTelephone] = useState("");

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // Note : loginWithGoogle devra peut-être être adapté pour recevoir
      // l'access_token au lieu du credential JWT (voir note plus bas)
      loginWithGoogle(tokenResponse.access_token);
    },
    onError: () => setErrors({ general: "Erreur Google" }),
  });

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const switchTab = (newTab: TabType) => {
    setTab(newTab);
    setErrors({});
    setPassword("");
    setShowPassword(false);

    if (newTab === "login") {
      setName("");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const isValidPhone = (phone: string) => /^[0-9]{10}$/.test(phone);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Veuillez entrer une adresse email valide";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir une majuscule";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir un chiffre";
    }

    if (tab === "register") {
      if (!name.trim()) {
        newErrors.name = "Le nom est requis";
      } else if (name.trim().length < 2) {
        newErrors.name = "Le nom doit contenir au moins 2 caractères";
      }
    
      if (telephone.trim() && !isValidPhone(telephone)) {
        newErrors.telephone =
          "Le téléphone doit contenir exactement 10 chiffres";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});

    if (!validateForm()) return;

    setIsFormSubmitting(true);

    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(name, email, password, telephone);

      }
    } catch (error: any) {
      setErrors({
        general:
          error?.response?.status === 401
            ? "Email ou mot de passe incorrect."
            : "Une erreur est survenue.",
      });
    } finally {
      setIsFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 via-white to-purple-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/40 bg-white/80 p-8 shadow-2xl backdrop-blur-2xl transition-all hover:shadow-3xl">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-linear-to-r from-blue-400 to-cyan-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <img
              src={logo}
              alt="Logo Eray"
              className="relative mx-auto mb-4 h-24 w-24 rounded-full object-cover shadow-2xl ring-4 ring-white/50"
            />
          </div>
          <h2 className="text-3xl font-bold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            CRM Eray
          </h2>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            {tab === "login"
              ? "Accédez à votre espace professionnel"
              : "Rejoignez notre équipe"}
          </p>
        </div>

        <div className="mt-8 flex rounded-2xl bg-linear-to-r from-gray-100 to-gray-200/50 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
              tab === "login"
                ? "bg-linear-to-r from-white to-gray-50 text-indigo-600 shadow-lg transform scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => switchTab("register")}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
              tab === "register"
                ? "bg-linear-to-r from-white to-gray-50 text-indigo-600 shadow-lg transform scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Inscription
          </button>
        </div>

        {errors.general && (
          <div className="mt-4 rounded-2xl border border-red-200/50 bg-red-50/80 px-4 py-3 text-sm text-red-600 shadow-lg backdrop-blur-sm animate-shake">
            {errors.general}
          </div>
        )}

        <div className="mt-6 flex w-full justify-center">
          <button
            onClick={() => googleLogin()}
            disabled={isGoogleSubmitting || isFormSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200/50 bg-linear-to-r from-white to-gray-50 py-3.5 font-semibold text-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Chrome className="h-5 w-5" />
            )}
            Continuer avec Google
          </button>
        </div>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <span className="px-4 text-xs font-medium text-gray-500 bg-white/80 rounded-full">
            ou
          </span>
          <div className="flex-1 border-t border-gradient-to-r from-gray-300 via-transparent to-transparent"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div className="space-y-2">
              <label className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                 Nom d'utilisateur
              </label>
              <input
                type="text"
                placeholder="Votre username"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-2xl border bg-white/60 px-4 py-3.5 outline-none transition-all duration-300 focus:ring-2 focus:ring-offset-2 ${
                  errors.name
                    ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                    : "border-gray-200/50 focus:border-indigo-400 focus:ring-indigo-200/50"
                }`}
              />
              {errors.name && (
                <p className="ml-2 mt-1 text-xs font-medium text-red-500 animate-fade-in">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          {tab === "register" && (
            <div className="space-y-2">
              <label className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                Téléphone (optionnel)
              </label>

              <input
                type="text"
                placeholder="votre telephone"
                value={telephone}
                onChange={(e) =>
                  setTelephone(e.target.value.replace(/\D/g, ""))
                }
                className={`w-full rounded-2xl border bg-white/60 px-4 py-3.5 outline-none transition-all duration-300 focus:ring-2 focus:ring-offset-2 ${
                  errors.telephone
                    ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                    : "border-gray-200/50 focus:border-indigo-400 focus:ring-indigo-200/50"
                }`}
                maxLength={10}
              />

              {errors.telephone && (
                <p className="ml-2 mt-1 text-xs font-medium text-red-500 animate-fade-in">
                  {errors.telephone}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-2xl border bg-white/60 px-4 py-3.5 outline-none transition-all duration-300 focus:ring-2 focus:ring-offset-2 ${
                errors.email
                  ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                  : "border-gray-200/50 focus:border-indigo-400 focus:ring-indigo-200/50"
              }`}
            />
            {errors.email && (
              <p className="ml-2 mt-1 text-xs font-medium text-red-500 animate-fade-in">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-700">
               Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full rounded-2xl border bg-white/60 px-4 py-3.5 pr-12 outline-none transition-all duration-300 focus:ring-2 focus:ring-offset-2 ${
                  errors.password
                    ? "border-red-400 focus:ring-red-200 focus:border-red-500"
                    : "border-gray-200/50 focus:border-indigo-400 focus:ring-indigo-200/50"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="ml-2 mt-1 text-xs font-medium text-red-500 animate-fade-in">
                {errors.password}
              </p>
            )}
            {tab === "register" && (
              <p className="ml-2 mt-1 text-xs text-gray-500 font-medium">
                6 caractères minimum, 1 majuscule, 1 chiffre
              </p>
            )}
          </div>

         
          <button
            type="submit"
            disabled={isFormSubmitting || isGoogleSubmitting}
            className="flex w-full items-center justify-center rounded-2xl bg-linear-to-r from-indigo-600 to-blue-600 py-4 font-bold text-white shadow-xl shadow-indigo-200/50 transition-all duration-300 hover:from-indigo-700 hover:to-blue-700 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFormSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : tab === "login" ? (
              "Se connecter"
            ) : (
              "Créer un compte"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Account;
