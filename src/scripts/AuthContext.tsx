// AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "./fetch.api";

// Types pour l'utilisateur et le contexte d'authentification
type User = {
  firstName: string;
  lastName: string;
  email: string;
  id: string;
  sub?: string;
};

type TV = {
  id: string;
  name: string;
  location?: string;
  isOnline?: boolean;
  model?: string;
  resolution?: string;
  ipAddress?: string;
  currentPlaylist?: {
    id: string;
    name: string;
    mediaCount: number;
    currentMedia: number;
    isPlaying: boolean;
    duration: number;
    type: "image" | "video" | "mixed";
  };
};

type DecodedToken = {
  exp: number;
  iat: number;
  sub: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  TVselected: TV | null;
  login: (email: string, password: string) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  setTVselected: (tv: TV | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [TVselected, setTVselectedState] = useState<TV | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("authToken");
        const storedTV = localStorage.getItem("TVselected");

        if (storedUser && token) {
          // Vérifier si le token n'est pas expiré
          const decoded = jwtDecode<DecodedToken>(token);
          const currentTime = Date.now() / 1000;

          const userData = JSON.parse(storedUser);
          setUser(userData);
          setAccessToken(token);
          setDecodedToken(decoded);

          // Charger la TV sélectionnée si elle existe
          if (storedTV) {
            setTVselectedState(JSON.parse(storedTV));
          }

          // Optionnel: Récupérer les données utilisateur mises à jour
          try {
            const me = await api.get("/auth/me");
          } catch (error) {
            console.log("Erreur lors de la récupération du profil:", error);
          }
        } else {
          // Token expiré, nettoyer les données
          await logout();
        }
      } catch (e) {
        console.log(
          "Erreur lors de la récupération des données utilisateur",
          e
        );
        // En cas d'erreur, nettoyer les données potentiellement corrompues
        // localStorage.removeItem("user");
        // localStorage.removeItem("authToken");
        // localStorage.removeItem("TVselected");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginRespons = await api.post("/auth/login", { email, password });
      const loginResponse = loginRespons.data;
      console.log("🚀 ~ login ~ loginResponse:", loginResponse);

      if (loginResponse?.access_token) {
        localStorage.setItem("authToken", loginResponse.access_token);
        setAccessToken(loginResponse.access_token);

        const decoded = jwtDecode<DecodedToken>(loginResponse.access_token);
        setDecodedToken(decoded);

        const m = await api.get("/auth/me");
        const me = m.data;
        console.log("🚀 ~ login ~ me:", me);

        const userToStore = {
          id: me.sub || me.id,
          firstName: me.firstName,
          lastName: me.lastName,
          email: me.email,
          roles: me.user.roles
        };

        localStorage.setItem("user", JSON.stringify(userToStore));
        setUser({
          ...userToStore,
          sub: me.sub || me.id,
        });

        return { success: true, user: userToStore };
      } else {
        const errorMessage =
          loginResponse?.err || "Identifiant ou mot de passe incorrect";
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Login failed", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Échec de la connexion";

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);

    try {
      const response = await api.post("/auth/register", data);

      if (response) {
        // Auto-login après inscription réussie
        const loginResult = await login(data.email, data.password);
        return loginResult;
      }
    } catch (error: any) {
      console.error("Registration failed", error);

      let errorMessage = "Une erreur est survenue lors de l'inscription";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const setTVselected = (tv: TV | null) => {
    try {
      setTVselectedState(tv);

      if (tv) {
        localStorage.setItem("TVselected", JSON.stringify(tv));
        console.log("🚀 ~ setTVselected ~ TV sélectionnée:", tv.name);
      } else {
        localStorage.removeItem("TVselected");
        console.log("🚀 ~ setTVselected ~ TV désélectionnée");
      }
    } catch (error) {
      console.error(
        "Erreur lors de la sauvegarde de la TV sélectionnée",
        error
      );
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Supprimer toutes les données stockées
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("TVselected");

      // Réinitialiser l'état
      setUser(null);
      setAccessToken(null);
      setDecodedToken(null);
      setTVselectedState(null);

      console.log("🚀 ~ Déconnexion réussie");

    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    accessToken,
    TVselected,
    login,
    register,
    isAuthenticated: !!user,
    logout,
    setTVselected,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
