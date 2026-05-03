"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Monitor,
  Wifi,
  WifiOff,
  Play,
  Pause,
  MoreHorizontal,
  Clock,
  MapPin,
  Power,
  Settings,
  Volume2,
  Search,
  Users,
  Shuffle,
  Repeat,
  Code,
  List,
  User,
  Shield,
  Calendar,
  Filter,
  RefreshCw,
  Trash2,
  Edit,
  Building2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/scripts/fetch.api";

// Types
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  department?: string;
  city?: string;
  phone?: string;
  avatar?: string;
  role: string;
  roles: string;
  isActive: boolean;
  isVerify: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  televisions: Television[];
  playlists: Playlist[];
  _count: {
    medias: number;
    televisions: number;
    playlists: number;
  };
  isAdmin?: boolean;
}

interface Television {
  id: string;
  name: string;
  deviceId?: string;
  location?: string;
  description?: string;
  resolution: string;
  orientation: string;
  status: "ONLINE" | "OFFLINE" | "CONNECTING";
  volume: number;
  autoPlay: boolean;
  loop: boolean;
  transition: string;
  refreshRate: number;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
  codeConnection: string;
  userId: string;
  playlists: TelevisionPlaylist[];
}

interface TelevisionPlaylist {
  id: string;
  isActive: boolean;
  priority: number;
  assignedAt: string;
  playlistId: string;
  televisionId: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  shuffleMode: boolean;
  repeatMode: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  items: PlaylistItem[];
}

interface PlaylistItem {
  id: string;
  order: number;
  duration?: number;
  createdAt: string;
  playlistId: string;
  mediaId: string;
  media: Media;
}

interface Media {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  s3Key: string;
  s3Url: string;
  mimeType: string;
  fileSize: number;
  duration?: number;
  type: "IMAGE" | "VIDEO";
  width?: number;
  height?: number;
  thumbnail?: string;
  status: string;
  priority: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  _count: {
    playlistItems: number;
    schedules: number;
  };
}

interface AdminDashboardProps {
  className?: string;
}

