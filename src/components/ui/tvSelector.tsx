"use client";

import { useState, useMemo } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Tv, Search, Filter, Grid3X3, List, MonitorSpeaker,
  Wifi, WifiOff, Check, CheckCircle2, Circle,
  MoreHorizontal, Settings, Eye, Play, Pause,
  MapPin, Monitor, Smartphone, Tablet, Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Television {
  id: string;
  name: string;
  deviceId?: string;
  location?: string;
  description?: string;
  resolution: "HD_720P" | "HD_1080P" | "UHD_4K";
  orientation: "LANDSCAPE" | "PORTRAIT";
  status: "ONLINE" | "OFFLINE";
  volume: number;
  autoPlay: boolean;
  loop: boolean;
  transition: "FADE" | "SLIDE_LEFT" | "SLIDE_RIGHT" | "ZOOM_IN";
  refreshRate: number;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
  codeConnection: string;
  userId: string;
  playlists: any[];
  user: {
    lastName: string;
    firstName: string;
    city?: string;
    department?: string;
    id: string;
  };
}

interface TelevisionSelectorProps {
  televisions: Television[];
  selectedTVs: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onConfirm: () => void;
  maxSelections?: number;
}

export default function TelevisionSelector({
  televisions,
  selectedTVs,
  onSelectionChange,
  onConfirm,
  maxSelections
}: TelevisionSelectorProps) {
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [resolutionFilter, setResolutionFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [showOnlyWithPlaylists, setShowOnlyWithPlaylists] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Tri
  const [sortBy, setSortBy] = useState<"name" | "status" | "createdAt" | "lastSeen">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filtrage et tri des télévisions
  const filteredAndSortedTVs = useMemo(() => {
    let filtered = televisions.filter(tv => {
      // Recherche textuelle
      const searchMatch = 
        tv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tv.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tv.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tv.location && tv.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        tv.codeConnection.includes(searchTerm);

      // Filtre par statut
      const statusMatch = statusFilter === "ALL" || tv.status === statusFilter;

      // Filtre par résolution
      const resolutionMatch = resolutionFilter === "ALL" || tv.resolution === resolutionFilter;

      // Filtre par localisation
      const locationMatch = !locationFilter || 
        (tv.location && tv.location.toLowerCase().includes(locationFilter.toLowerCase()));

      // Filtre par playlists
      const playlistMatch = !showOnlyWithPlaylists || tv.playlists.length > 0;

      return searchMatch && statusMatch && resolutionMatch && locationMatch && playlistMatch;
    });

    // Tri
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt);
          bVal = new Date(b.createdAt);
          break;
        case "lastSeen":
          aVal = a.lastSeen ? new Date(a.lastSeen) : new Date(0);
          bVal = b.lastSeen ? new Date(b.lastSeen) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [televisions, searchTerm, statusFilter, resolutionFilter, locationFilter, showOnlyWithPlaylists, sortBy, sortOrder]);

  // Gestion des sélections
  const handleSelectAll = () => {
    if (selectedTVs.length === filteredAndSortedTVs.length) {
      onSelectionChange([]);
    } else {
      const newSelection = filteredAndSortedTVs.map(tv => tv.id);
      if (maxSelections && newSelection.length > maxSelections) {
        toast.error(`Vous ne pouvez sélectionner que ${maxSelections} télévision(s) maximum`);
        return;
      }
      onSelectionChange(newSelection);
    }
  };

  const handleSelectTV = (tvId: string, checked: boolean) => {
    if (checked) {
      if (maxSelections && selectedTVs.length >= maxSelections) {
        toast.error(`Vous ne pouvez sélectionner que ${maxSelections} télévision(s) maximum`);
        return;
      }
      onSelectionChange([...selectedTVs, tvId]);
    } else {
      onSelectionChange(selectedTVs.filter(id => id !== tvId));
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setResolutionFilter("ALL");
    setLocationFilter("");
    setShowOnlyWithPlaylists(false);
  };

  // Fonction pour obtenir l'icône du device
  const getDeviceIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("tv") || lowerName.includes("television")) {
      return <Tv className="h-5 w-5" />;
    } else if (lowerName.includes("tablet")) {
      return <Tablet className="h-5 w-5" />;
    } else if (lowerName.includes("phone") || lowerName.includes("samsung") || lowerName.includes("sm-")) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatResolution = (resolution: string) => {
    switch (resolution) {
      case "HD_720P": return "HD 720p";
      case "HD_1080P": return "Full HD 1080p";
      case "UHD_4K": return "4K Ultra HD";
      default: return resolution;
    }
  };

  // Statistiques
  const stats = {
    total: filteredAndSortedTVs.length,
    online: filteredAndSortedTVs.filter(tv => tv.status === "ONLINE").length,
    offline: filteredAndSortedTVs.filter(tv => tv.status === "OFFLINE").length,
    selected: selectedTVs.length,
    withPlaylists: filteredAndSortedTVs.filter(tv => tv.playlists.length > 0).length
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <MonitorSpeaker className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-700">{stats.online}</p>
                <p className="text-sm text-gray-600">En ligne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <WifiOff className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-red-700">{stats.offline}</p>
                <p className="text-sm text-gray-600">Hors ligne</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-700">{stats.selected}</p>
                <p className="text-sm text-gray-600">Sélectionnés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{stats.withPlaylists}</p>
                <p className="text-sm text-gray-600">Avec playlists</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, utilisateur, localisation, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Filtre par statut */}
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="ONLINE">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      En ligne
                    </div>
                  </SelectItem>
                  <SelectItem value="OFFLINE">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      Hors ligne
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre par résolution */}
              <Select value={resolutionFilter} onValueChange={setResolutionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Résolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes résolutions</SelectItem>
                  <SelectItem value="HD_720P">HD 720p</SelectItem>
                  <SelectItem value="HD_1080P">Full HD 1080p</SelectItem>
                  <SelectItem value="UHD_4K">4K Ultra HD</SelectItem>
                </SelectContent>
              </Select>

              {/* Switch pour playlists */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="playlist-filter"
                  checked={showOnlyWithPlaylists}
                  onCheckedChange={setShowOnlyWithPlaylists}
                />
                <Label htmlFor="playlist-filter" className="text-sm">
                  Avec playlists
                </Label>
              </div>

              {/* Tri */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Trier
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "name"}
                    onCheckedChange={() => setSortBy("name")}
                  >
                    Nom
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "status"}
                    onCheckedChange={() => setSortBy("status")}
                  >
                    Statut
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "createdAt"}
                    onCheckedChange={() => setSortBy("createdAt")}
                  >
                    Date de création
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Ordre</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={sortOrder === "asc"}
                    onCheckedChange={() => setSortOrder("asc")}
                  >
                    Croissant
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortOrder === "desc"}
                    onCheckedChange={() => setSortOrder("desc")}
                  >
                    Décroissant
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mode d'affichage */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={resetFilters}>
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Actions de sélection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedTVs.length > 0 && selectedTVs.length === filteredAndSortedTVs.length}
                onCheckedChange={handleSelectAll}
                className="h-5 w-5"
              />
              <Label className="text-sm font-medium">
                Sélectionner tout ({filteredAndSortedTVs.length})
              </Label>
              
              {selectedTVs.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTVs.length} sélectionné(s)
                </Badge>
              )}
              
              {maxSelections && (
                <Badge variant="outline" className="text-xs">
                  Max: {maxSelections}
                </Badge>
              )}
            </div>

            <Button
              onClick={onConfirm}
              disabled={selectedTVs.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Confirmer la sélection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des télévisions */}
      <ScrollArea className="h-[600px]">
        {filteredAndSortedTVs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MonitorSpeaker className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-500 mb-2">
                Aucune télévision trouvée
              </p>
              <p className="text-gray-400">
                Essayez de modifier vos critères de recherche ou vos filtres
              </p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            "gap-4",
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-2"
          )}>
            {filteredAndSortedTVs.map((tv) => (
              <Card 
                key={tv.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedTVs.includes(tv.id) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50",
                  viewMode === "list" && "flex-row"
                )}
                onClick={() => handleSelectTV(tv.id, !selectedTVs.includes(tv.id))}
              >
                <CardContent className={cn(
                  "p-4",
                  viewMode === "list" && "flex items-center space-x-4 w-full"
                )}>
                  <div className={cn(
                    "flex items-start space-x-3",
                    viewMode === "list" && "flex-1"
                  )}>
                    <Checkbox
                      checked={selectedTVs.includes(tv.id)}
                      onCheckedChange={(checked) => handleSelectTV(tv.id, !!checked)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {getDeviceIcon(tv.name)}
                        <h3 className="font-semibold text-lg truncate">{tv.name}</h3>
                        <Badge
                          variant={tv.status === "ONLINE" ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            tv.status === "ONLINE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full mr-1",
                            tv.status === "ONLINE" ? "bg-green-500" : "bg-red-500"
                          )} />
                          {tv.status === "ONLINE" ? "En ligne" : "Hors ligne"}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{formatResolution(tv.resolution)}</span>
                        </div>
                        
                        {tv.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{tv.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <Volume2 className="h-3 w-3" />
                          <span>Volume: {tv.volume}%</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Code: {tv.codeConnection}
                          </span>
                          
                          {tv.playlists.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {tv.playlists.length} playlist(s)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {viewMode === "grid" && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      Propriétaire: {tv.user.firstName} {tv.user.lastName}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
