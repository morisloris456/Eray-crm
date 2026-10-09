import { useState } from "react";
import { useUsers } from "../context/UserContext";
import { Trash2, User as UserIcon, Phone, Edit3 } from "lucide-react";

const ALL_ROLES = ["ROLE_USER", "ROLE_ADMIN"];

const UsersPage = () => {
  const { users, loading, deleteUser, updateUser } = useUsers();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("ROLE_USER");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setSelectedRole(
      user.roles.includes("ROLE_ADMIN") ? "ROLE_ADMIN" : "ROLE_USER"
    );
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    await updateUser(selectedUser.id, {
      roles: [selectedRole],
    });

    setOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    await deleteUser(userToDelete.id);
    setDeleteModal(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();
    const matchSearch =
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query);
    const isAdmin = user.roles.includes("ROLE_ADMIN");
    const matchRole =
      roleFilter === "ALL" ||
      (roleFilter === "ADMIN" && isAdmin) ||
      (roleFilter === "USER" && !isAdmin);

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-linear-to-br from-white via-slate-50 to-blue-50 p-6 shadow-sm sm:p-8">
          {/* Halos de couleur floutés */}
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-indigo-100/30 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Partie gauche : Titres et Badge */}
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 backdrop-blur">
                <UserIcon className="h-3.5 w-3.5" />
                Administration
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-slate-800">
                Gestion des utilisateurs
              </h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base font-medium">
                Surveillez, modifiez et supprimez les comptes depuis votre
                interface de contrôle.
              </p>
            </div>

            {/* Partie droite : Barre de recherche & Filtres de rôles */}
            <div className="flex flex-wrap items-center gap-3 z-10">
              {/* Recherche d'utilisateur */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Rechercher par nom, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white/90 pl-4 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Filtre : Tous */}
              <button
                type="button"
                onClick={() => setRoleFilter("ALL")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  roleFilter === "ALL"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tous
              </button>

              {/* Filtre : Utilisateurs */}
              <button
                type="button"
                onClick={() => setRoleFilter("USER")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  roleFilter === "USER"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Utilisateurs
              </button>

              {/* Filtre : Admins */}
              <button
                type="button"
                onClick={() => setRoleFilter("ADMIN")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  roleFilter === "ADMIN"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Admins
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-800">
              Liste des utilisateurs
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredUsers.length} utilisateur(s) affiché(s)
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-6 py-14">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-14 text-center text-gray-500">
              Aucun utilisateur trouvé.
            </div>
          ) : (
        <div className="overflow-x-auto">
              <table className="min-w-full w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="px-6 py-4">Utilisateur</th>
                    <th className="px-6 py-4">Rôle</th>
                    <th className="px-6 py-4">Téléphone</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const isAdmin = user.roles.includes("ROLE_ADMIN");
                    const avatarSrc = user.picture
                      ? user.picture.startsWith("http")
                        ? user.picture
                        : `http://localhost:8000${user.picture}`
                      : undefined;

                    return (
                      <tr
                        key={user.id}
                        className="group hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
                              {avatarSrc ? (
                                <img
                                  src={avatarSrc}
                                  alt={user.name}
                                  className="h-12 w-12 rounded-2xl object-cover"
                                />
                              ) : (
                                <UserIcon className="h-6 w-6" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              isAdmin
                                ? "bg-blue-50 text-blue-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {isAdmin ? "ADMIN" : "USER"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Phone size={14} />
                            {user.telephone || "Non renseigné"}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="rounded-xl p-2 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-600"
                              aria-label={`Modifier ${user.name}`}
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="rounded-xl p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
                              aria-label={`Supprimer ${user.name}`}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {open && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Modifier le rôle de {selectedUser.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Choisissez un rôle puis appliquez les modifications.
            </p>

            <div className="mt-6 space-y-3">
              {ALL_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition hover:border-blue-300"
                >
                  <input
                    type="radio"
                    name="role"
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="h-4 w-4 text-blue-600 ring-blue-500"
                  />
                  <span className="font-medium text-gray-700">{role}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirmer la suppression
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Voulez-vous vraiment supprimer cet utilisateur ?
            </p>
            <div className="mt-4 rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {userToDelete.name}
              </p>
              <p className="text-sm text-gray-500">{userToDelete.email}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
