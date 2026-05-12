// App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./scripts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/auth/login";
import { Register } from "./pages/auth/register";
import { AdminDashboard } from "./pages/home";
import { PlaylistDashboard } from "./pages/playlists/myPlaylists";
import CreatePlaylist from "./pages/playlists/createPlaylist";
import UsersManagementTable from "./pages/users/home";
import ApprovalPage from "./pages/users/approbation";
import { Toaster } from "sonner";
import TelevisionManagement from "./pages/tv/televisionScreen";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Toaster />
      <Routes>
        {/* Routes d'authentification */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout />
            )
          }
        >
          <Route index element={<Login />} />
        </Route>

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout />
            )
          }
        >
          <Route index element={<Register />} />
        </Route>

        {/* Routes protégées */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="dashboard/users">
            <Route index element={<UsersManagementTable />} />
          </Route>

          <Route path="dashboard/verify">
            <Route index element={<ApprovalPage />} />
          </Route>

          <Route path="dashboard/tv">
            <Route index element={<TelevisionManagement />} />
          </Route>

          <Route path="dashboard/playlists">
            {/* <Route index element={<PlaylistDashboard />} /> */}
            {/* <Route path=":playlistId" element={<PlaylistDetails />} />{" "} */}
            {/* Optionnel */}
            <Route path="create" element={<CreatePlaylist />} />
            <Route path="manage" element={<PlaylistDashboard />} />
          </Route>
          {/* Ajoutez d'autres routes protégées ici */}
        </Route>

        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
