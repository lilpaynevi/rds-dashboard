// pages/auth/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/scripts/AuthContext";
import { toast } from "sonner";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simuler la connexion - remplacez par votre API
      var connexion = await login(email, password);
      console.log("🚀 ~ handleSubmit ~ connexion:", connexion);

      // if (connexion && connexion.roles === "ADMIN") {
      //   toast(`Bienvenue ${connexion.firstName} ${connexion.lastName}`, {
      //     // action: {
      //     //   label: "Undo",
      //     //   onClick: () => console.log("Undo"),
      //     // },
      //   });
      //   navigate("/dashboard");
      // }
    } catch (error) {
      toast("Email ou mot de passe incorrect", {
        description: "Veuillez réessayez !",
        // action: {
        //   label: "Undo",
        //   onClick: () => console.log("Undo"),
        // },
      });
      // console.error("Erreur de connexion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Connexion</h2>
        <p className="text-sm text-muted-foreground">
          Connectez-vous à votre compte
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>

      {/* <div className="text-center text-sm">
        <span className="text-muted-foreground">Pas de compte ? </span>
        <Link 
          to="/register" 
          className="text-primary hover:underline font-medium"
        >
          Créer un compte
        </Link>
      </div> */}
    </div>
  );
}
