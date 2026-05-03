"use client";

import { useState, useRef, useEffect, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Monitor,
  Image as ImageIcon,
  Video,
  X,
  Check,
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Play,
  Loader2,
  ArrowRight,
  ArrowLeft,
  FileImage,
  Trash2,
  Radio,
  HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api, { baseURL, getToken } from "@/scripts/fetch.api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaFile {
  id: string;
  uri: string;
  type: "image" | "video";
  name: string;
  size: number;
  duration?: number;
}

interface Television {
  id: string;
  name: string;
  location: string;
  status: "ONLINE" | "OFFLINE";
  model?: string;
  lastSeen?: string;
  user?: { firstName: string; lastName: string };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const createPlaylist = async (playlistData: any) => {
  const token = await getToken();
  try {
    const formData = new FormData();
    const playlistInfo = {
      titre: playlistData.title,
      televisions: Array.isArray(playlistData.televisions)
        ? playlistData.televisions
        : [playlistData.televisions],
      nombreMedias: playlistData.nombreMedias,
      isActive: playlistData.isActive,
      schedule: {
        startDate: playlistData?.startDate,
        endDate: playlistData?.endDate,
        endTime: playlistData?.endTime,
        startTime: playlistData?.startTime,
        daysOfWeek: playlistData?.daysOfWeek ?? [],
      },
      items: playlistData.items.map((item: any) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        duration: item.duration,
      })),
    };
    formData.append("playlistData", JSON.stringify(playlistInfo));
    for (const item of playlistData.items) {
      if (item.uri && item.uri.startsWith("blob:")) {
        try {
          const res = await fetch(item.uri);
          const blob = await res.blob();
          const file = new File([blob], item.name, {
            type: item.type === "video" ? "video/mp4" : "image/jpeg",
          });
          formData.append("files", file);
        } catch (e) {
          console.error(`Erreur blob pour ${item.name}:`, e);
        }
      }
    }
    const response = await fetch(`${baseURL}/playlists/create/multiple`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Erreur création playlist:", error);
    throw error;
  }
};

// ─── Validation ───────────────────────────────────────────────────────────────

