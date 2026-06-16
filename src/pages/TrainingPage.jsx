import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  FileText,
  Video as VideoIcon,
  BookOpen,
  Trash2,
  Eye,
  X,
  Upload,
  Check,
  AlertCircle,
  Filter,
  Clock,
  Sparkles,
  HelpCircle,
  Trophy,
  Play,
  GraduationCap,
  RotateCcw,
  Star,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { Card, CardBody } from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";
import { getZoneRegion } from "../utils/roleHelpers";
import QuizCreateModal from "../components/QuizCreateModal";
import QuizImportModal from "../components/QuizImportModal";
import AttemptDetailModal from "../components/AttemptDetailModal";
import {
  getQuizzes,
  getQuizByMaterialId,
  getQuizResult,
  deleteQuiz,
  getAllQuizResults,
} from "../data/quizStore";

const difficultyColors = {
  Easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function TrainingPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission("training.manage");
  const canSeeAllOrRegional = user?.role === "Super Admin" || user?.role === "Operational Manager";
  const navigate = useNavigate();
  const location = useLocation();

  // ── Tab State — restore from navigation state (e.g. returning from quiz page) ──
  const [activeTab, setActiveTab] = useState(
    location.state?.tab || "materials"
  ); // "materials" | "quizzes"

  // ── Training Materials State ───────────────────────────────────────────────
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL_RELEVANT");

  // Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("TEXT");
  const [formTargetRole, setFormTargetRole] = useState("ALL");
  const [formContent, setFormContent] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formFilePath, setFormFilePath] = useState("");

  // File upload state
  const [videoSourceType, setVideoSourceType] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // ── Quiz State ─────────────────────────────────────────────────────────────
  const [quizzes, setQuizzes] = useState([]);
  const [quizSearch, setQuizSearch] = useState("");
  const [isQuizCreateOpen, setIsQuizCreateOpen] = useState(false);
  const [isQuizImportOpen, setIsQuizImportOpen] = useState(false);

  // ── Quiz Attempts State ────────────────────────────────────────────────────
  const [attempts, setAttempts] = useState([]);
  const [attemptSearch, setAttemptSearch] = useState("");
  const [attemptStatusFilter, setAttemptStatusFilter] = useState("ALL");
  const [attemptRoleFilter, setAttemptRoleFilter] = useState("ALL");
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const refreshAttempts = useCallback(() => {
    setAttempts(getAllQuizResults());
  }, []);

  // ── Load quizzes and attempts ──────────────────────────────────────────────
  const refreshQuizzes = useCallback(() => {
    setQuizzes(getQuizzes());
    refreshAttempts();
  }, [refreshAttempts]);

  useEffect(() => {
    refreshQuizzes();
  }, [refreshQuizzes]);

  // ── Load materials from backend ────────────────────────────────────────────
  const fetchMaterials = async () => {
    setLoading(true);
    setError("");
    try {
      const roleParam = isAdmin ? "" : user?.role;
      const data = await api.training.getAll(roleParam);
      setMaterials(data || []);
    } catch (err) {
      console.error("Error fetching training materials:", err);
      setError(
        "Failed to load training materials. Please verify the backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user, isAdmin]);

  // ── Handle deletion (training material) ───────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this training material?")) return;
    try {
      await api.training.delete(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete training material:", err);
      alert("Failed to delete training material. Please try again.");
    }
  };

  // ── Handle quiz deletion ───────────────────────────────────────────────────
  const handleDeleteQuiz = (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    deleteQuiz(id);
    refreshQuizzes();
  };

  // ── File Upload Handlers ───────────────────────────────────────────────────
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);
    setError("");
    try {
      const response = await api.training.uploadFile(file);
      setFormFilePath(response.url);
      setFormFileName(response.fileName || file.name);
      setUploadSuccess(true);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Submit Handler (training material creation) ────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please enter a title");
      return;
    }
    const materialPayload = {
      title: formTitle,
      description: formDescription,
      type: formType,
      targetedRole: formTargetRole,
      content: formType === "TEXT" ? formContent : null,
      fileName:
        formType === "FILE" || (formType === "VIDEO" && videoSourceType === "upload")
          ? formFileName
          : null,
      filePath: formType !== "TEXT" ? formFilePath : null,
    };
    try {
      await api.training.create(materialPayload);
      setIsAddOpen(false);
      resetForm();
      fetchMaterials();
    } catch (err) {
      console.error("Failed to create training material:", err);
      alert("Failed to save training material. Please try again.");
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("TEXT");
    setFormTargetRole("ALL");
    setFormContent("");
    setFormFileName("");
    setFormFilePath("");
    setUploadSuccess(false);
    setError("");
  };

  // ── Filtered materials ─────────────────────────────────────────────────────
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description &&
          m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = typeFilter === "ALL" || m.type === typeFilter;
      let matchesRole = true;
      if (isAdmin && roleFilter !== "ALL_RELEVANT") {
        matchesRole = m.targetedRole === roleFilter;
      } else if (!isAdmin) {
        const normTarget =
          m.targetedRole === "Technician" || m.targetedRole === "Field Technician"
            ? "Field Technician"
            : m.targetedRole;
        const normUserRole =
          user?.role === "Technician" || user?.role === "Field Technician"
            ? "Field Technician"
            : user?.role;
        matchesRole = normTarget === "ALL" || normTarget === normUserRole;
      }
      return matchesSearch && matchesType && matchesRole;
    });
  }, [materials, searchQuery, typeFilter, roleFilter, isAdmin, user]);

  // ── Filtered quizzes ───────────────────────────────────────────────────────
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(quizSearch.toLowerCase()));
      return matchesSearch;
    });
  }, [quizzes, quizSearch]);


  // ── Get previous result for a quiz ────────────────────────────────────────
  const getPreviousResult = (quizId) => {
    return getQuizResult(quizId, user?.id || user?.email || "anonymous");
  };

  // ── Stats for quizzes tab ──────────────────────────────────────────────────
  const quizStats = useMemo(() => {
    const total = quizzes.length;
    const attempted = quizzes.filter(
      (q) => getPreviousResult(q.id) !== null
    ).length;
    const passed = quizzes.filter((q) => {
      const r = getPreviousResult(q.id);
      return r && r.passed;
    }).length;
    return { total, attempted, passed };
  }, [quizzes, user]);

  // ── Filtered attempts ──────────────────────────────────────────────────────
  const filteredAttempts = useMemo(() => {
    let baseAttempts = [];

    if (user?.role === "Super Admin") {
      // Super Admin sees all attempts
      baseAttempts = attempts;
    } else if (user?.role === "Operational Manager") {
      // Operational Manager sees attempts from their region/zone only
      baseAttempts = attempts.filter((a) => getZoneRegion(a.userZone) === getZoneRegion(user?.zone));
    } else {
      // All other users (including Admin, Warehouse Manager, Field Technicians, etc.)
      // only see their own attempts
      baseAttempts = attempts.filter((a) => a.userId === user?.id || a.userId === user?.email);
    }

    return baseAttempts
      .filter((a) => {
        const title = a.quizTitle || "";
        const name = a.userName || "";
        const matchesSearch =
          title.toLowerCase().includes(attemptSearch.toLowerCase()) ||
          name.toLowerCase().includes(attemptSearch.toLowerCase());

        const matchesStatus =
          attemptStatusFilter === "ALL" ||
          (attemptStatusFilter === "PASSED" && a.passed) ||
          (attemptStatusFilter === "FAILED" && !a.passed);

        const matchesRole =
          attemptRoleFilter === "ALL" || a.userRole === attemptRoleFilter;

        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));
  }, [attempts, attemptSearch, attemptStatusFilter, attemptRoleFilter, user]);

  // ── Stats for attempts tab ─────────────────────────────────────────────────
  const attemptStats = useMemo(() => {
    const list = filteredAttempts;
    const total = list.length;
    const passed = list.filter((a) => a.passed).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const avgScore =
      total > 0
        ? Math.round(list.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / total)
        : 0;
    return { total, passed, passRate, avgScore };
  }, [filteredAttempts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Portal"
        description="Access training courses, operational documentations, manuals, instructional videos, and knowledge assessments."
        action={
          isAdmin && (
            <div className="flex items-center gap-2">
              {activeTab === "quizzes" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsQuizImportOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    Import Word
                  </button>
                  <button
                    onClick={() => setIsQuizCreateOpen(true)}
                    className="flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 shadow-lg shadow-violet-950/20"
                  >
                    <Plus className="h-4 w-4" />
                    Add Quiz
                  </button>
                </div>
              )}
              {activeTab === "materials" && (user?.role === "Super Admin" || user?.role === "Operational Manager") && (
                <button
                  onClick={() => {
                    resetForm();
                    setIsAddOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20"
                >
                  <Plus className="h-4 w-4" />
                  Add Material
                </button>
              )}
            </div>
          )
        }
      />

      {/* ── Tab Switcher ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("materials")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "materials"
              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Training Materials
        </button>
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "quizzes"
              ? "bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Quizzes
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === "quizzes" ? "bg-violet-500/20 text-violet-300" : "bg-slate-800 text-slate-400"
          }`}>
            {quizzes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("attempts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "attempts"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Quiz Attempts
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === "attempts" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
          }`}>
            {filteredAttempts.length}
          </span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TRAINING MATERIALS TAB
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "materials" && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-900/40 p-4 border border-slate-800/80 rounded-3xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-950/50 p-1 border border-slate-800 rounded-2xl flex items-center gap-1">
                {["ALL", "TEXT", "FILE", "VIDEO"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                      typeFilter === t
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white border border-transparent"
                    }`}
                  >
                    {t === "ALL" ? "All Formats" : t}
                  </button>
                ))}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1 border border-slate-800 rounded-2xl">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer py-1"
                  >
                    <option value="ALL_RELEVANT">Show All Roles</option>
                    <option value="ALL">ALL Roles (General)</option>
                    <option value="Operational Manager">Operational Manager</option>
                    <option value="Field Technician">Field Technician</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Technician">Technician</option>
                  </select>
                </div>
              )}
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courseware or topics..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 outline-none"
              />
            </div>
          </div>

          {/* Materials Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="rounded-full h-10 w-10 border-b-2 border-sky-500 animate-spin" />
              <p className="text-sm text-slate-500">Retrieving training catalog...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 border border-slate-850 bg-slate-950/20 rounded-3xl px-4 text-center">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
              <p className="text-sm text-slate-400 font-medium">{error}</p>
              <button
                onClick={fetchMaterials}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-slate-850 bg-slate-950/20 rounded-3xl px-4 text-center">
              <BookOpen className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-base text-slate-400 font-semibold">
                No training modules found
              </p>
              <p className="text-xs text-slate-500 mt-1">
                There are no courses matching your filter or query.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((m) => {
                const isText = m.type === "TEXT";
                const isVideo = m.type === "VIDEO";
                const isFile = m.type === "FILE";
                const hasLinkedQuiz = !!getQuizByMaterialId(m.id);

                return (
                  <Card
                    key={m.id}
                    className="group relative flex flex-col justify-between shadow-lg cursor-pointer overflow-hidden glass-card"
                    onClick={() =>
                      navigate(`/training/material/${m.id}`, {
                        state: { material: m },
                      })
                    }
                  >
                    {/* Type Glow Strip */}
                    <div
                      className={`absolute top-0 left-0 w-full h-[3px] ${
                        isText
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : isVideo
                          ? "bg-gradient-to-r from-sky-500 to-indigo-500"
                          : "bg-gradient-to-r from-amber-500 to-orange-400"
                      }`}
                    />
                    <CardBody className="flex-1 flex flex-col p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                            isText
                              ? "bg-emerald-500/10 text-emerald-400"
                              : isVideo
                              ? "bg-sky-500/10 text-sky-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {isText && <BookOpen className="h-5 w-5" />}
                          {isVideo && <VideoIcon className="h-5 w-5" />}
                          {isFile && <FileText className="h-5 w-5" />}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasLinkedQuiz && (
                            <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/25">
                              <HelpCircle className="h-2.5 w-2.5" />
                              Quiz
                            </span>
                          )}
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                            {m.targetedRole}
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(m.id, e)}
                              className="flex items-center justify-center rounded-xl p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete material"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <h3 className="text-base font-bold text-white group-hover:text-sky-300 line-clamp-2">
                          {m.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {m.description || "No description provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Reference"}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-sky-400 font-semibold text-xs group-hover:underline">
                          <span>
                            {isText && "Read Article"}
                            {isVideo && "Watch Video"}
                            {isFile && "View Document"}
                          </span>
                          <Eye className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          QUIZZES TAB
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          {/* Quiz Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Quizzes", value: quizStats.total, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              { label: "Attempted", value: quizStats.attempted, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
              { label: "Passed", value: quizStats.passed, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-4 text-center ${stat.bg}`}
              >
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quiz Search */}
          <div className="flex items-center gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-3xl backdrop-blur-xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={quizSearch}
                onChange={(e) => setQuizSearch(e.target.value)}
                placeholder="Search quizzes..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-violet-500/50 outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 ml-auto">
              {filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? "zes" : ""} available
            </p>
          </div>

          {/* Quizzes Grid */}
          {filteredQuizzes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-slate-850 bg-slate-950/20 rounded-3xl px-4 text-center">
              <HelpCircle className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-base text-slate-400 font-semibold">No quizzes found</p>
              <p className="text-xs text-slate-500 mt-1">
                {isAdmin ? 'Click "Add Quiz" to create your first quiz.' : "No quizzes match your search."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => {
                const prevResult = getPreviousResult(quiz.id);
                const linkedMaterial = materials.find(
                  (m) => m.id === quiz.trainingMaterialId
                );

                return (
                  <div
                    key={quiz.id}
                    className="group relative flex flex-col glass-card rounded-2xl overflow-hidden border border-slate-800/60 shadow-lg hover:border-violet-500/30 transition-all duration-200"
                  >
                    {/* Violet top strip */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

                    <div className="p-5 flex flex-col flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 flex-1 justify-end">
                          {quiz.difficulty && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                difficultyColors[quiz.difficulty] || difficultyColors.Medium
                              }`}
                            >
                              {quiz.difficulty}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            {quiz.targetedRole === "ALL" ? "All Roles" : quiz.targetedRole}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                              className="flex items-center justify-center rounded-xl p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete quiz"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1 flex-1">
                        <h3 className="text-base font-bold text-white group-hover:text-violet-300 line-clamp-2">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {quiz.description || "No description provided."}
                        </p>
                      </div>

                      {/* Linked material badge */}
                      {linkedMaterial && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/8 border border-sky-500/20">
                          <BookOpen className="h-3 w-3 text-sky-400 shrink-0" />
                          <span className="text-[10px] text-sky-400 font-semibold truncate">
                            Linked: {linkedMaterial.title}
                          </span>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" />
                          <span>{quiz.questions.length} Questions</span>
                        </div>
                        {prevResult && (
                          <div
                            className={`flex items-center gap-1 font-semibold ${
                              prevResult.passed ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {prevResult.passed ? (
                              <Trophy className="h-3 w-3" />
                            ) : (
                              <Star className="h-3 w-3" />
                            )}
                            <span>Last: {prevResult.percentage}%</span>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-slate-800/60">
                        <button
                          onClick={() =>
                            navigate(`/training/quiz/${quiz.id}`, {
                              state: { quiz },
                            })
                          }
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600/90 hover:bg-violet-500 text-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-violet-950/30 transition-all"
                        >
                          {prevResult ? (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              Retake Quiz
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Start Quiz
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          QUIZ ATTEMPTS TAB
      ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "attempts" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Attempts", value: attemptStats.total, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              { label: "Passed Attempts", value: attemptStats.passed, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Average Score", value: `${attemptStats.avgScore}%`, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
              { label: "Pass Rate", value: `${attemptStats.passRate}%`, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-2xl border p-4 text-center ${stat.bg}`}>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center bg-slate-900/40 p-4 border border-slate-800/80 rounded-3xl backdrop-blur-xl">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={attemptSearch}
                onChange={(e) => setAttemptSearch(e.target.value)}
                placeholder={canSeeAllOrRegional ? "Search by participant or quiz..." : "Search by quiz..."}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 outline-none"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-500 font-semibold">Status:</span>
                <select
                  value={attemptStatusFilter}
                  onChange={(e) => setAttemptStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer py-1"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PASSED">Passed Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>
              </div>

              {/* Role Filter (Admin Only) */}
              {canSeeAllOrRegional && (
                <div className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1 border border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-500 font-semibold">Role:</span>
                  <select
                    value={attemptRoleFilter}
                    onChange={(e) => setAttemptRoleFilter(e.target.value)}
                    className="bg-transparent border-none text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer py-1"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="Operational Manager">Operational Manager</option>
                    <option value="Field Technician">Field Technician</option>
                    <option value="Warehouse Manager">Warehouse Manager</option>
                    <option value="Technician">Technician</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {canSeeAllOrRegional && <th className="px-6 py-4">Participant</th>}
                    <th className="px-6 py-4">Quiz Title</th>
                    <th className="px-6 py-4">Attempt Date</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAttempts.map((att, index) => (
                    <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                      {canSeeAllOrRegional && (
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-white">{att.userName}</p>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 mt-0.5">
                              {att.userRole}
                            </span>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-200">
                          {att.quizTitle || quizzes.find(q => q.id === att.quizId)?.title || "Deleted Quiz"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(att.attemptedAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${att.passed ? "text-emerald-400" : "text-rose-400"}`}>
                            {att.percentage}%
                          </span>
                          <span className="text-xs text-slate-500">
                            ({att.score}/{att.total})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {att.timeTaken || 0}s
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          att.passed
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        }`}>
                          {att.passed ? "Passed" : "Failed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedAttempt(att)}
                          className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 transition-colors"
                        >
                          Review Answers
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAttempts.length === 0 && (
                    <tr>
                      <td colSpan={canSeeAllOrRegional ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                        No quiz attempt records found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ── Add Training Material Modal (Admin) ────────────────────────────────── */}
      {isAddOpen && (user?.role === "Super Admin" || user?.role === "Operational Manager") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="absolute inset-0 cursor-default" onClick={() => setIsAddOpen(false)} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl rounded-none border border-slate-800 bg-slate-900/95 p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl p-1.5"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                  Add Training Material
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload courses, video tutorials, or compliance instructions targeted to selected roles.
                </p>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-4 text-xs font-semibold text-rose-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Material Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Field Sensor Recalibration Guide"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Short Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="A brief summary detailing what the technician will learn in this course."
                    rows="2"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none resize-none"
                  />
                </div>

                {/* Type & Role Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Course Format
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => {
                        setFormType(e.target.value);
                        setFormFileName("");
                        setFormFilePath("");
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                    >
                      <option value="TEXT">TEXT (Article / SOP Instructions)</option>
                      <option value="FILE">FILE (PDF Manual / Handout)</option>
                      <option value="VIDEO">VIDEO (Tutorial / Screen Share)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Target Audience (Role)
                    </label>
                    <select
                      value={formTargetRole}
                      onChange={(e) => setFormTargetRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                    >
                      <option value="ALL">ALL Roles (General)</option>
                      <option value="Operational Manager">Operational Manager</option>
                      <option value="Field Technician">Field Technician</option>
                      <option value="Warehouse Manager">Warehouse Manager</option>
                      <option value="Technician">Technician</option>
                    </select>
                  </div>
                </div>

                {/* TEXT content */}
                {formType === "TEXT" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Article Instructions (Supports Markdown / Multi-line)
                    </label>
                    <textarea
                      required
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="Write safety procedures, steps, or copy/paste instructions..."
                      rows="6"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none resize-y font-sans"
                    />
                  </div>
                )}

                {/* FILE content */}
                {formType === "FILE" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Upload Document
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 px-4 py-2.5 text-sm cursor-pointer"
                        >
                          <Upload className="h-4 w-4" />
                          Choose file...
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleFileUpload(e, "file")}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                          className="hidden"
                        />
                        {uploading && (
                          <div className="flex items-center gap-2 text-xs text-sky-400">
                            <div className="rounded-full h-3 w-3 border-b-2 border-sky-400 animate-spin" />
                            <span>Uploading file...</span>
                          </div>
                        )}
                        {uploadSuccess && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                            <Check className="h-4 w-4" />
                            <span>Uploaded successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          File Display Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formFileName}
                          onChange={(e) => setFormFileName(e.target.value)}
                          placeholder="e.g. Safety_Checklist.pdf"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Saved File Path / URL
                        </label>
                        <input
                          type="text"
                          required
                          readOnly
                          value={formFilePath}
                          placeholder="Path generated on file upload"
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-500 px-4 py-2.5 text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* VIDEO content */}
                {formType === "VIDEO" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Video Source
                      </label>
                      <div className="flex items-center gap-4 bg-slate-950/60 p-1 border border-slate-800 rounded-xl w-fit">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceType("upload");
                            setFormFilePath("");
                            setFormFileName("");
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            videoSourceType === "upload"
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/20"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVideoSourceType("link");
                            setFormFilePath("");
                            setFormFileName("");
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            videoSourceType === "link"
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/20"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Video Link / Embed
                        </button>
                      </div>
                    </div>

                    {videoSourceType === "upload" ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                            Upload Video (MP4 / WebM)
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => videoInputRef.current?.click()}
                              disabled={uploading}
                              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 px-4 py-2.5 text-sm cursor-pointer"
                            >
                              <Upload className="h-4 w-4" />
                              Select video...
                            </button>
                            <input
                              type="file"
                              ref={videoInputRef}
                              onChange={(e) => handleFileUpload(e, "video")}
                              accept="video/mp4,video/webm,video/ogg"
                              className="hidden"
                            />
                            {uploading && (
                              <div className="flex items-center gap-2 text-xs text-sky-400">
                                <div className="rounded-full h-3 w-3 border-b-2 border-sky-400 animate-spin" />
                                <span>Uploading video file...</span>
                              </div>
                            )}
                            {uploadSuccess && (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                                <Check className="h-4 w-4" />
                                <span>Uploaded successfully</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Video File Name
                            </label>
                            <input
                              type="text"
                              required
                              value={formFileName}
                              onChange={(e) => setFormFileName(e.target.value)}
                              placeholder="e.g. Dashboard_Tutorial.mp4"
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Uploaded Video Path
                            </label>
                            <input
                              type="text"
                              required
                              readOnly
                              value={formFilePath}
                              placeholder="Path generated on video upload"
                              className="w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-500 px-4 py-2.5 text-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Video URL / YouTube Link
                          </label>
                          <input
                            type="url"
                            required
                            value={formFilePath}
                            onChange={(e) => setFormFilePath(e.target.value)}
                            placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Video Notes / Description
                          </label>
                          <textarea
                            value={formContent}
                            onChange={(e) => setFormContent(e.target.value)}
                            placeholder="Optional video review notes or timestamp details."
                            rows="2"
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-650 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-800">
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 px-5 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20 min-w-[120px] ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quiz Create Modal (Admin) ─────────────────────────────────────────── */}
      {isQuizCreateOpen && (
        <QuizCreateModal
          trainingMaterials={materials}
          onClose={() => setIsQuizCreateOpen(false)}
          onSaved={() => {
            refreshQuizzes();
            setIsQuizCreateOpen(false);
          }}
        />
      )}

      {/* ── Quiz Import Modal (Admin — Excel Upload) ───────────────────────────── */}
      {isQuizImportOpen && (
        <QuizImportModal
          trainingMaterials={materials}
          onClose={() => setIsQuizImportOpen(false)}
          onSaved={() => {
            refreshQuizzes();
          }}
        />
      )}

      {/* ── Quiz Attempt Detail Modal ─────────────────────────────────────────── */}
      {selectedAttempt && (
        <AttemptDetailModal
          attempt={selectedAttempt}
          quiz={quizzes.find((q) => q.id === selectedAttempt.quizId)}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </div>
  );
}
