import { Outlet } from "react-router-dom";
import { Monitor } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panneau marque */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Monitor className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">RDS Connect</span>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Gérez vos écrans TV
              <br />
              intelligemment.
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/75">
              Centralisez la gestion de toutes vos télévisions et playlists depuis un seul endroit.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-primary-foreground/65 mt-1">Disponible</div>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
              <div className="text-2xl font-bold">HD</div>
              <div className="text-xs text-primary-foreground/65 mt-1">Qualité</div>
            </div>
            <div className="rounded-xl bg-primary-foreground/10 p-4 text-center">
              <div className="text-2xl font-bold">∞</div>
              <div className="text-xs text-primary-foreground/65 mt-1">Écrans</div>
            </div>
          </div>
        </div>

        <p className="text-sm text-primary-foreground/50">
          © 2025 RDS Connect. Tous droits réservés.
        </p>
      </div>

      {/* Panneau formulaire */}
      <div className="flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Monitor className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">RDS Connect</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
