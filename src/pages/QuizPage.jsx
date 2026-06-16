import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertTriangle,
  HelpCircle,
  Play,
  BookOpen,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getQuizzes,
  getQuizResult,
  saveQuizResult,
} from "../data/quizStore";

const PASS_THRESHOLD = 0.7;

const difficultyColors = {
  Easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function QuizPage() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load quiz — from nav state or from localStorage
  const [quiz, setQuiz] = useState(location.state?.quiz || null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (quiz) return;
    const all = getQuizzes();
    const found = all.find((q) => q.id === quizId);
    if (found) setQuiz(found);
    else setNotFound(true);
  }, [quizId]);

  // Quiz flow state
  const [phase, setPhase] = useState("intro"); // intro | attempt | result
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [result, setResult] = useState(null);

  // Previous attempt
  const prevResult = quiz
    ? getQuizResult(quiz.id, user?.id || user?.email || "anonymous")
    : null;

  const handleStart = () => {
    setPhase("attempt");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setStartTime(Date.now());
    setResult(null);
  };

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (!quiz) return;
    const q = quiz.questions[currentQ];
    const isCorrect = selected === q.correctIndex;
    const newAnswers = [
      ...answers,
      { questionId: q.id, selectedIndex: selected, correct: isCorrect },
    ];

    if (currentQ + 1 < quiz.questions.length) {
      setAnswers(newAnswers);
      setCurrentQ((prev) => prev + 1);
      setSelected(null);
    } else {
      const score = newAnswers.filter((a) => a.correct).length;
      const pct = score / quiz.questions.length;
      const passed = pct >= PASS_THRESHOLD;
      const timeTaken = Math.round((Date.now() - startTime) / 1000);
      const res = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        userId: user?.id || user?.email || "anonymous",
        userName: user?.name || user?.email || "Anonymous User",
        userRole: user?.role || "Field Technician",
        userZone: user?.zone || "Unknown Zone",
        score,
        total: quiz.questions.length,
        percentage: Math.round(pct * 100),
        passed,
        timeTaken,
        attemptedAt: new Date().toISOString(),
        answers: newAnswers,
      };
      saveQuizResult(res);
      setAnswers(newAnswers);
      setResult(res);
      setPhase("result");
    }
  };

  const handleRetake = () => handleStart();

  const fromMaterialId = location.state?.fromMaterialId;

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center px-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-base font-semibold text-slate-300">Quiz not found</p>
        <Link
          to="/training"
          state={{ tab: "quizzes" }}
          className="flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Training Portal
        </Link>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="h-10 w-10 rounded-full border-b-2 border-violet-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading quiz...</p>
      </div>
    );
  }

  const totalQ = quiz.questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;
  const currentQuestion = quiz.questions[currentQ];

  return (
    <div className="space-y-6 pb-10">
      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/training" state={{ tab: "quizzes" }} className="hover:text-white flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" />
          Training Portal
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/training" state={{ tab: "quizzes" }} className="hover:text-white">
          Quizzes
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-300 font-medium truncate max-w-xs">{quiz.title}</span>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          INTRO PHASE
      ════════════════════════════════════════════════════════════════════════ */}
      {phase === "intro" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-none border border-violet-500/25 bg-slate-900/80 backdrop-blur-xl">
              <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 border border-violet-500/30">
                    <GraduationCap className="h-7 w-7 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-violet-500/15 text-violet-400 border border-violet-500/30">
                        Knowledge Quiz
                      </span>
                      {quiz.difficulty && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${difficultyColors[quiz.difficulty] || difficultyColors.Medium}`}>
                          {quiz.difficulty}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {quiz.targetedRole === "ALL" ? "All Roles" : quiz.targetedRole}
                      </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                      {quiz.title}
                    </h1>
                    {quiz.description && (
                      <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                        {quiz.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      fromMaterialId
                        ? navigate(`/training/material/${fromMaterialId}`)
                        : navigate("/training", { state: { tab: "quizzes" } })
                    }
                    className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 text-sm font-semibold shrink-0 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Questions", value: totalQ, color: "text-violet-400" },
                { label: "Pass Mark", value: "70%", color: "text-amber-400" },
                { label: "Est. Time", value: `~${Math.ceil(totalQ * 1.5)}m`, color: "text-sky-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-none border border-slate-800 bg-slate-900/60 p-4 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Previous score banner */}
            {prevResult && (
              <div className={`rounded-none border p-4 flex items-center gap-4 ${
                prevResult.passed
                  ? "border-emerald-500/25 bg-emerald-500/8"
                  : "border-amber-500/25 bg-amber-500/8"
              }`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  prevResult.passed ? "bg-emerald-500/20" : "bg-amber-500/20"
                }`}>
                  <Trophy className={`h-5 w-5 ${prevResult.passed ? "text-emerald-400" : "text-amber-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Previous Attempt: {prevResult.percentage}%
                    {prevResult.passed ? " — Passed ✓" : " — Needs Review"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(prevResult.attemptedAt).toLocaleDateString()} •{" "}
                    {prevResult.score} / {prevResult.total} correct •{" "}
                    {prevResult.timeTaken}s
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-none border border-violet-500/15 bg-violet-500/5 p-6 space-y-3">
              <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                Instructions
              </p>
              <ul className="space-y-2 text-sm text-slate-400">
                {[
                  "Read each question carefully before selecting your answer.",
                  "Once you select an answer, it cannot be changed.",
                  "All questions must be answered before submitting.",
                  "Explanations and correct answers are revealed after completion.",
                  "Score 70% or above to pass this quiz.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Start button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  fromMaterialId
                    ? navigate(`/training/material/${fromMaterialId}`)
                    : navigate("/training", { state: { tab: "quizzes" } })
                }
                className="rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-5 py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="flex items-center gap-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 text-base font-bold shadow-lg shadow-violet-950/40 transition-colors"
              >
                <Play className="h-5 w-5" />
                {prevResult ? "Retake Quiz" : "Start Quiz"}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-none border border-slate-800 bg-slate-900/60">
              <div className="px-5 py-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quiz Details
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</p>
                  <p className="text-sm font-semibold text-white">Knowledge Assessment</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Difficulty</p>
                  <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold border ${difficultyColors[quiz.difficulty] || difficultyColors.Medium}`}>
                    {quiz.difficulty || "Standard"}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Audience</p>
                  <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">
                    {quiz.targetedRole === "ALL" ? "All Roles" : quiz.targetedRole}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Questions</p>
                  <p className="text-sm font-semibold text-white">{totalQ} Multiple Choice</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passing Score</p>
                  <p className="text-sm font-semibold text-amber-400">70% ({Math.ceil(totalQ * 0.7)} / {totalQ})</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          ATTEMPT PHASE
      ════════════════════════════════════════════════════════════════════════ */}
      {phase === "attempt" && currentQuestion && (
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main question area */}
          <div className="space-y-5">
            {/* Progress bar */}
            <div className="rounded-none border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">
                  Question {currentQ + 1} of {totalQ}
                </span>
                <span className="font-bold text-violet-400">{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-1">
                {quiz.questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < currentQ
                        ? answers[i]?.correct
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                        : i === currentQ
                        ? "bg-violet-500"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question */}
            <div className="rounded-none border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
                    Q{currentQ + 1}
                  </span>
                  <p className="text-lg md:text-xl font-bold text-white leading-relaxed">
                    {currentQuestion.text}
                  </p>
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                    let style =
                      "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-white cursor-pointer";
                    if (selected !== null) {
                      if (idx === currentQuestion.correctIndex) {
                        style = "border-emerald-500/70 bg-emerald-500/12 text-emerald-200 cursor-default";
                      } else if (idx === selected && idx !== currentQuestion.correctIndex) {
                        style = "border-rose-500/70 bg-rose-500/12 text-rose-200 cursor-default";
                      } else {
                        style = "border-slate-800 bg-slate-950/30 text-slate-600 cursor-default";
                      }
                    }
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={selected !== null}
                        className={`w-full text-left flex items-start gap-4 rounded-2xl border p-4 md:p-5 text-sm transition-all duration-200 ${style}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold border transition-colors ${
                          selected !== null && idx === currentQuestion.correctIndex
                            ? "border-emerald-500/60 bg-emerald-500/25 text-emerald-200"
                            : selected !== null && idx === selected
                            ? "border-rose-500/60 bg-rose-500/25 text-rose-200"
                            : "border-slate-600 bg-slate-800/60 text-slate-400"
                        }`}>
                          {letter}
                        </span>
                        <span className="leading-relaxed flex-1">{option}</span>
                        {selected !== null && idx === currentQuestion.correctIndex && (
                          <CheckCircle2 className="ml-auto shrink-0 h-5 w-5 text-emerald-400 mt-0.5" />
                        )}
                        {selected !== null && idx === selected && idx !== currentQuestion.correctIndex && (
                          <XCircle className="ml-auto shrink-0 h-5 w-5 text-rose-400 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation hint (after selection) */}
                {selected !== null && currentQuestion.explanation && (
                  <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hint</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    disabled={selected === null}
                    className={`flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all ${
                      selected === null
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/40"
                    }`}
                  >
                    {currentQ + 1 === totalQ ? "Submit Quiz" : "Next Question"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: question map */}
          <div className="space-y-4">
            <div className="rounded-none border border-slate-800 bg-slate-900/60">
              <div className="px-5 py-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Progress Map
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-5 gap-2">
                  {quiz.questions.map((_, i) => (
                    <div
                      key={i}
                      className={`flex h-9 w-full items-center justify-center rounded-xl text-xs font-bold border ${
                        i < currentQ
                          ? answers[i]?.correct
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                            : "border-rose-500/50 bg-rose-500/15 text-rose-400"
                          : i === currentQ
                          ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                          : "border-slate-700 bg-slate-800/40 text-slate-600"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-violet-500/40 border border-violet-500/60" />
                    <span>Current</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-emerald-500/40 border border-emerald-500/60" />
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-rose-500/40 border border-rose-500/60" />
                    <span>Incorrect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-slate-700 border border-slate-600" />
                    <span>Unanswered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          RESULT PHASE
      ════════════════════════════════════════════════════════════════════════ */}
      {phase === "result" && result && (
        <div className="space-y-6">
          {/* Score Hero */}
          <div className={`relative overflow-hidden rounded-none border ${
            result.passed
              ? "border-emerald-500/30 bg-emerald-500/8"
              : "border-amber-500/30 bg-amber-500/8"
          }`}>
            <div className={`h-[3px] w-full bg-gradient-to-r ${
              result.passed
                ? "from-emerald-500 to-teal-400"
                : "from-amber-500 to-orange-400"
            }`} />
            <div className="p-8 md:p-10 text-center space-y-4">
              <div className={`inline-flex h-24 w-24 items-center justify-center rounded-3xl ${
                result.passed ? "bg-emerald-500/20" : "bg-amber-500/20"
              }`}>
                {result.passed ? (
                  <Trophy className="h-12 w-12 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-7xl font-black text-white">{result.percentage}%</p>
                <p className="text-slate-400 mt-2">
                  {result.score} out of {result.total} questions correct
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold border ${
                  result.passed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  {result.passed ? "✓ Passed" : "⚠ Needs Review"}
                </span>
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-slate-400 bg-slate-800/60 border border-slate-700">
                  <Clock className="h-4 w-4" />
                  {result.timeTaken}s
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {result.passed
                  ? "Congratulations! You have demonstrated good knowledge of this topic."
                  : "Keep studying and try again. Review the explanations below."}
              </p>
            </div>
          </div>

          {/* Per-question breakdown */}
          <div className="rounded-none border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <span className="text-sm font-bold text-white">Answer Review</span>
            </div>
            <div className="p-6 space-y-4">
              {quiz.questions.map((q, idx) => {
                const ans = answers[idx];
                const isCorrect = ans?.correct;
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-5 space-y-4 ${
                      isCorrect
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : "border-rose-500/25 bg-rose-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <p className="text-base font-semibold text-white leading-snug">
                        Q{idx + 1}. {q.text}
                      </p>
                    </div>

                    <div className="grid gap-2 pl-8">
                      {!isCorrect && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-rose-400 font-semibold">Your answer:</span>
                          <span className="text-xs text-rose-300">
                            {q.options[ans?.selectedIndex] ?? "—"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-semibold">Correct answer:</span>
                        <span className="text-xs text-emerald-300">
                          {q.options[q.correctIndex]}
                        </span>
                      </div>
                      {q.explanation && (
                        <div className="mt-2 rounded-xl border border-slate-700/60 bg-slate-900/50 p-3">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="font-bold text-slate-300">Explanation: </span>
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetake}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-6 py-3 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Quiz
            </button>
            <div className="flex-1" />
            {fromMaterialId && (
              <button
                onClick={() => navigate(`/training/material/${fromMaterialId}`)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-6 py-3 text-sm font-semibold"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Material
              </button>
            )}
            <button
              onClick={() => navigate("/training", { state: { tab: "quizzes" } })}
              className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white px-8 py-3 text-sm font-bold shadow-lg shadow-violet-950/30"
            >
              <BookOpen className="h-4 w-4" />
              All Quizzes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
