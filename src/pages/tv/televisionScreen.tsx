import React, { useState, useEffect, useMemo, type ElementType } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import {
  Plus, Trash2, Upload, Monitor, Wifi, WifiOff, Play, Volume2,
  LayoutGrid, Table as TableIcon, Filter, X, MapPin, User,
  Pencil, Check, Loader2, Info, Calendar, Clock, Eye, Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from '@/scripts/fetch.api';

// ─── Edit Dialog sub-components ──────────────────────────────────────────────

function EditSection({
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
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", bgClass)}>
          <Icon className={cn("h-4 w-4", iconClass)} />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function OptionChips({
  options,
  value,
  onChange,
  activeClass = "bg-primary/10 text-primary border-primary/30",
}: {
  options: { label: string; value: any }[];
  value: any;
  onChange: (v: any) => void;
  activeClass?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            value === opt.value
              ? activeClass
              : "bg-muted text-muted-foreground border-border hover:border-primary/20 hover:bg-accent"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  iconClass = "text-primary",
  bgClass = "bg-primary/10",
}: {
  icon: ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  iconClass?: string;
  bgClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0", bgClass)}>
          <Icon className={cn("h-4 w-4", iconClass)} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── EditTVDialog ─────────────────────────────────────────────────────────────

const RESOLUTION_OPTIONS = [
  { label: "HD 720p", value: "HD_720P" },
  { label: "Full HD 1080p", value: "HD_1080P" },
  { label: "4K Ultra HD", value: "4K" },
  { label: "8K", value: "8K" },
];
const ORIENTATION_OPTIONS = [
  { label: "Paysage", value: "LANDSCAPE" },
  { label: "Portrait", value: "PORTRAIT" },
];
const TRANSITION_OPTIONS = [
  { label: "Fondu", value: "FADE" },
  { label: "Glissement", value: "SLIDE" },
  { label: "Zoom", value: "ZOOM" },
  { label: "Aucune", value: "NONE" },
];
const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function EditTVDialog({
  tv,
  open,
  onOpenChange,
  onSave,
}: {
  tv: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (updated: any) => void;
}) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    resolution: "HD_1080P",
    orientation: "LANDSCAPE",
    volume: 50,
    autoPlay: false,
    loop: false,
    transition: "FADE",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (open && tv) {
      setFormData({
        id: tv.id ?? "",
        name: tv.name ?? "",
        description: tv.description ?? "",
        resolution: tv.resolution ?? "HD_1080P",
        orientation: tv.orientation ?? "LANDSCAPE",
        volume: tv.volume ?? 50,
        autoPlay: tv.autoPlay ?? false,
        loop: tv.loop ?? false,
        transition: tv.transition ?? "FADE",
      });
      api.get(`/schedules/tv/${tv.id}`)
        .then((res) => setSchedules(res.data))
        .catch(() => setSchedules([]));
    }
  }, [open, tv]);

  const update = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const toggleSchedule = async (scheduleId: string, current: boolean) => {
    try {
      await api.patch(`/schedules/${scheduleId}`, { isActive: !current });
      setSchedules((prev) =>
        prev.map((s) => (s.id === scheduleId ? { ...s, isActive: !current } : s))
      );
    } catch {
      toast.error("Impossible de modifier la programmation");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom de la télévision est requis");
      return;
    }
    setIsLoading(true);
    try {
      await api.patch("/televisions/" + formData.id, formData);
      onSave({ ...tv, ...formData, updatedAt: new Date().toISOString() });
      toast.success("Télévision mise à jour avec succès");
      onOpenChange(false);
    } catch {
      toast.error("Impossible de mettre à jour la télévision");
    } finally {
      setIsLoading(false);
    }
  };

  if (!tv) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Monitor className="h-4 w-4 text-primary" />
            </div>
            Modifier la télévision
          </DialogTitle>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5">{isLoading ? "Enregistrement..." : "Enregistrer"}</span>
          </Button>
        </div>

        <ScrollArea className="max-h-[75vh]">
          <div className="px-5 py-5 space-y-6">

            {/* ── Informations générales ── */}
            <EditSection icon={Info} title="Informations générales" iconClass="text-blue-500" bgClass="bg-blue-500/10">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Nom *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Ex: Samsung TV Salon"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Description optionnelle…"
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </EditSection>

            <Separator />

            {/* ── Paramètres d'affichage ── */}
            <EditSection icon={Monitor} title="Paramètres d'affichage" iconClass="text-emerald-500" bgClass="bg-emerald-500/10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Résolution</Label>
                  <OptionChips
                    options={RESOLUTION_OPTIONS}
                    value={formData.resolution}
                    onChange={(v) => update("resolution", v)}
                    activeClass="bg-blue-500/10 text-blue-600 border-blue-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Orientation</Label>
                  <OptionChips
                    options={ORIENTATION_OPTIONS}
                    value={formData.orientation}
                    onChange={(v) => update("orientation", v)}
                    activeClass="bg-emerald-500/10 text-emerald-600 border-emerald-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Transition</Label>
                  <OptionChips
                    options={TRANSITION_OPTIONS}
                    value={formData.transition}
                    onChange={(v) => update("transition", v)}
                    activeClass="bg-purple-500/10 text-purple-600 border-purple-300"
                  />
                </div>
              </div>
            </EditSection>

            <Separator />

            {/* ── Volume ── */}
            <EditSection icon={Volume2} title={`Volume : ${formData.volume}%`} iconClass="text-cyan-500" bgClass="bg-cyan-500/10">
              <div className="space-y-1.5 px-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.volume}
                  onChange={(e) => update("volume", parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </EditSection>

            <Separator />

            {/* ── Paramètres de lecture ── */}
            <EditSection icon={Play} title="Paramètres de lecture" iconClass="text-purple-500" bgClass="bg-purple-500/10">
              <div className="space-y-2.5">
                <SwitchRow
                  icon={Play}
                  title="Lecture automatique"
                  description="Démarre automatiquement la lecture"
                  checked={formData.autoPlay}
                  onChange={(v) => update("autoPlay", v)}
                  iconClass="text-blue-500"
                  bgClass="bg-blue-500/10"
                />
                <SwitchRow
                  icon={Repeat}
                  title="Lecture en boucle"
                  description="Répète la lecture indéfiniment"
                  checked={formData.loop}
                  onChange={(v) => update("loop", v)}
                  iconClass="text-purple-500"
                  bgClass="bg-purple-500/10"
                />
              </div>
            </EditSection>

            <Separator />

            {/* ── Programmation ── */}
            <EditSection icon={Calendar} title="Programmation" iconClass="text-amber-500" bgClass="bg-amber-500/10">
              {schedules.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border bg-muted/30 py-6">
                  <p className="text-sm text-muted-foreground">Aucune programmation assignée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {schedules.map((sch) => (
                    <div
                      key={sch.id}
                      className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 flex-shrink-0">
                          <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {sch.playlist?.name ?? sch.title ?? "Programmation"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sch.startTime} → {sch.endTime}
                            {sch.daysOfWeek?.length > 0 &&
                              `  ·  ${sch.daysOfWeek.map((d: number) => DAY_LABELS[d]).join(", ")}`}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={sch.isActive}
                        onCheckedChange={() => toggleSchedule(sch.id, sch.isActive)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </EditSection>

            <Separator />

            {/* ── Résumé ── */}
            <EditSection icon={Eye} title="Résumé" iconClass="text-orange-500" bgClass="bg-orange-500/10">
              <div className="rounded-xl border divide-y overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Device ID</span>
                  <span className="text-xs font-mono font-medium">{tv?.deviceId ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Code de connexion</span>
                  <span className="text-xs font-mono font-semibold tracking-widest">{tv?.codeConnection ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Statut actuel</span>
                  {tv?.status === "ONLINE" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10 text-xs gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      En ligne
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      Hors ligne
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Dernière activité</span>
                  <span className="text-xs text-muted-foreground">
                    {tv?.updatedAt ? new Date(tv.updatedAt).toLocaleString("fr-FR") : "—"}
                  </span>
                </div>
              </div>
            </EditSection>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TelevisionManagement = () => {
  const [televisions, setTelevisions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedTVs, setSelectedTVs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingTV, setEditingTV] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [viewMode, setViewMode] = useState('cards');
  const [filters, setFilters] = useState({
    city: 'all',
    department: 'all',
    status: 'all',
  });

  useEffect(() => {
    fetchTelevisions();
    const interval = setInterval(fetchTelevisions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTelevisions = async () => {
    try {
      const response = await api.get('/televisions/dashboard');
      setTelevisions(response.data);
    } catch (error) {
      console.error('Erreur lors du fetch des télévisions:', error);
    }
  };

  const handleTVUpdate = (updatedTV: any) => {
    setTelevisions((prev) =>
      prev.map((tv) => (tv.id === updatedTV.id ? updatedTV : tv))
    );
  };

  const openEdit = (tv: any) => {
    setEditingTV(tv);
    setShowEditDialog(true);
  };

  const filterOptions = useMemo(() => {
    const cities = [...new Set(televisions.map((tv: any) => tv.user?.city).filter(Boolean))];
    const departments = [...new Set(televisions.map((tv: any) => tv.user?.department).filter(Boolean))];
    return { cities: (cities as string[]).sort(), departments: (departments as string[]).sort() };
  }, [televisions]);

  const filteredTelevisions = useMemo(() => {
    return televisions.filter((tv) => {
      const cityMatch = filters.city === 'all' || tv.user?.city === filters.city;
      const departmentMatch = filters.department === 'all' || tv.user?.department === filters.department;
      const statusMatch = filters.status === 'all' || tv.status === filters.status;
      return cityMatch && departmentMatch && statusMatch;
    });
  }, [televisions, filters]);

  const clearFilters = () => setFilters({ city: 'all', department: 'all', status: 'all' });
  const activeFiltersCount = Object.values(filters).filter((v) => v !== 'all').length;

  const getActivePlaylists = (tv: any) => tv.playlists?.filter((p: any) => p.isActive) || [];

  const handleFileSelection = (event: any) =>
    setSelectedFiles(Array.from(event.target.files) as File[]);
  const toggleTVSelection = (tvId: string, checked: boolean) => {
    if (checked) setSelectedTVs((prev) => [...prev, tvId]);
    else setSelectedTVs((prev) => prev.filter((id) => id !== tvId));
  };
  const removeFile = (fileIndex: number) =>
    setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));

  const createPlaylistForTVs = async () => {
    if (!playlistTitle.trim()) { alert('Veuillez saisir un titre'); return; }
    if (selectedFiles.length === 0) { alert('Veuillez sélectionner des fichiers'); return; }
    if (selectedTVs.length === 0) { alert('Veuillez sélectionner au moins une télévision'); return; }
    setLoading(true);
    try {
      for (const tvId of selectedTVs) {
        const formData = new FormData();
        formData.append('title', playlistTitle);
        formData.append('televisionId', tvId);
        selectedFiles.forEach((file: any) => formData.append('files', file));
        const response = await fetch('/api/playlists', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Erreur pour TV ${tvId}`);
      }
      alert('Playlist créée pour toutes les télévisions sélectionnées !');
      resetForm();
      fetchTelevisions();
    } catch (error) {
      alert('Erreur lors de la création des playlists');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setPlaylistTitle('');
    setSelectedFiles([]);
    setSelectedTVs([]);
  };

  // ── Table view ──
  const TableView = () => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Télévision</TableHead>
            <TableHead>Propriétaire</TableHead>
            <TableHead>Localisation</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Volume</TableHead>
            <TableHead>Playlists</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTelevisions.map((tv: any) => {
            const activePlaylists = getActivePlaylists(tv);
            const isConnected = tv.status === 'ONLINE';
            return (
              <TableRow key={tv.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTVs.includes(tv.id)}
                    onCheckedChange={(checked) => toggleTVSelection(tv.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Monitor size={16} />
                    <div>
                      <div className="font-medium">{tv.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tv.orientation === 'LANDSCAPE' ? 'Paysage' : 'Portrait'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span className="text-sm font-medium">{tv.user?.firstName} {tv.user?.lastName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin size={12} />
                    <div>
                      <div>{tv.user?.city || '—'}</div>
                      <div className="text-xs text-muted-foreground">{tv.user?.department || '—'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isConnected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10 gap-1">
                      <Wifi size={11} /> En ligne
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <WifiOff size={11} /> Hors ligne
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Volume2 size={14} /> {tv.volume}%
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Play size={12} />
                    <span className="text-sm">{activePlaylists.length}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{tv.codeConnection}</span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(tv)}
                  >
                    <Pencil size={14} />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  // ── Cards view ──
  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTelevisions.map((tv: any) => {
        const activePlaylists = getActivePlaylists(tv);
        const isConnected = tv.status === 'ONLINE';
        return (
          <Card key={tv.id} className={cn(
            "transition-all duration-200",
            isConnected ? "border-emerald-200" : "border-border"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={selectedTVs.includes(tv.id)}
                    onCheckedChange={(checked) => toggleTVSelection(tv.id, !!checked)}
                  />
                  <CardTitle className="text-base flex items-center gap-2 truncate">
                    <Monitor size={16} className="flex-shrink-0" />
                    <span className="truncate">{tv.name}</span>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isConnected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10 gap-1 text-xs">
                      <Wifi size={10} /> En ligne
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <WifiOff size={10} /> Hors ligne
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={() => openEdit(tv)}
                  >
                    <Pencil size={13} />
                  </Button>
                </div>
              </div>
              <CardDescription className="font-mono text-xs">
                {tv.codeConnection}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                <User size={15} className="flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {tv.user?.firstName} {tv.user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin size={10} />
                    {tv.user?.city}{tv.user?.department ? `, ${tv.user.department}` : ""}
                  </div>
                </div>
              </div>

              {activePlaylists.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Play size={12} />
                    {activePlaylists.length} playlist{activePlaylists.length > 1 ? "s" : ""} active{activePlaylists.length > 1 ? "s" : ""}
                  </div>
                  {activePlaylists.map((playlist: any) => (
                    <div key={playlist.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded-lg">
                      <span className="font-mono truncate">#{playlist.playlistId.slice(0, 8)}…</span>
                      <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">P{playlist.priority}</Badge>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t text-xs text-muted-foreground">
                Mis à jour : {new Date(tv.updatedAt).toLocaleString("fr-FR")}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Télévisions</h1>
          <p className="text-sm text-muted-foreground">
            {filteredTelevisions.length} télévision{filteredTelevisions.length !== 1 ? "s" : ""} trouvée{filteredTelevisions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Ajouter une playlist générale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle playlist</DialogTitle>
              <DialogDescription>
                Ajoutez des médias et sélectionnez les télévisions cibles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la playlist</Label>
                <Input
                  id="title"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  placeholder="Saisir le titre..."
                />
              </div>
              <div className="space-y-2">
                <Label>Fichiers ({selectedFiles.length} sélectionnés)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} className="flex-1" />
                  <Upload size={20} className="text-muted-foreground" />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-muted/50">
                    {selectedFiles.map((file: any, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="text-destructive hover:text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Télévisions cibles ({selectedTVs.length} sélectionnées)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 border rounded-lg">
                  {televisions.map((tv: any) => (
                    <div
                      key={tv.id}
                      className={cn(
                        "flex items-center space-x-3 p-3 border rounded-lg transition-colors",
                        selectedTVs.includes(tv.id) ? "border-primary bg-primary/5" : "border-border",
                        tv.status !== "ONLINE" && "opacity-60"
                      )}
                    >
                      <Checkbox
                        id={tv.id}
                        checked={selectedTVs.includes(tv.id)}
                        onCheckedChange={(checked) => toggleTVSelection(tv.id, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <label htmlFor={tv.id} className="text-sm font-medium cursor-pointer">{tv.name}</label>
                        <div className="flex items-center gap-2 mt-1">
                          {tv.status === "ONLINE"
                            ? <Wifi size={12} className="text-emerald-500" />
                            : <WifiOff size={12} className="text-red-500" />}
                          <span className="text-xs text-muted-foreground">
                            {tv.user?.city} — {tv.status === "ONLINE" ? "En ligne" : "Hors ligne"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Annuler</Button>
              <Button onClick={createPlaylistForTVs} disabled={loading}>
                {loading ? "Création..." : "Créer la playlist"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters + view toggle */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <span className="text-sm font-medium">Filtres :</span>
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters((p) => ({ ...p, status: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ONLINE">En ligne</SelectItem>
                <SelectItem value="OFFLINE">Hors ligne</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.city} onValueChange={(v) => setFilters((p) => ({ ...p, city: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Ville" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les villes</SelectItem>
                {filterOptions.cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.department} onValueChange={(v) => setFilters((p) => ({ ...p, department: v }))}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Département" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {filterOptions.departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1">
                <X size={12} /> Effacer ({activeFiltersCount})
              </Button>
            )}
          </div>
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
            <ToggleGroupItem value="cards"><LayoutGrid size={16} /></ToggleGroupItem>
            <ToggleGroupItem value="table"><TableIcon size={16} /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>

      {/* Content */}
      {viewMode === 'table' ? <TableView /> : <CardsView />}

      {filteredTelevisions.length === 0 && televisions.length > 0 && (
        <Card className="p-12 text-center">
          <Filter size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
          <p className="text-muted-foreground mb-4">Aucune télévision ne correspond aux filtres sélectionnés.</p>
          <Button variant="outline" onClick={clearFilters}>Effacer les filtres</Button>
        </Card>
      )}

      {televisions.length === 0 && (
        <Card className="p-12 text-center">
          <Monitor size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune télévision trouvée</h3>
          <p className="text-muted-foreground">Les télévisions connectées apparaîtront ici automatiquement.</p>
        </Card>
      )}

      {/* Edit dialog */}
      <EditTVDialog
        tv={editingTV}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleTVUpdate}
      />
    </div>
  );
};

export default TelevisionManagement;