export function AdminDashboard({ className }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [allTelevisions, setAllTelevisions] = useState<Television[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Chargement des données
  const fetchData = async () => {
    try {
      const [usersResponse, televisionsResponse] = await Promise.all([
        api.get("/users"),
        api.get("/televisions"),
      ]);

      if (usersResponse) {
        // Ajout de la propriété isAdmin basée sur le role
        const usersWithAdmin = usersResponse.data.map((user: User) => ({
          ...user,
        }));
        setUsers(usersWithAdmin);
      }

      if (televisionsResponse) {
        setAllTelevisions(televisionsResponse.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  const getActivePlaylist = (tv: Television): TelevisionPlaylist | null => {
    const activePlaylists = tv.playlists.filter((p) => p.isActive);
    if (activePlaylists.length === 0) return null;
    return activePlaylists.reduce((highest, current) =>
      current.priority > highest.priority ? current : highest
    );
  };

  // Extraction des valeurs uniques pour les filtres
  const uniqueCompanies = Array.from(
    new Set(users.map((u) => u.company).filter(Boolean))
  );
  const uniqueDepartments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  );

  // Filtrage des données
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase());

    if (userFilter === "admins" && !user.isAdmin) return false;
    if (userFilter === "users" && user.isAdmin) return false;

    if (companyFilter !== "all" && user.company !== companyFilter) return false;
    if (departmentFilter !== "all" && user.department !== departmentFilter)
      return false;

    return matchesSearch;
  });

  const filteredTelevisions = allTelevisions.filter((tv) => {
    const matchesSearch =
      tv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tv.location?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter !== "all" && tv.status.toLowerCase() !== statusFilter)
      return false;

    return matchesSearch;
  });

  // Groupement des utilisateurs par company/département
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    let groupKey = "Sans société";

    if (companyFilter !== "all") {
      groupKey = user.company || "Sans société";
    } else if (departmentFilter !== "all") {
      groupKey = user.department || "Sans département";
    } else {
      groupKey = user.company || "Sans société";
    }

    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(user);
    return acc;
  }, {} as Record<string, typeof filteredUsers>);

  // Stats globales
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.isAdmin).length;
  const totalTelevisions = allTelevisions.length;
  const onlineTelevisions = allTelevisions.filter(
    (tv) => tv.status === "ONLINE"
  ).length;
  const totalPlaylists = users.reduce(
    (total, user) => total + user._count.playlists,
    0
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Chargement des données...</span>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-6", className)}>
      {/* Header Admin */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard Administrateur</h1>
              <p className="text-sm text-muted-foreground">
                Gérez tous les utilisateurs, TVs et playlists de la plateforme
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw
            className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")}
          />
          Actualiser
        </Button>
      </div>

      {/* Stats globales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Utilisateurs
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              dont {totalAdmins} admin{totalAdmins > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Télévisions
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Monitor className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTelevisions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {onlineTelevisions} en ligne
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Playlists
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
              <List className="h-5 w-5 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlaylists}</div>
            <p className="text-xs text-muted-foreground mt-1">Toutes plateformes</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sociétés</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Building2 className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCompanies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Entreprises actives</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Départements</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
              <MapPin className="h-5 w-5 text-pink-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueDepartments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Zones actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres étendus */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher utilisateurs, société, département..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type utilisateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              <SelectItem value="admins">Administrateurs</SelectItem>
              <SelectItem value="users">Utilisateurs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par société" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sociétés</SelectItem>
              {uniqueCompanies.map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par département" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les départements</SelectItem>
              {uniqueDepartments.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut TVs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="online">En ligne</SelectItem>
              <SelectItem value="offline">Hors ligne</SelectItem>
              <SelectItem value="connecting">Connexion</SelectItem>
            </SelectContent>
          </Select>

          {/* Bouton reset filtres */}
          {(companyFilter !== "all" ||
            departmentFilter !== "all" ||
            userFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setCompanyFilter("all");
                setDepartmentFilter("all");
                setUserFilter("all");
              }}
              className="whitespace-nowrap"
            >
              <X className="h-4 w-4 mr-2" />
              Reset filtres
            </Button>
          )}
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            Utilisateurs ({filteredUsers.length})
          </TabsTrigger>
          <TabsTrigger value="televisions">
            Toutes les TVs ({filteredTelevisions.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Utilisateurs avec groupement */}
        <TabsContent value="users" className="space-y-6">
          {Object.keys(groupedUsers).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedUsers).map(([groupName, groupUsers]) => (
                <div key={groupName} className="space-y-4">
                  {/* En-tête de groupe */}
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{groupName}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {groupUsers.length} utilisateur
                      {groupUsers.length > 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Liste des utilisateurs du groupe */}
                  <div className="grid gap-4 ml-4">
                    {groupUsers.map((user) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>
                                  {user.firstName?.[0] || "U"}
                                  {user.lastName?.[0] || ""}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-xl">
                                    {user.firstName && user.lastName
                                      ? `${user.firstName} ${user.lastName}`
                                      : "Nom non défini"}
                                  </CardTitle>
                                  {user.isAdmin && (
                                    <Badge
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Admin
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={
                                      user.isVerify ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {user.isVerify ? "Vérifié" : "Non vérifié"}
                                  </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-4 flex-wrap">
                                  <span>{user.email}</span>
                                  {user.company && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {user.company}
                                    </span>
                                  )}
                                  {user.department && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {user.department}
                                    </span>
                                  )}
                                  {user.city && (
                                    <span className="text-muted-foreground">
                                      • {user.city}
                                    </span>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {user.televisions.length} TV
                                {user.televisions.length > 1 ? "s" : ""}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user._count.playlists} playlist
                                {user._count.playlists > 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Statistiques */}
                          <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {user._count.medias}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Médias
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {user.televisions.length}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                TVs
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {user._count.playlists}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Playlists
                              </div>
                            </div>
                          </div>

                          {/* TVs de l'utilisateur */}
                          {user.televisions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Télévisions:
                              </h4>
                              <div className="space-y-2">
                                {user.televisions.map((tv) => {
                                  const activePlaylist = getActivePlaylist(tv);
                                  return (
                                    <div
                                      key={tv.id}
                                      className="flex items-center justify-between p-2 border rounded-lg"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Monitor className="h-4 w-4" />
                                        <span className="font-medium">
                                          {tv.name}
                                        </span>
                                        {tv.status === "ONLINE" ? (
                                          <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10">
                                            En ligne
                                          </Badge>
                                        ) : tv.status === "OFFLINE" ? (
                                          <Badge variant="secondary" className="text-xs">
                                            Hors ligne
                                          </Badge>
                                        ) : (
                                          <Badge className="text-xs bg-amber-500/10 text-amber-600 border border-amber-200 hover:bg-amber-500/10">
                                            Connexion...
                                          </Badge>
                                        )}
                                        {tv.location && (
                                          <span className="text-xs text-muted-foreground">
                                            📍 {tv.location}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {activePlaylist && (
                                          <div className="text-xs text-muted-foreground">
                                            🎵 Playlist active
                                          </div>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          Code: {tv.codeConnection}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Playlists de l'utilisateur */}
                          {user.playlists.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Playlists:
                              </h4>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {user.playlists.map((playlist) => (
                                  <div
                                    key={playlist.id}
                                    className="p-2 border rounded-lg"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">
                                        {playlist.name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {playlist.isActive && (
                                          <Badge
                                            variant="default"
                                            className="text-xs"
                                          >
                                            Active
                                          </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          {playlist.items.length} média
                                          {playlist.items.length > 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    </div>
                                    {playlist.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {playlist.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Separator />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Créé le {formatDate(user.createdAt)}</span>
                            <span>Modifié le {formatDate(user.updatedAt)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">
                    Aucun utilisateur trouvé
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm ||
                    companyFilter !== "all" ||
                    departmentFilter !== "all"
                      ? "Essayez de modifier vos critères de recherche"
                      : "Aucun utilisateur enregistré sur la plateforme"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Télévisions */}
        <TabsContent value="televisions" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTelevisions.map((tv) => {
              const activePlaylist = getActivePlaylist(tv);
              const owner = users.find((u) => u.id === tv.userId);

              return (
                <Card key={tv.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-lg">{tv.name}</CardTitle>
                          <CardDescription>
                            {owner && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {owner.firstName} {owner.lastName}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {tv.status === "ONLINE" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10">
                            <Wifi className="h-3 w-3 mr-1" />
                            En ligne
                          </Badge>
                        ) : tv.status === "OFFLINE" ? (
                          <Badge variant="secondary">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Hors ligne
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border border-amber-200 hover:bg-amber-500/10">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Connexion...
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Paramètres
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Informations techniques */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Résolution:
                        </span>
                        <div className="font-medium">{tv.resolution}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Orientation:
                        </span>
                        <div className="font-medium">{tv.orientation}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          {tv.volume}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Code:</span>
                        <div className="font-medium font-mono">
                          {tv.codeConnection}
                        </div>
                      </div>
                    </div>

                    {/* Localisation */}
                    {tv.location && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{tv.location}</span>
                      </div>
                    )}

                    {/* Description */}
                    {tv.description && (
                      <p className="text-sm text-muted-foreground">
                        {tv.description}
                      </p>
                    )}

                    {/* Playlist active */}
                    {activePlaylist && (
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Play className="h-4 w-4 text-primary" />
                          <span className="font-medium">Playlist active</span>
                          <Badge variant="outline" className="text-xs">
                            Priorité {activePlaylist.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Assignée le {formatDate(activePlaylist.assignedAt)}
                        </div>
                      </div>
                    )}

                    {/* Paramètres */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        {tv.autoPlay ? (
                          <Play className="h-3 w-3 text-green-500" />
                        ) : (
                          <Pause className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>AutoPlay</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {tv.loop ? (
                          <Repeat className="h-3 w-3 text-green-500" />
                        ) : (
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>Boucle</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        <span>{tv.refreshRate}Hz</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Dernières activités */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Créée le {formatDate(tv.createdAt)}</div>
                      {tv.lastSeen && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Dernière activité: {formatDate(tv.lastSeen)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Section vide pour les télévisions */}
      {filteredTelevisions.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center space-y-4">
            <Monitor className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">
                Aucune télévision trouvée
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucune télévision enregistrée sur la plateforme"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboard;
