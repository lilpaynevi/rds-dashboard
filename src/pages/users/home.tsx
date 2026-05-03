"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Monitor,
  List,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  UserCheck,
  UserX,
  Crown,
  Key,
  Building2,
  MapIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/scripts/fetch.api";

// Types basés sur le schéma Prisma
interface User {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  department?: string;
  city?: string;
  email: string;
  role: "ADMIN" | "USER" | "VIEWER";
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  isVerify: boolean;
  _count?: {
    televisions: number;
    playlists: number;
    medias: number;
    schedules: number;
  };
  televisions?: Television[];
  playlists?: Playlist[];
}

interface Television {
  id: string;
  name: string;
  deviceId?: string;
  location?: string;
  description?: string;
  resolution: "HD_720P" | "HD_1080P" | "UHD_4K";
  orientation: "LANDSCAPE" | "PORTRAIT";
  status: "ONLINE" | "OFFLINE" | "PLAYING" | "PAUSED" | "ERROR";
  volume: number;
  autoPlay: boolean;
  loop: boolean;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
  codeConnection: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  shuffleMode: boolean;
  repeatMode: "NONE" | "LOOP" | "REPEAT_ONE";
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
    televisions: number;
  };
}

interface UserFormData {
  firstName: string;
  lastName: string;
  company: string;
  department: string;
  city: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER" | "VIEWER";
  phone: string;
  isActive: boolean;
}