const playlistSchema = Yup.object().shape({
  title: Yup.string()
    .min(2, "Le titre doit contenir au moins 2 caractères")
    .required("Le titre est obligatoire"),
  description: Yup.string(),
  isActive: Yup.boolean().default(false),
});

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
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", bgClass)}>
          <Icon className={cn("h-4 w-4", iconClass)} />
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  iconClass = "text-primary",
  bgClass = "bg-primary/10",
}: {
  icon: ElementType;
  label: string;
  value: string;
  iconClass?: string;
  bgClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0", bgClass)}>
        <Icon className={cn("h-3.5 w-3.5", iconClass)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

const STEPS = ["Informations", "Médias", "Résumé"];
const STEP_IDX: Record<string, number> = { form: 0, media: 1, summary: 2 };

function StepIndicator({ current }: { current: string }) {
  const idx = STEP_IDX[current] ?? 0;
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
            i < idx  ? "bg-emerald-500 text-white"
            : i === idx ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
          )}>
            {i < idx ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          <span className={cn(
            "text-xs font-medium hidden sm:block",
            i === idx ? "text-foreground" : "text-muted-foreground"
          )}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn("h-px w-5 mx-0.5", i < idx ? "bg-emerald-500" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreatePlaylist() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "media" | "summary">("form");
  const [televisions, setTelevisions] = useState<Television[]>([]);
  const [selectedTV, setSelectedTV] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [scheduleConfig, setScheduleConfig] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    startTime: "08:00",
    endTime: "20:00",
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTVs, setIsFetchingTVs] = useState(false);
  const [showTVDialog, setShowTVDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formik = useFormik({
    initialValues: { title: "", description: "", isActive: false },
    validationSchema: playlistSchema,
    onSubmit: () => {
      if (step === "form") setStep("media");
      else if (step === "media") setStep("summary");
      else handleSubmit();
    },
  });

  const fetchTVs = async () => {
    setIsFetchingTVs(true);
    try {
      const response = await api.get("/televisions/dashboard");
      setTelevisions(response.data);
    } catch {
      toast.error("Erreur lors de la récupération des téléviseurs");
    } finally {
      setIsFetchingTVs(false);
    }
  };

  useEffect(() => { fetchTVs(); }, []);

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploadProgress(0);
    const files = Array.from(e.target.files);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      const mediaFile: MediaFile = {
        id: `${Date.now()}-${i}`,
        uri: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "video",
        name: file.name,
        size: file.size,
        duration: file.type.startsWith("video/") ? Math.random() * 60 + 10 : undefined,
      };
      setSelectedMedia((prev) => [...prev, mediaFile]);
      await new Promise((r) => setTimeout(r, 100));
    }
    setTimeout(() => setUploadProgress(0), 800);
    toast.success(`${files.length} média(s) ajouté(s)`);
  };

  const removeMedia = (id: string) =>
    setSelectedMedia((prev) => prev.filter((m) => m.id !== id));

  const toggleTV = (id: string) =>
    setSelectedTV((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const toggleDay = (day: number) =>
    setScheduleConfig((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));

  const toISODateTime = (date: string, time: string) =>
    new Date(`${date}T${time}:00`).toISOString();

  const handleSubmit = async () => {
    if (selectedTV.length === 0) {
      toast.error("Veuillez sélectionner au moins un écran");
      return;
    }
    setIsLoading(true);
    try {
      await createPlaylist({
        title: formik.values.title,
        description: formik.values.description,
        isActive: formik.values.isActive,
        televisions: selectedTV,
        nombreMedias: selectedMedia.length,
        startDate: !formik.values.isActive
          ? toISODateTime(scheduleConfig.startDate, scheduleConfig.startTime)
          : undefined,
        endDate: !formik.values.isActive && scheduleConfig.endDate
          ? toISODateTime(scheduleConfig.endDate, scheduleConfig.endTime)
          : undefined,
        startTime: !formik.values.isActive ? scheduleConfig.startTime : undefined,
        endTime: !formik.values.isActive ? scheduleConfig.endTime : undefined,
        daysOfWeek: !formik.values.isActive ? scheduleConfig.daysOfWeek : [],
        items: selectedMedia.map((m) => ({
          type: m.type,
          name: m.name,
          size: m.size,
          duration: m.duration || 30000,
          uri: m.uri,
        })),
      });
      toast.success("Playlist créée avec succès !");
      navigate("/dashboard");
    } catch {
      toast.error("Erreur lors de la création de la playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalDuration = () =>
    selectedMedia.reduce((t, m) => t + (m.duration || 30), 0);
  const getTotalSize = () =>
    selectedMedia.reduce((t, m) => t + m.size, 0);

  const inputDateClass =
    "w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Retour
        </Button>
        <StepIndicator current={step} />
      </div>

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold">Nouvelle playlist</h1>
        <p className="text-sm text-muted-foreground">
          {step === "form" && "Renseignez les informations de votre playlist"}
          {step === "media" && "Ajoutez les médias à diffuser sur vos écrans"}
          {step === "summary" && "Vérifiez et confirmez la création"}
        </p>
      </div>

      {/* ── STEP 1: Informations ── */}
      {step === "form" && (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          {/* Titre */}
          <SectionCard icon={FileImage} title="Titre de la playlist" iconClass="text-blue-500" bgClass="bg-blue-500/10">
            <div className="space-y-1.5">
              <Input
                id="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                placeholder="Ex: Playlist du matin"
                className={cn(formik.errors.title && "border-destructive focus-visible:ring-destructive")}
              />
              <div className="flex justify-between text-xs">
                {formik.errors.title ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formik.errors.title}
                  </span>
                ) : <span />}
                <span className="text-muted-foreground">{formik.values.title.length} car.</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs text-muted-foreground">
                Description <span className="italic">(optionnel)</span>
              </Label>
              <Textarea
                id="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Décrivez votre playlist..."
                rows={3}
                className="resize-none"
              />
            </div>
          </SectionCard>

          {/* Écrans */}
          <SectionCard icon={Monitor} title="Écrans cibles" iconClass="text-purple-500" bgClass="bg-purple-500/10">
            <Button
              type="button"
              variant="outline"
              className={cn("w-full justify-between", selectedTV.length > 0 && "border-primary/50 bg-primary/5")}
              onClick={() => setShowTVDialog(true)}
              disabled={isFetchingTVs}
            >
              {isFetchingTVs ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des écrans...
                </span>
              ) : selectedTV.length > 0 ? (
                <span className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {selectedTV.length} écran{selectedTV.length > 1 ? "s" : ""} sélectionné{selectedTV.length > 1 ? "s" : ""}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">Sélectionner des écrans</span>
              )}
              {selectedTV.length > 0 && <Check className="h-4 w-4 text-emerald-500" />}
            </Button>
          </SectionCard>

          {/* Statut */}
          <SectionCard
            icon={formik.values.isActive ? Radio : Clock}
            title="Statut de diffusion"
            iconClass={formik.values.isActive ? "text-emerald-500" : "text-amber-500"}
            bgClass={formik.values.isActive ? "bg-emerald-500/10" : "bg-amber-500/10"}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {formik.values.isActive ? "Activation immédiate" : "Garder en brouillon"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formik.values.isActive
                    ? "La playlist sera diffusée dès sa création"
                    : "Vous pourrez l'activer plus tard"}
                </p>
              </div>
              <Switch
                checked={formik.values.isActive}
                onCheckedChange={(val) => formik.setFieldValue("isActive", val)}
              />
            </div>
          </SectionCard>

          {/* Planification */}
          {!formik.values.isActive && (
            <SectionCard icon={Calendar} title="Planification" iconClass="text-orange-500" bgClass="bg-orange-500/10">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date de début
                    </Label>
                    <input
                      type="date"
                      value={scheduleConfig.startDate}
                      onChange={(e) => setScheduleConfig((p) => ({ ...p, startDate: e.target.value }))}
                      className={inputDateClass}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date de fin
                      <span className="italic">(optionnel)</span>
                    </Label>
                    <input
                      type="date"
                      value={scheduleConfig.endDate}
                      onChange={(e) => setScheduleConfig((p) => ({ ...p, endDate: e.target.value }))}
                      className={inputDateClass}
                      min={scheduleConfig.startDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Heure de début
                    </Label>
                    <input
                      type="time"
                      value={scheduleConfig.startTime}
                      onChange={(e) => setScheduleConfig((p) => ({ ...p, startTime: e.target.value }))}
                      className={inputDateClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Heure de fin
                    </Label>
                    <input
                      type="time"
                      value={scheduleConfig.endTime}
                      onChange={(e) => setScheduleConfig((p) => ({ ...p, endTime: e.target.value }))}
                      className={inputDateClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Jours de diffusion</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_LABELS.map((label, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={cn(
                          "h-9 w-9 rounded-lg text-xs font-semibold transition-colors",
                          scheduleConfig.daysOfWeek.includes(idx)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {scheduleConfig.daysOfWeek.length === 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Sélectionnez au moins un jour
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={!formik.values.title.trim()}>
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 2: Médias ── */}
      {step === "media" && (
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaSelect}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors border-border hover:border-primary/50 hover:bg-primary/5"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Glissez vos fichiers ici</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ou cliquez pour sélectionner des images et vidéos
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                JPG · PNG · MP4 · MOV
              </Badge>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/90 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <div className="w-48 space-y-1">
                  <Progress value={uploadProgress} className="h-1.5" />
                  <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
                </div>
              </div>
            )}
          </div>

          {selectedMedia.length > 0 && (
            <div className="space-y-4">
              {/* Stat badges */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-blue-500/10 text-blue-600 border border-blue-200 hover:bg-blue-500/10">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {selectedMedia.filter((m) => m.type === "image").length} image{selectedMedia.filter((m) => m.type === "image").length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge className="bg-purple-500/10 text-purple-600 border border-purple-200 hover:bg-purple-500/10">
                    <Video className="h-3 w-3 mr-1" />
                    {selectedMedia.filter((m) => m.type === "video").length} vidéo{selectedMedia.filter((m) => m.type === "video").length !== 1 ? "s" : ""}
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/10">
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.round(getTotalDuration())}s
                  </Badge>
                  <Badge className="bg-orange-500/10 text-orange-600 border border-orange-200 hover:bg-orange-500/10">
                    <HardDrive className="h-3 w-3 mr-1" />
                    {formatFileSize(getTotalSize())}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedia([])}
                  className="text-destructive hover:text-destructive text-xs h-7"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Tout supprimer
                </Button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {selectedMedia.map((media) => (
                  <div key={media.id} className="group relative">
                    <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                      {media.type === "image" ? (
                        <img src={media.uri} alt={media.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video src={media.uri} className="w-full h-full object-cover opacity-70" />
                          <Play className="absolute h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium truncate mt-1 px-0.5">{media.name}</p>
                    <p className="text-xs text-muted-foreground px-0.5">{formatFileSize(media.size)}</p>
                    <button
                      onClick={() => removeMedia(media.id)}
                      className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep("form")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button onClick={() => setStep("summary")} disabled={selectedMedia.length === 0}>
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Résumé ── */}
      {step === "summary" && (
        <div className="space-y-4">
          {/* Summary card — inspired by mobile app */}
          <div className="relative rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
            <div className="p-5 space-y-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Récapitulatif
              </h3>
              <SummaryRow
                icon={FileImage}
                label="Titre"
                value={formik.values.title}
                iconClass="text-blue-500"
                bgClass="bg-blue-500/10"
              />
              {formik.values.description && (
                <SummaryRow
                  icon={FileImage}
                  label="Description"
                  value={formik.values.description}
                  iconClass="text-blue-500"
                  bgClass="bg-blue-500/10"
                />
              )}
              <SummaryRow
                icon={Monitor}
                label="Écrans"
                value={`${selectedTV.length} écran${selectedTV.length > 1 ? "s" : ""} sélectionné${selectedTV.length > 1 ? "s" : ""}`}
                iconClass="text-purple-500"
                bgClass="bg-purple-500/10"
              />
              <SummaryRow
                icon={Video}
                label="Médias"
                value={`${selectedMedia.length} élément${selectedMedia.length > 1 ? "s" : ""} · ${Math.round(getTotalDuration())}s · ${formatFileSize(getTotalSize())}`}
                iconClass="text-emerald-500"
                bgClass="bg-emerald-500/10"
              />
              <SummaryRow
                icon={formik.values.isActive ? Radio : Clock}
                label="Statut"
                value={
                  formik.values.isActive
                    ? "Activation immédiate"
                    : `Programmé · ${scheduleConfig.startDate} · ${scheduleConfig.startTime} → ${scheduleConfig.endTime}`
                }
                iconClass={formik.values.isActive ? "text-emerald-500" : "text-amber-500"}
                bgClass={formik.values.isActive ? "bg-emerald-500/10" : "bg-amber-500/10"}
              />
            </div>
          </div>

          {/* Media preview */}
          <SectionCard
            icon={Video}
            title={`Aperçu des médias (${selectedMedia.length})`}
            iconClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
          >
            <div className="flex flex-wrap gap-2">
              {selectedMedia.slice(0, 10).map((media) => (
                <div key={media.id}>
                  {media.type === "image" ? (
                    <img src={media.uri} className="h-12 w-12 rounded-lg object-cover border" />
                  ) : (
                    <div className="h-12 w-12 bg-black rounded-lg flex items-center justify-center border">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {selectedMedia.length > 10 && (
                <div className="h-12 w-12 rounded-lg bg-muted border flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">
                    +{selectedMedia.length - 10}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Validation warnings */}
          {selectedTV.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Retournez à l'étape 1 pour sélectionner au moins un écran.
            </div>
          )}
          {!formik.values.isActive && scheduleConfig.daysOfWeek.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-200 rounded-lg px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Retournez à l'étape 1 pour sélectionner au moins un jour de diffusion.
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep("media")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                selectedTV.length === 0 ||
                (!formik.values.isActive && scheduleConfig.daysOfWeek.length === 0)
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Créer la playlist
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── TV Dialog ── */}
      <Dialog open={showTVDialog} onOpenChange={setShowTVDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                <Monitor className="h-4 w-4 text-purple-500" />
              </div>
              Sélectionner des écrans
            </DialogTitle>
          </DialogHeader>

          {selectedTV.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">
                {selectedTV.length} écran{selectedTV.length > 1 ? "s" : ""} sélectionné{selectedTV.length > 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTV([])}
                className="text-xs h-7 text-muted-foreground"
              >
                Tout désélectionner
              </Button>
            </div>
          )}

          <ScrollArea className="max-h-80 pr-1">
            {isFetchingTVs ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement des écrans...</p>
              </div>
            ) : televisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <Monitor className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Aucun écran disponible</p>
                  <button onClick={fetchTVs} className="text-xs text-primary hover:underline mt-1">
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {televisions.map((tv) => {
                  const isSelected = selectedTV.includes(tv.id);
                  return (
                    <button
                      key={tv.id}
                      onClick={() => toggleTV(tv.id)}
                      className={cn(
                        "relative flex items-center gap-3 w-full p-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary/50 bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-accent/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />
                      )}
                      <div className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border",
                        tv.status === "ONLINE"
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-muted border-border"
                      )}>
                        <Monitor className={cn(
                          "h-5 w-5",
                          tv.status === "ONLINE" ? "text-emerald-500" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{tv.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full flex-shrink-0",
                            tv.status === "ONLINE" ? "bg-emerald-500" : "bg-gray-400"
                          )} />
                          <span className={cn(
                            "text-xs font-medium",
                            tv.status === "ONLINE" ? "text-emerald-600" : "text-muted-foreground"
                          )}>
                            {tv.status === "ONLINE" ? "En ligne" : "Hors ligne"}
                          </span>
                          {tv.location && (
                            <>
                              <span className="text-muted-foreground text-xs">·</span>
                              <span className="text-xs text-muted-foreground truncate">{tv.location}</span>
                            </>
                          )}
                        </div>
                        {tv.user && (
                          <p className="text-xs text-muted-foreground mt-0.5">
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

          {selectedTV.length > 0 && (
            <div className="pt-2 border-t">
              <Button className="w-full" onClick={() => setShowTVDialog(false)}>
                <Check className="mr-2 h-4 w-4" />
                Confirmer ({selectedTV.length} écran{selectedTV.length > 1 ? "s" : ""})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
