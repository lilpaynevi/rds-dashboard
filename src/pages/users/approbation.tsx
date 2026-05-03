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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  UserCheck,
  UserX,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Filter,
  Users,
  Crown,
  User as UserIcon,
  Glasses,
  Download,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/scripts/fetch.api";

// Types basés sur le schéma Prisma
interface PendingUser {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  department?: string;
  city?: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isVerify: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortField = 'createdAt' | 'firstName' | 'lastName' | 'email' | 'role' | 'company';
type SortOrder = 'asc' | 'desc';

export default function ApprovalPage() {
  // États
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // États des dialogs
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);

  // États pour les actions
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState("");

  // Chargement des utilisateurs en attente
  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/not-verified');

      if (!response) {
        throw new Error('Erreur lors du chargement des utilisateurs en attente');
      }

      setPendingUsers(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les utilisateurs en attente');
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires
  const getFullName = (user: PendingUser) => `${user.firstName} ${user.lastName}`;

  const getRoleBadge = (role: string) => {
    const config = {
      ADMIN: { label: "Admin", variant: "default" as const, icon: Crown },
      USER: { label: "Utilisateur", variant: "secondary" as const, icon: UserIcon },
      VIEWER: { label: "Visualiseur", variant: "outline" as const, icon: Glasses }
    };

    const { label, variant, icon: Icon } = config[role as keyof typeof config] || config.USER;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Il y a moins d'1h";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks}sem`;
  };

  // Filtrage et tri
  const filteredUsers = pendingUsers
    .filter(user => {
      const matchesSearch = searchTerm === "" || 
        getFullName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'firstName' || sortField === 'lastName') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Actions
  const handleApproveUser = async (userId: string) => {
    try {
      setApproving(prev => new Set(prev).add(userId));
      const response = await api.patch(`/users/${userId}/verified`, { isVerify: true });

      if (!response) {
        throw new Error('Erreur lors de l\'approbation');
      }

      // Retirer l'utilisateur de la liste
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      toast.success('Utilisateur approuvé avec succès');
      fetchPendingUsers()
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'approbation de l\'utilisateur');
    } finally {
      setApproving(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleRejectUser = async (userId: string, reason?: string) => {
    try {
      setRejecting(prev => new Set(prev).add(userId));
      
      // Pour le rejet, on peut soit supprimer l'utilisateur soit le marquer comme inactif
      // Ici on va le supprimer complètement
      const response = await api.delete(`/users/${userId}`);

      if (!response) {
        throw new Error('Erreur lors du rejet');
      }

      setPendingUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });

      toast.success('Utilisateur rejeté');
      fetchPendingUsers()
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du rejet de l\'utilisateur');
    } finally {
      setRejecting(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleBulkApprove = async () => {
    const userIds = Array.from(selectedUsers);
    for (const userId of userIds) {
      await handleApproveUser(userId);
    }
    setSelectedUsers(new Set());
    setIsBulkActionOpen(false);
  };

  const handleBulkReject = async () => {
    const userIds = Array.from(selectedUsers);
    for (const userId of userIds) {
      await handleRejectUser(userId, rejectReason);
    }
    setSelectedUsers(new Set());
    setRejectReason("");
    setIsBulkActionOpen(false);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  const openDetailsDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const openApproveDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setIsRejectDialogOpen(true);
  };

  const exportToCsv = () => {
    const csvContent = [
      ['Nom', 'Email', 'Rôle', 'Entreprise', 'Département', 'Ville', 'Date de création'],
      ...filteredUsers.map(user => [
        getFullName(user),
        user.email,
        user.role,
        user.company || '',
        user.department || '',
        user.city || '',
        formatDate(user.createdAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptes-en-attente-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Chargement des comptes en attente...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approbation des comptes</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de création de compte utilisateur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCsv} disabled={filteredUsers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button onClick={fetchPendingUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{pendingUsers.length}</div>
                <div className="text-sm text-muted-foreground">En attente</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter(u => u.role === 'ADMIN').length}
                </div>
                <div className="text-sm text-muted-foreground">Demandes Admin</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter(u => u.role === 'USER').length}
                </div>
                <div className="text-sm text-muted-foreground">Utilisateurs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Glasses className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {pendingUsers.filter(u => u.role === 'VIEWER').length}
                </div>
                <div className="text-sm text-muted-foreground">Visualiseurs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="USER">Utilisateur</SelectItem>
                <SelectItem value="VIEWER">Visualiseur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions en masse */}
      {selectedUsers.size > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">
                  {selectedUsers.size} utilisateur(s) sélectionné(s)
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setIsBulkActionOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approuver la sélection
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => {
                    setRejectReason("");
                    setIsBulkActionOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter la sélection
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des utilisateurs en attente */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Rôle demandé</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar ? `/uploads/media/${user.avatar}` : undefined} />
                        <AvatarFallback className="text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{getFullName(user)}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.company && (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3" />
                          {user.company}
                        </div>
                      )}
                      {user.department && (
                        <div className="text-sm text-muted-foreground">
                          {user.department}
                        </div>
                      )}
                      {user.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {user.city}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {getRoleBadge(user.role)}
                      {user.role === 'ADMIN' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Attention
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {getTimeAgo(user.createdAt)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        onClick={() => openDetailsDialog(user)}
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        disabled={approving.has(user.id)}
                        className="bg-green-600 hover:bg-green-700 h-8 px-2"
                      >
                        {approving.has(user.id) ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openRejectDialog(user)}
                        disabled={rejecting.has(user.id)}
                        className="h-8 px-2"
                      >
                        {rejecting.has(user.id) ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                {pendingUsers.length === 0 
                  ? "Aucun compte en attente" 
                  : "Aucun résultat trouvé"
                }
              </h3>
              <p className="text-muted-foreground">
                {pendingUsers.length === 0 
                  ? "Tous les comptes ont été traités"
                  : "Essayez de modifier vos critères de recherche"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails utilisateur */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la demande</DialogTitle>
            <DialogDescription>
              Informations complètes sur la demande de création de compte
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Profil */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar ? `/uploads/media/${selectedUser.avatar}` : undefined} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{getFullName(selectedUser)}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getRoleBadge(selectedUser.role)}
                    {selectedUser.role === 'ADMIN' && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Droits élevés
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Informations de contact</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Organisation</Label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.company && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.company}</span>
                      </div>
                    )}
                    {selectedUser.department && (
                      <div className="text-sm text-muted-foreground">
                        Département: {selectedUser.department}
                      </div>
                    )}
                    {selectedUser.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informations sur la demande */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Informations sur la demande</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Créé le {formatDate(selectedUser.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getTimeAgo(selectedUser.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ID: {selectedUser.id}</span>
                  </div>
                </div>
              </div>

              {/* Avertissement pour les admins */}
              {selectedUser.role === 'ADMIN' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">
                        Demande d'accès administrateur
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Cette personne demande un accès administrateur avec tous les privilèges. 
                        Assurez-vous de connaître cette personne et de vérifier son identité avant d'approuver.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Fermer
            </Button>
            {selectedUser && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openRejectDialog(selectedUser);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    handleApproveUser(selectedUser.id);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation d'approbation */}
      <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Approuver ce compte
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser && (
                <>
                  Êtes-vous sûr de vouloir approuver le compte de{' '}
                  <strong>{getFullName(selectedUser)}</strong> avec le rôle{' '}
                  <strong>{selectedUser.role}</strong> ?
                  
                  {selectedUser.role === 'ADMIN' && (
                    <>
                      <br /><br />
                      <span className="text-red-600 font-medium">
                        ⚠️ Attention : Cette personne aura tous les privilèges administrateur.
                      </span>
                    </>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsApproveDialogOpen(false);
              setSelectedUser(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedUser) {
                  handleApproveUser(selectedUser.id);
                }
                setIsApproveDialogOpen(false);
                setSelectedUser(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmer l'approbation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Confirmation de rejet */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeter cette demande
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Vous êtes sur le point de rejeter la demande de création de compte de{' '}
                  <strong>{getFullName(selectedUser)}</strong>.
                  <br />
                  Le compte sera définitivement supprimé.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Raison du rejet (optionnel)</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée..."
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <strong>Cette action est irréversible.</strong>
                  <br />
                  Le compte sera supprimé et la personne devra créer une nouvelle demande.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false);
                setSelectedUser(null);
                setRejectReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) {
                  handleRejectUser(selectedUser.id, rejectReason);
                }
                setIsRejectDialogOpen(false);
                setSelectedUser(null);
                setRejectReason("");
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Actions en masse */}
      <Dialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actions en masse</DialogTitle>
            <DialogDescription>
              {selectedUsers.size} utilisateur(s) sélectionné(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                className="bg-green-600 hover:bg-green-700 h-24 flex-col gap-2"
                onClick={handleBulkApprove}
              >
                <CheckCircle2 className="h-6 w-6" />
                <span>Approuver tout</span>
                <span className="text-xs opacity-80">
                  {selectedUsers.size} utilisateur(s)
                </span>
              </Button>
              
              <Button
                variant="destructive"
                className="h-24 flex-col gap-2"
                onClick={handleBulkReject}
              >
                <XCircle className="h-6 w-6" />
                <span>Rejeter tout</span>
                <span className="text-xs opacity-80">
                  {selectedUsers.size} utilisateur(s)
                </span>
              </Button>
            </div>

            <div>
              <Label htmlFor="bulk-reject-reason">
                Raison du rejet (si vous choisissez de rejeter)
              </Label>
              <Textarea
                id="bulk-reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Raison commune pour tous les rejets..."
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <strong>Attention :</strong> Ces actions seront appliquées à tous les utilisateurs sélectionnés.
                  Les rejets entraîneront la suppression définitive des comptes.
                </div>
              </div>
            </div>

            {/* Liste des utilisateurs sélectionnés */}
            <div>
              <Label className="text-sm font-medium">Utilisateurs sélectionnés :</Label>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {Array.from(selectedUsers).map(userId => {
                  const user = pendingUsers.find(u => u.id === userId);
                  if (!user) return null;
                  return (
                    <div key={userId} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar ? `/uploads/media/${user.avatar}` : undefined} />
                        <AvatarFallback className="text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{getFullName(user)}</span>
                      <Badge variant="outline" className="ml-auto">
                        {user.role}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkActionOpen(false);
                setRejectReason("");
              }}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
