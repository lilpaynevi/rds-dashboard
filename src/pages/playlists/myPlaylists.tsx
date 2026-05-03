"use client";

import { useState, useEffect, useMemo, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ListMusic,
  Monitor,
  MoreHorizontal,
  Trash2,
  Pencil,
  Plus,
  Shuffle,
  Repeat,
  Image as ImageIcon,
  Video,
  Play,
  Search,
  RefreshCw,
  Check,
  CheckCircle2,
  Loader2,
  Tv,
  User,
  Building2,
  X,
  Radio,
  Mail,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import api, { baseURL } from "@/scripts/fetch.api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaylistItem {
  id: string;
  order: number;
  media: {
    id: string;
    type: string;
    title: string;
    duration?: number;
    s3Url?: string;
    thumbnail?: string;
    mimeType?: string;
    fileSize?: number;
  };
}

interface TelevisionReference {
  id: string;
  televisionId: string;
  isActive: boolean;
  priority: number;
  assignedAt: string;
  television: { id: string; name: string };
}

interface Schedule {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive: boolean;
}

interface PlaylistUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  shuffleMode: boolean;
  repeatMode: "LOOP" | "ONCE" | "NONE";
  createdAt: string;
  updatedAt: string;
  userId: string;
  items: PlaylistItem[];
  televisions: TelevisionReference[];
  schedules: Schedule[];
  user?: PlaylistUser;
}

