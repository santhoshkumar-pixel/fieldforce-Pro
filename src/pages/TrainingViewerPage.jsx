import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video as VideoIcon,
  Download,
  Clock,
  User,
  Tag,
  GraduationCap,
  Play,
  RotateCcw,
  Trophy,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { getQuizByMaterialId, getQuizResult } from "../data/quizStore";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const typeConfig = {
  TEXT: {
    label: "Text Lesson",
    icon: BookOpen,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    strip: "from-emerald-500 to-teal-400",
  },
  VIDEO: {
    label: "Video Tutorial",
    icon: VideoIcon,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    strip: "from-sky-500 to-indigo-500",
  },
  FILE: {
    label: "Document",
    icon: FileText,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    strip: "from-amber-500 to-orange-400",
  },
};

function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  try {
    if (url.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (url.includes("youtube.com/embed/")) return url;
  } catch (e) {}
  return "";
}

export default function TrainingViewerPage() {
  const { materialId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Material passed via navigation state (fast path) or fetched (fallback)
  const [material, setMaterial] = useState(location.state?.material || null);
  const [loading, setLoading] = useState(!material);
  const [error, setError] = useState("");
  const [linkedQuiz, setLinkedQuiz] = useState(null);
  const [prevQuizResult, setPrevQuizResult] = useState(null);

  // Fetch if not passed via state
  useEffect(() => {
    if (material) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const all = await api.training.getAll();
        const found = (all || []).find(
          (m) => String(m.id) === String(materialId)
        );
        if (found) {
          setMaterial(found);
        } else {
          setError("Training material not found.");
        }
      } catch (err) {
        setError("Failed to load training material.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [materialId]);

  // Load linked quiz once material is known
  useEffect(() => {
    if (!material) return;
    const quiz = getQuizByMaterialId(material.id);
    setLinkedQuiz(quiz);
    if (quiz) {
      const result = getQuizResult(
        quiz.id,
        user?.id || user?.email || "anonymous"
      );
      setPrevQuizResult(result);
    }
  }, [material, user]);

  const cfg = material ? typeConfig[material.type] || typeConfig.TEXT : null;
  const TypeIcon = cfg?.icon || BookOpen;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-b-2 border-sky-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading training content...</p>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-base font-semibold text-slate-300">
          {error || "Material not found"}
        </p>
        <Link
          to="/training"
          className="flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Training Portal
        </Link>
      </div>
    );
  }

  const fullFileUrl = material.filePath
    ? material.filePath.startsWith("http")
      ? material.filePath
      : `${VITE_API_URL}${material.filePath}`
    : "";

  return (
    <div className="space-y-6 pb-10">
      {/* ── Breadcrumb + Back ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          to="/training"
          className="hover:text-white flex items-center gap-1 transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Training Portal
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-300 font-medium truncate max-w-xs">
          {material.title}
        </span>
      </div>

      {/* ── Hero Header Card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-none border border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        {/* Color strip */}
        <div
          className={`h-[3px] w-full bg-gradient-to-r ${cfg.strip}`}
        />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Icon */}
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${cfg.bg} border ${cfg.border}`}
            >
              <TypeIcon className={`h-7 w-7 ${cfg.color}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                >
                  {cfg.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {material.targetedRole}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                {material.title}
              </h1>

              {material.description && (
                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                  {material.description}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {material.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(material.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {material.type}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  For: {material.targetedRole}
                </span>
              </div>
            </div>

            {/* Back button — top-right */}
            <button
              onClick={() => navigate("/training")}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 text-sm font-semibold shrink-0 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div className="space-y-4">
          {/* ── TEXT ─────────────────────────────────────────────────────────── */}
          {material.type === "TEXT" && (
            <div className="rounded-none border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Lesson Content</span>
              </div>
              <div className="p-6 md:p-8">
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 text-sm leading-[1.9] whitespace-pre-line font-[system-ui] selection:bg-emerald-500/20">
                  {material.content}
                </div>
              </div>
            </div>
          )}

          {/* ── VIDEO ────────────────────────────────────────────────────────── */}
          {material.type === "VIDEO" && (
            <div className="space-y-4">
              <div className="rounded-none border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <VideoIcon className="h-4 w-4 text-sky-400" />
                  <span className="text-sm font-bold text-white">Video Player</span>
                </div>
                <div className="p-4 md:p-6">
                  {material.filePath ? (
                    (() => {
                      const ytEmbed = getYouTubeEmbedUrl(material.filePath);
                      if (ytEmbed) {
                        return (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-slate-950/60">
                            <iframe
                              src={ytEmbed}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title={material.title}
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                          <video
                            src={fullFileUrl}
                            controls
                            controlsList="nodownload"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <div className="aspect-video flex items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 text-slate-500 text-sm">
                      Video source is unavailable
                    </div>
                  )}
                </div>
              </div>

              {material.content && (
                <div className="rounded-none border border-slate-800 bg-slate-900/60">
                  <div className="px-6 py-4 border-b border-slate-800">
                    <span className="text-sm font-bold text-white">Description & Notes</span>
                  </div>
                  <div className="p-6 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {material.content}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FILE ─────────────────────────────────────────────────────────── */}
          {material.type === "FILE" && (
            <div className="space-y-4">
              <div className="rounded-none border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      {material.fileName || "Document Viewer"}
                    </span>
                  </div>
                  {fullFileUrl && (
                    <a
                      href={fullFileUrl}
                      download={material.fileName || "document"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-bold transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  )}
                </div>
                <div className="p-4">
                  {(() => {
                    const pathLower = material.filePath?.toLowerCase() || "";
                    const isPdf = pathLower.endsWith(".pdf");
                    const isImg =
                      pathLower.endsWith(".png") ||
                      pathLower.endsWith(".jpg") ||
                      pathLower.endsWith(".jpeg") ||
                      pathLower.endsWith(".gif");

                    if (isPdf && fullFileUrl) {
                      return (
                        <div className="rounded-2xl overflow-hidden border border-slate-800">
                          <iframe
                            src={fullFileUrl}
                            className="w-full"
                            style={{ height: "calc(100vh - 380px)", minHeight: "500px" }}
                            title={material.title}
                          />
                        </div>
                      );
                    }
                    if (isImg && fullFileUrl) {
                      return (
                        <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                          <img
                            src={fullFileUrl}
                            alt={material.title}
                            className="max-h-[600px] max-w-full object-contain rounded-xl"
                          />
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col items-center justify-center py-16 space-y-5 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/20">
                          <FileText className="h-9 w-9 text-amber-400/80" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">
                            {material.fileName || "Training Document"}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            This document type cannot be previewed in the browser.
                          </p>
                        </div>
                        {fullFileUrl && (
                          <a
                            href={fullFileUrl}
                            download={material.fileName || "document"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 px-6 py-3 text-sm font-bold transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download & Open Document
                          </a>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── Linked Quiz CTA ───────────────────────────────────────────────── */}
          {linkedQuiz && (
            <div className="rounded-none border border-violet-500/30 bg-violet-500/8 backdrop-blur-sm overflow-hidden">
              <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/30">
                  <GraduationCap className="h-7 w-7 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">
                    Knowledge Check — {linkedQuiz.title}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {linkedQuiz.questions.length} questions •{" "}
                    {linkedQuiz.difficulty || "Standard"} difficulty • 70% to pass
                  </p>
                  {prevQuizResult && (
                    <span
                      className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${
                        prevQuizResult.passed
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      <Trophy className="h-3 w-3" />
                      Last attempt: {prevQuizResult.percentage}%{" "}
                      {prevQuizResult.passed ? "— Passed ✓" : "— Needs Review"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    navigate(`/training/quiz/${linkedQuiz.id}`, {
                      state: { quiz: linkedQuiz, fromMaterialId: material.id },
                    })
                  }
                  className="flex items-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-violet-950/30 transition-colors shrink-0"
                >
                  {prevQuizResult ? (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      Retake Quiz
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Take Quiz
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar Info Panel ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* About card */}
          <div className="rounded-none border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About This Material
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Format
                </p>
                <div className="flex items-center gap-2">
                  <TypeIcon className={`h-4 w-4 ${cfg.color}`} />
                  <span className="text-sm font-semibold text-white">{cfg.label}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Target Audience
                </p>
                <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">
                  {material.targetedRole}
                </span>
              </div>
              {material.createdAt && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Published
                  </p>
                  <p className="text-sm text-slate-300">
                    {new Date(material.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {material.fileName && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    File Name
                  </p>
                  <p className="text-sm text-slate-300 break-all">{material.fileName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quiz status card */}
          {linkedQuiz && (
            <div className="rounded-none border border-violet-500/20 bg-violet-500/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-violet-500/15">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Quiz Status
                </span>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm font-semibold text-white">{linkedQuiz.title}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Questions</span>
                  <span className="font-bold text-white">{linkedQuiz.questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pass Mark</span>
                  <span className="font-bold text-white">70%</span>
                </div>
                {prevQuizResult ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Last Score</span>
                      <span
                        className={`font-bold ${
                          prevQuizResult.passed ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {prevQuizResult.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Status</span>
                      <span
                        className={`font-bold ${
                          prevQuizResult.passed ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {prevQuizResult.passed ? "Passed ✓" : "Needs Review"}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">Not attempted yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
