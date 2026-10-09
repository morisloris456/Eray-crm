import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { userService } from "../services/users";
import { User } from "../types";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

interface UserContextType {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  fetchUsers: () => Promise<void>;
  createUser: (data: any) => Promise<void>;
  updateUser: (id: number, data: any) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  uploadPicture: (formData: FormData) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // GET ALL USERS (SAFE + TOKEN CHECK)
  const fetchUsers = async () => {
    setLoading(true);
  
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      
    } finally {
      setLoading(false);
    }
  };

  //  CREATE USER (SYNC BACKEND DIRECT)
  const createUser = async (data: any) => {
    try {
      await userService.createUser(data);

      // toujours resync avec backend
      await fetchUsers();

      toast.success("Utilisateur créé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  //  UPDATE USER
  const updateUser = async (id: number, data: any) => {
    try {
      await userService.updateUser(id, data);

      await fetchUsers();

      toast.success("Utilisateur modifié avec succès");
    } catch (error) {
      toast.error("Erreur lors de la modification");
    }
  };

  // DELETE USER
  const deleteUser = async (id: number) => {
    try {
      await userService.deleteUser(id);

      await fetchUsers();

      toast.success("Utilisateur supprimé avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  //  UPLOAD IMAGE
  const uploadPicture = async (formData: FormData) => {
    try {
      const response = await userService.uploadPicture(formData);

      setCurrentUser((prev) =>
        prev ? { ...prev, picture: response.picture } : prev
      );

      toast.success("Image mise à jour");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'image");
    }
  };

  // INIT (SAFE LOAD - only fetch users list if current user is admin)
  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }

    const isAdmin =
      Array.isArray(user.roles) && user.roles.includes("ROLE_ADMIN");

    if (isAdmin) {
      fetchUsers();
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        loading,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        uploadPicture,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

//  HOOK SAFE
export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within UserProvider");
  }
  return context;
};