interface Television {
  id: string;
  name: string;
  location?: string;
  status: "ONLINE" | "OFFLINE";
  user?: { firstName?: string; lastName?: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  iconClass = "text-primary",
  bgClass = "bg-primary/10",
  children,
}: {
  icon: ElementType;
  title: string;
  iconClass?: string;
  bgClass?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
            bgClass,
          )}
        >
          <Icon className={cn("h-4 w-4", iconClass)} />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRepeatLabel(mode: string) {
  return mode === "LOOP" ? "Boucle" : mode === "ONCE" ? "Une fois" : "Aucune";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Edit Playlist Dialog ─────────────────────────────────────────────────────

function EditPlaylistDialog({
  playlist,
  open,
  onOpenChange,
  onSave,
}: {
  playlist: Playlist | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (updated: Playlist) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: false,
    shuffleMode: false,
    repeatMode: "LOOP" as "LOOP" | "ONCE" | "NONE",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && playlist) {
      setForm({
        name: playlist.name ?? "",
        description: playlist.description ?? "",
        isActive: playlist.isActive ?? false,
        shuffleMode: playlist.shuffleMode ?? false,
        repeatMode: playlist.repeatMode ?? "LOOP",
      });
    }
  }, [open, playlist]);

  const handleSave = async () => {
    if (!playlist || !form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/playlists/${playlist.id}`, form);
      onSave({ ...playlist, ...form });
      toast.success("Playlist mise à jour");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (!playlist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <ListMusic className="h-4 w-4 text-violet-500" />
            </div>
            Modifier la playlist
          </DialogTitle>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </span>
          </Button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Infos */}
          <SectionCard
            icon={ListMusic}
            title="Informations"
            iconClass="text-violet-500"
            bgClass="bg-violet-500/10"
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Nom *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Nom de la playlist"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Description
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Description optionnelle…"
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </SectionCard>

          <Separator />

          {/* Statut */}
          <SectionCard
            icon={form.isActive ? Radio : ListMusic}
            title="Statut"
            iconClass={form.isActive ? "text-emerald-500" : "text-amber-500"}
            bgClass={form.isActive ? "bg-emerald-500/10" : "bg-amber-500/10"}
          >
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-semibold">
                  {form.isActive ? "Active" : "Inactive"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.isActive
                    ? "Diffusée sur les écrans assignés"
                    : "Non diffusée"}
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
            </div>
          </SectionCard>

          <Separator />

          {/* Lecture */}
          <SectionCard
            icon={Repeat}
            title="Mode de lecture"
            iconClass="text-blue-500"
            bgClass="bg-blue-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-semibold">Mode aléatoire</p>
                  <p className="text-xs text-muted-foreground">
                    Mélange l'ordre des médias
                  </p>
                </div>
                <Switch
                  checked={form.shuffleMode}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, shuffleMode: v }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Répétition
                </Label>
                <Select
                  value={form.repeatMode}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, repeatMode: v as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOOP">Boucle infinie</SelectItem>
                    <SelectItem value="ONCE">Une seule fois</SelectItem>
                    <SelectItem value="NONE">Aucune répétition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign TV Dialog ─────────────────────────────────────────────────────────

function AssignTVDialog({
  playlist,
  televisions,
  open,
  onOpenChange,
  onAssigned,
}: {
  playlist: Playlist | null;
  televisions: Television[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAssigned: (playlistId: string, newTVIds: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && playlist) {
      const alreadyAssigned = playlist.televisions
        .map((t) => t.televisionId ?? t.television?.id)
        .filter(Boolean);
      setSelectedIds(alreadyAssigned);
    }
  }, [open, playlist]);

  const toggleTV = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSave = async () => {
    if (!playlist) return;
    setSaving(true);
    try {
      await api.post(`/playlists/${playlist.id}/televisions`, {
        televisionIds: selectedIds,
      });
      onAssigned(playlist.id, selectedIds);
      toast.success("Assignation mise à jour");
      onOpenChange(false);
    } catch {
      toast.error("Erreur lors de l'assignation");
    } finally {
      setSaving(false);
    }
  };

  if (!playlist) return null;

  const alreadyCount = playlist.televisions.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <Tv className="h-4 w-4 text-purple-500" />
            </div>
            Assigner aux écrans
          </DialogTitle>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5">Confirmer ({selectedIds.length})</span>
          </Button>
        </div>

        {/* Playlist info */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 flex-shrink-0">
              <ListMusic className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{playlist.name}</p>
              <p className="text-xs text-muted-foreground">
                {playlist.items.length} média
                {playlist.items.length !== 1 ? "s" : ""}
                {alreadyCount > 0 &&
                  ` · ${alreadyCount} TV${alreadyCount > 1 ? "s" : ""} déjà assignée${alreadyCount > 1 ? "s" : ""}`}
              </p>
            </div>
            {selectedIds.length > 0 && (
              <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                {selectedIds.length} sélectionné
                {selectedIds.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground mt-2 ml-1"
            >
              Tout désélectionner
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80 px-5 py-3">
          {televisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Monitor className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Aucun écran disponible
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {televisions.map((tv) => {
                const isSelected = selectedIds.includes(tv.id);
                return (
                  <button
                    key={tv.id}
                    onClick={() => toggleTV(tv.id)}
                    className={cn(
                      "relative flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-accent/50",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
                    )}
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border",
                        tv.status === "ONLINE"
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-muted border-border",
                      )}
                    >
                      <Monitor
                        className={cn(
                          "h-5 w-5",
                          tv.status === "ONLINE"
                            ? "text-emerald-500"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {tv.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full flex-shrink-0",
                            tv.status === "ONLINE"
                              ? "bg-emerald-500"
                              : "bg-gray-400",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            tv.status === "ONLINE"
                              ? "text-emerald-600"
                              : "text-muted-foreground",
                          )}
                        >
                          {tv.status === "ONLINE" ? "En ligne" : "Hors ligne"}
                        </span>
                        {tv.location && (
                          <>
                            <span className="text-muted-foreground text-xs">
                              ·
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {tv.location}
                            </span>
                          </>
                        )}
                      </div>
                      {tv.user && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {tv.user.firstName} {tv.user.lastName}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlaylistDashboard() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [televisions, setTelevisions] = useState<Television[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [assigningPlaylist, setAssigningPlaylist] = useState<Playlist | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, tvsRes] = await Promise.all([
        api.get("/users"),
        api.get("/televisions/dashboard"),
      ]);

      const allPlaylists: Playlist[] = (usersRes.data as any[]).flatMap(
        (user: any) =>
          (user.playlists ?? []).map((playlist: any) => ({
            ...playlist,
            items: playlist.items ?? [],
            televisions: playlist.televisions ?? [],
            schedules: playlist.schedules ?? [],
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              company: user.company,
            },
          })),
      );

      setPlaylists(allPlaylists);
      setTelevisions(tvsRes.data);
    } catch {
      toast.error("Erreur lors du chargement des données");
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

  const handleSaveEdit = (updated: Playlist) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
  };

  const handleAssigned = (playlistId: string, newTVIds: string[]) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p;
        const newTVs = newTVIds.map((tvId) => {
          const tv = televisions.find((t) => t.id === tvId);
          return {
            id: tvId,
            televisionId: tvId,
            isActive: true,
            priority: 1,
            assignedAt: new Date().toISOString(),
            television: { id: tvId, name: tv?.name ?? tvId },
          };
        });
        return { ...p, televisions: newTVs };
      }),
    );
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/playlists/${deletingId}`);
      setPlaylists((prev) => prev.filter((p) => p.id !== deletingId));
      toast.success("Playlist supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const openEdit = (p: Playlist) => {
    setEditingPlaylist(p);
    setIsEditOpen(true);
  };
  const openAssign = (p: Playlist) => {
    setAssigningPlaylist(p);
    setIsAssignOpen(true);
  };
  const openDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  // Unique companies for filter
  const uniqueOwners = useMemo(() => {
    const companies = [
      ...new Set(playlists.map((p) => p.user?.company).filter(Boolean)),
    ] as string[];
    return companies.sort();
  }, [playlists]);

  const filtered = useMemo(() => {
    return playlists.filter((p) => {
      const matchSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.isActive) ||
        (statusFilter === "inactive" && !p.isActive);
      const matchOwner =
        ownerFilter === "all" || p.user?.company === ownerFilter;
      return matchSearch && matchStatus && matchOwner;
    });
  }, [playlists, searchTerm, statusFilter, ownerFilter]);

  // Stats
  const totalMedias = playlists.reduce((s, p) => s + (p.items?.length ?? 0), 0);
  const activeCount = playlists.filter((p) => p.isActive).length;
  const assignedCount = playlists.filter(
    (p) => (p.televisions?.length ?? 0) > 0,
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="text-muted-foreground">Chargement des playlists…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
            <ListMusic className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Toutes les playlists
            </h1>
            <p className="text-sm text-muted-foreground">
              {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} sur
              la plateforme
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-1.5", refreshing && "animate-spin")}
            />
            Actualiser
          </Button>
          <Link to="create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle playlist
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total",
            value: playlists.length,
            icon: ListMusic,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
          {
            label: "Actives",
            value: activeCount,
            icon: Radio,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Assignées à une TV",
            value: assignedCount,
            icon: Tv,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Médias au total",
            value: totalMedias,
            icon: ImageIcon,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  bg,
                )}
              >
                <Icon className={cn("h-5 w-5", color)} />
              </div>
            </CardHeader>
            <div className="px-6 pb-4">
              <div className="text-2xl font-bold">{value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, description, propriétaire…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="inactive">Inactives</SelectItem>
              </SelectContent>
            </Select>
            {uniqueOwners.length > 0 && (
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Société" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sociétés</SelectItem>
                  {uniqueOwners.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(statusFilter !== "all" ||
              ownerFilter !== "all" ||
              searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setOwnerFilter("all");
                  setSearchTerm("");
                }}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
        {filtered.length !== playlists.length && (
          <p className="text-xs text-muted-foreground mt-2">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur{" "}
            {playlists.length}
          </p>
        )}
      </Card>

      {/* Playlist grid */}
      {filtered.length === 0 ? (
        <Card className="py-16">
          <div className="text-center space-y-3">
            <ListMusic className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Aucune playlist trouvée</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" || ownerFilter !== "all"
                ? "Modifiez vos critères de recherche"
                : "Aucune playlist enregistrée sur la plateforme"}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onEdit={() => openEdit(playlist)}
              onAssign={() => openAssign(playlist)}
              onDelete={() => openDelete(playlist.id)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <EditPlaylistDialog
        playlist={editingPlaylist}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveEdit}
      />
      <AssignTVDialog
        playlist={assigningPlaylist}
        televisions={televisions}
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        onAssigned={handleAssigned}
      />
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la playlist ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La playlist et toutes ses
              associations seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Playlist Card ─────────────────────────────────────────────────────────────

function MediaThumb({ item }: { item: PlaylistItem }) {
  const src =
    item.media?.type === "IMAGE"
      ? (item.media.s3Url ?? item.media.thumbnail)
      : item.media?.thumbnail;
  console.log("🚀 ~ MediaThumb ~ src:", src);

  return (
    <div className="relative aspect-square rounded-md overflow-hidden border bg-muted flex-shrink-0 group">
      {src ? (
        <img
          src={baseURL + src}
          alt={item.media?.title ?? ""}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {item.media?.type === "VIDEO" ? (
            <Video className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      )}
      {item.media?.type === "VIDEO" && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <Play className="h-3.5 w-3.5 text-white fill-white" />
        </div>
      )}
      {item.media?.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-[9px] truncate">{item.media.title}</p>
        </div>
      )}
    </div>
  );
}

function PlaylistCard({
  playlist,
  onEdit,
  onAssign,
  onDelete,
}: {
  playlist: Playlist;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
}) {
  const items = playlist.items ?? [];
  const tvs = playlist.televisions ?? [];
  const imageCount = items.filter((i) => i.media?.type === "IMAGE").length;
  const videoCount = items.filter((i) => i.media?.type === "VIDEO").length;
  const previewItems = items.slice(0, 8);
  const remaining = items.length - 8;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}min` : `${s}s`;
  };
  const totalDuration = items.reduce(
    (acc, i) => acc + (i.media?.duration ?? 0),
    0,
  );

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md flex flex-col",
        playlist.isActive ? "border-emerald-200" : "border-border",
      )}
    >
      {playlist.isActive && <div className="h-0.5 bg-emerald-500" />}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 flex-shrink-0">
              <ListMusic className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{playlist.name}</p>
              {playlist.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {playlist.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {playlist.isActive ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10 text-xs">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" /> Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAssign}>
                  <Tv className="mr-2 h-4 w-4" /> Assigner à une TV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0 flex-1 flex flex-col">
        {/* ── Propriétaire ── */}
        {playlist.user && (
          <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Propriétaire
            </p>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 flex-shrink-0">
                <User className="h-4 w-4 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {playlist.user.firstName} {playlist.user.lastName}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {playlist.user.company && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {playlist.user.company}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    {playlist.user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Aperçu médias ── */}
        {items.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Contenu ({items.length})
              </p>
              <div className="flex items-center gap-2">
                {totalDuration > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDuration(totalDuration)}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {previewItems.map((item) => (
                <MediaThumb key={item.id} item={item} />
              ))}
              {remaining > 0 && (
                <div className="aspect-square rounded-md bg-muted border flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    +{remaining}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {imageCount > 0 && (
                <Badge className="bg-blue-500/10 text-blue-600 border border-blue-200 hover:bg-blue-500/10 gap-1 text-xs">
                  <ImageIcon className="h-3 w-3" /> {imageCount} image
                  {imageCount > 1 ? "s" : ""}
                </Badge>
              )}
              {videoCount > 0 && (
                <Badge className="bg-purple-500/10 text-purple-600 border border-purple-200 hover:bg-purple-500/10 gap-1 text-xs">
                  <Video className="h-3 w-3" /> {videoCount} vidéo
                  {videoCount > 1 ? "s" : ""}
                </Badge>
              )}
              {playlist.shuffleMode && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Shuffle className="h-3 w-3" /> Aléatoire
                </Badge>
              )}
              <Badge variant="outline" className="gap-1 text-xs">
                <Repeat className="h-3 w-3" />{" "}
                {getRepeatLabel(playlist.repeatMode)}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 rounded-xl border border-dashed gap-1.5 text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <p className="text-xs">Aucun média</p>
          </div>
        )}

        {/* ── TVs assignées ── */}
        {tvs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Écrans assignés ({tvs.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tvs.slice(0, 4).map((tv) => (
                <span
                  key={tv.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-200 text-orange-600 text-xs font-medium"
                >
                  <Monitor className="h-2.5 w-2.5" />
                  {tv.television?.name ?? "TV"}
                </span>
              ))}
              {tvs.length > 4 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                  +{tvs.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex-1" />

        <Separator />

        {/* ── Actions ── */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDate(playlist.updatedAt)}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={onEdit}
            >
              <Pencil className="h-3 w-3 mr-1" /> Modifier
            </Button>
            <Button size="sm" className="h-7 text-xs px-2.5" onClick={onAssign}>
              <Tv className="h-3 w-3 mr-1" /> Assigner
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PlaylistDashboard;