export default function UsersManagementTable() {
  // États
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialogs & Sheets
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    company: "",
    department: "",
    city: "",
    email: "",
    password: "",
    role: "USER",
    phone: "",
    isActive: true,
  });

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`.trim();
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      ADMIN: "destructive",
      USER: "default",
      VIEWER: "secondary",
    } as const;

    const labels = {
      ADMIN: "Admin",
      USER: "Utilisateur",
      VIEWER: "Visualiseur",
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || "default"}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="secondary">Inactif</Badge>;
    }
    if (!user.isVerify) {
      return <Badge variant="destructive">Non vérifié</Badge>;
    }
    return <Badge variant="secondary">Actif</Badge>;
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      company: "",
      department: "",
      city: "",
      email: "",
      password: "",
      role: "USER",
      phone: "",
      isActive: true,
    });
  };

  // Chargement des utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");

      if (!response.data) throw new Error("Erreur lors du chargement");

      setUsers(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage et tri
  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          getFullName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        switch (statusFilter) {
          case "active":
            return user.isActive && user.isVerify;
          case "inactive":
            return !user.isActive;
          case "unverified":
            return !user.isVerify;
          default:
            return true;
        }
      });
    }

    // Filtre par rôle
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof User];
      let bValue: any = b[sortBy as keyof User];

      if (sortBy === "fullName") {
        aValue = getFullName(a);
        bValue = getFullName(b);
      } else if (sortBy === "televisionsCount") {
        aValue = a._count?.televisions || 0;
        bValue = b._count?.televisions || 0;
      } else if (sortBy === "playlistsCount") {
        aValue = a._count?.playlists || 0;
        bValue = b._count?.playlists || 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  // Actions CRUD
  const handleAddUser = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const response = await api.post("/users", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company || null,
        department: formData.department || null,
        city: formData.city || null,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || null,
        isActive: formData.isActive,
      });

      if (!response) {
        throw new Error("Erreur lors de la création");
      }

      toast.success("Utilisateur créé avec succès");
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.message || "Erreur lors de la création de l'utilisateur"
      );
    }
  };

  const handleEditUser = async () => {
    if (
      !selectedUser ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company || null,
        department: formData.department || null,
        city: formData.city || null,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || null,
        isActive: formData.isActive,
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await api.patch(`/users/${selectedUser.id}`, updateData);

      if (!response) {
        throw new Error("Erreur lors de la mise à jour");
      }

      toast.success("Utilisateur modifié avec succès");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.message || "Erreur lors de la modification de l'utilisateur"
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await api.delete(`/users/${selectedUser.id}`);

      if (!response) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success("Utilisateur supprimé avec succès");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error.message || "Erreur lors de la suppression de l'utilisateur"
      );
    }
  };

  // Actions rapides
  const handleToggleStatus = async (user: User) => {
    try {
      const response = await api.patch(`/users/${user.id}`, {
        isActive: !user.isActive,
      });

      if (!response) throw new Error("Erreur lors de la mise à jour");

      toast.success(
        `Utilisateur ${!user.isActive ? "activé" : "désactivé"} avec succès`
      );
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleChangeRole = async (user: User, newRole: string) => {
    try {
      const response = await api.patch(`/users/${user.id}`, {
        role: newRole,
      });

      if (!response) throw new Error("Erreur lors de la mise à jour");

      toast.success(`Rôle modifié avec succès`);
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  // Handlers pour les dialogs
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company || "",
      department: user.department || "",
      city: user.city || "",
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const openViewSheet = async (user: User) => {
    try {
      // Récupérer les détails complets de l'utilisateur avec les relations
      const response = await api.get(`/users/${user.id}`);

      if (!response) throw new Error("Erreur lors du chargement");

      const userData = response.data
      setSelectedUser(userData);
      setIsViewSheetOpen(true);
    } catch (error) {
      toast.error("Erreur lors du chargement des détails");
    }
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 p-0 font-semibold hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === field &&
          (sortOrder === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
        {sortBy !== field && <ArrowUpDown className="h-3 w-3 opacity-50" />}
      </div>
    </Button>
  );

  // Export CSV
  const exportToCSV = () => {
    const csvContent = [
      // Headers
      [
        "Prénom",
        "Nom",
        "Email",
        "Entreprise",
        "Département",
        "Ville",
        "Téléphone",
        "Rôle",
        "Statut",
        "Vérifié",
        "Télévisions",
        "Playlists",
        "Créé le",
        "Dernière connexion",
      ].join(","),
      // Data
      ...filteredUsers.map((user) =>
        [
          user.firstName,
          user.lastName,
          user.email,
          user.company || "",
          user.department || "",
          user.city || "",
          user.phone || "",
          user.role,
          user.isActive ? "Actif" : "Inactif",
          user.isVerify ? "Oui" : "Non",
          user._count?.televisions || 0,
          user._count?.playlists || 0,
          formatDate(user.createdAt),
          user.lastLogin ? formatDate(user.lastLogin) : "Jamais",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `users_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Effets
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestion des utilisateurs
          </h2>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs de la plateforme
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right text-sm">
            <div className="font-semibold">
              {filteredUsers.length} utilisateurs
            </div>
            <div className="text-muted-foreground">
              {users.filter((u) => u.isActive).length} actifs
            </div>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                  <SelectItem value="unverified">Non vérifiés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="ADMIN">Administrateurs</SelectItem>
                  <SelectItem value="USER">Utilisateurs</SelectItem>
                  <SelectItem value="VIEWER">Visualiseurs</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setRoleFilter("all");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>

              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="min-w-[200px]">
                  <SortButton field="fullName">Utilisateur</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="email">Email</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="company">Entreprise</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="role">Rôle</SortButton>
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">
                  <SortButton field="televisionsCount">TVs</SortButton>
                </TableHead>
                <TableHead className="text-center">
                  <SortButton field="playlistsCount">Playlists</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="lastLogin">Dernière connexion</SortButton>
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell>{index + 1}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={
                            user.avatar
                              ? `/uploads/media/${user.avatar}`
                              : undefined
                          }
                        />
                        <AvatarFallback>
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getFullName(user)}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.department && <span>{user.department}</span>}
                          {user.city && (
                            <span className="flex items-center gap-1 mt-1">
                              <MapIcon className="h-3 w-3" />
                              {user.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1">
                        {user.email}
                        {user.isVerify ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {user.company ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {user.company}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>{getRoleBadge(user.role)}</TableCell>

                  <TableCell>{getStatusBadge(user)}</TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {user.televisions?.length || 0}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {user.televisions?.length || 0}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {user.lastLogin ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDate(user.lastLogin)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Jamais</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openViewSheet(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        {user.role !== "ADMIN" && (
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(user, "ADMIN")}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Promouvoir Admin
                          </DropdownMenuItem>
                        )}
                        {user.role === "ADMIN" && (
                          <DropdownMenuItem
                            onClick={() => handleChangeRole(user, "USER")}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Rétrograder
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || roleFilter !== "all"
                  ? "Essayez de modifier les filtres de recherche"
                  : "Commencez par ajouter votre premier utilisateur"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Ajouter un utilisateur */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Créez un nouveau compte utilisateur pour la plateforme.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informations de base</TabsTrigger>
              <TabsTrigger value="details">Détails du profil</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-firstName">Prénom *</Label>
                  <Input
                    id="add-firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="add-lastName">Nom *</Label>
                  <Input
                    id="add-lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <Label htmlFor="add-password">Mot de passe *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Utilisateur</SelectItem>
                      <SelectItem value="VIEWER">Visualiseur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="add-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="add-isActive">Compte actif</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="add-phone">Téléphone</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-company">Entreprise</Label>
                  <Input
                    id="add-company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Mon Entreprise"
                  />
                </div>
                <div>
                  <Label htmlFor="add-department">Département</Label>
                  <Input
                    id="add-department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="IT, Marketing, RH..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="add-city">Ville</Label>
                <Input
                  id="add-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Paris, Lyon, Marseille..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleAddUser}>
              <Plus className="h-4 w-4 mr-2" />
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier un utilisateur */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de{" "}
              {selectedUser ? getFullName(selectedUser) : "l'utilisateur"}.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informations de base</TabsTrigger>
              <TabsTrigger value="details">Détails du profil</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">Prénom *</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Nom *</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <Label htmlFor="edit-password">Nouveau mot de passe</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Laisser vide pour ne pas changer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Laissez vide si vous ne souhaitez pas changer le mot de passe
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Utilisateur</SelectItem>
                      <SelectItem value="VIEWER">Visualiseur</SelectItem>
                      <SelectItem value="ADMIN">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="edit-isActive">Compte actif</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-company">Entreprise</Label>
                  <Input
                    id="edit-company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    placeholder="Mon Entreprise"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-department">Département</Label>
                  <Input
                    id="edit-department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="IT, Marketing, RH..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-city">Ville</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Paris, Lyon, Marseille..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleEditUser}>
              <Settings className="h-4 w-4 mr-2" />
              Sauvegarder les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet Détails utilisateur */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent className=" p-4 w-[600px] max-w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Détails de l'utilisateur</SheetTitle>
            <SheetDescription>
              Informations complètes et ressources associées
            </SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-6 mt-6">
              {/* Profil */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={
                          selectedUser.avatar
                            ? `/uploads/media/${selectedUser.avatar}`
                            : undefined
                        }
                      />
                      <AvatarFallback className="text-lg">
                        {selectedUser.firstName[0]}
                        {selectedUser.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {getFullName(selectedUser)}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedUser.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getRoleBadge(selectedUser.role)}
                        {getStatusBadge(selectedUser)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informations personnelles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.company}</span>
                    </div>
                  )}
                  {selectedUser.department && (
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.department}</span>
                    </div>
                  )}
                  {selectedUser.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Créé le {formatDate(selectedUser.createdAt)}
                    </span>
                  </div>
                  {selectedUser.lastLogin && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Dernière connexion :{" "}
                        {formatDate(selectedUser.lastLogin)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {/* {JSON.stringify(selectedUser)} */}
                          {
                            selectedUser.televisions?.length || 0
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Télévisions
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <List className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">
                          {selectedUser.playlists?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Playlists
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Télévisions */}
              {selectedUser.televisions &&
                selectedUser.televisions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Télévisions ({selectedUser.televisions.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedUser.televisions.map((tv) => (
                        <div
                          key={tv.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Monitor className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{tv.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {tv.location} •{" "}
                                {tv.resolution.replace("_", " ")} •{" "}
                                {tv.orientation}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              tv.status === "ONLINE"
                                ? "default"
                                : tv.status === "PLAYING"
                                ? "default"
                                : tv.status === "ERROR"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {tv.status}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

              {/* Playlists */}
              {selectedUser.playlists && selectedUser.playlists.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      Playlists ({selectedUser.playlists.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUser.playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <List className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{playlist.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {playlist._count?.items || 0} médias •{" "}
                              {playlist.repeatMode}
                              {playlist.shuffleMode && " • Shuffle"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {playlist.isDefault && (
                            <Badge variant="outline">Défaut</Badge>
                          )}
                          {playlist.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(selectedUser)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleToggleStatus(selectedUser)}
                  className="flex-1"
                >
                  {selectedUser.isActive ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activer
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUser.id);
                    toast.success("ID utilisateur copié");
                  }}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog Confirmation suppression */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong>{selectedUser ? getFullName(selectedUser) : ""}</strong> ?
              <br />
              Cette action est irréversible et supprimera également toutes les
              données associées (télévisions, playlists, médias, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
