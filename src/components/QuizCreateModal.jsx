import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  saveQuiz,
  generateQuizId,
  generateQuestionId,
} from "../data/quizStore";

const ROLES = [
  "ALL",
  "Operational Manager",
  "Field Technician",
  "Warehouse Manager",
  "Technician",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const emptyQuestion = () => ({
  id: generateQuestionId(),
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

export default function QuizCreateModal({ trainingMaterials = [], onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetedRole, setTargetedRole] = useState("ALL");
  const [difficulty, setDifficulty] = useState("Medium");
  const [linkedMaterialId, setLinkedMaterialId] = useState(""); // "" = standalone
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [expandedQ, setExpandedQ] = useState(0);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // ── Question Helpers ────────────────────────────────────────────────────────
  const updateQuestion = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = value;
        return { ...q, options };
      })
    );
  };

  const addQuestion = () => {
    const nq = emptyQuestion();
    setQuestions((prev) => [...prev, nq]);
    setExpandedQ(questions.length);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return; // keep at least 1
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setExpandedQ(Math.max(0, expandedQ - 1));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a quiz title.");
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one question.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1} is missing its question text.`);
        setExpandedQ(i);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          setError(`Question ${i + 1}, Option ${String.fromCharCode(65 + j)} is empty.`);
          setExpandedQ(i);
          return;
        }
      }
    }

    const quiz = {
      id: generateQuizId(),
      trainingMaterialId: linkedMaterialId || null,
      title: title.trim(),
      description: description.trim(),
      targetedRole,
      difficulty,
      questions,
    };

    saveQuiz(quiz);
    setSaved(true);
    setTimeout(() => {
      if (onSaved) onSaved(quiz);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl rounded-none border border-violet-500/20 bg-slate-900 shadow-2xl shadow-violet-950/30 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Top accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 shrink-0" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              Create New Quiz
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Build a quiz with multiple-choice questions. Link it to a training material or leave it standalone.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-6 space-y-5 flex-1">
            {error && (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-3 text-xs font-semibold text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {saved && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs font-semibold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Quiz saved successfully!
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quiz Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Field Safety & PPE Assessment"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this quiz covers..."
                rows="2"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none resize-none"
              />
            </div>

            {/* Role / Difficulty / Linked Material */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Target Role
                </label>
                <select
                  value={targetedRole}
                  onChange={(e) => setTargetedRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-sm outline-none cursor-pointer focus:ring-1 focus:ring-violet-500"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "ALL" ? "ALL Roles" : r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-sm outline-none cursor-pointer focus:ring-1 focus:ring-violet-500"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Link to Material
                </label>
                <select
                  value={linkedMaterialId}
                  onChange={(e) => setLinkedMaterialId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 text-sm outline-none cursor-pointer focus:ring-1 focus:ring-violet-500"
                >
                  <option value="">Standalone (no link)</option>
                  {trainingMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title.length > 30 ? m.title.slice(0, 30) + "…" : m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Questions ({questions.length})
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Question
                </button>
              </div>

              <div className="space-y-3">
                {questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden"
                  >
                    {/* Question Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedQ(expandedQ === qIdx ? -1 : qIdx)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-900/50"
                    >
                      <span className="text-sm font-semibold text-slate-300">
                        Q{qIdx + 1}.{" "}
                        <span className="text-slate-500 font-normal">
                          {q.text ? q.text.slice(0, 60) + (q.text.length > 60 ? "…" : "") : "Untitled question"}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {questions.length > 1 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQuestion(qIdx);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {expandedQ === qIdx ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {/* Question Body */}
                    {expandedQ === qIdx && (
                      <div className="px-4 pb-4 space-y-4 border-t border-slate-800/60">
                        {/* Question text */}
                        <div className="space-y-1.5 pt-3">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Question Text *
                          </label>
                          <textarea
                            value={q.text}
                            onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
                            placeholder="Type your question here..."
                            rows="2"
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-600 focus:border-violet-500/50 px-3 py-2 text-sm outline-none resize-none"
                          />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Answer Options (select the correct one)
                          </label>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuestion(qIdx, "correctIndex", optIdx)}
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold border transition-colors ${
                                  q.correctIndex === optIdx
                                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                                    : "border-slate-700 bg-slate-800/60 text-slate-400 hover:border-emerald-500/40"
                                }`}
                                title="Mark as correct answer"
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)}...`}
                                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-600 focus:border-violet-500/50 px-3 py-2 text-sm outline-none"
                              />
                            </div>
                          ))}
                          <p className="text-[10px] text-slate-600">
                            Click the letter badge to mark the correct answer.
                          </p>
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Explanation (shown after quiz completion)
                          </label>
                          <textarea
                            value={q.explanation}
                            onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                            placeholder="Explain why the correct answer is correct..."
                            rows="2"
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-600 focus:border-violet-500/50 px-3 py-2 text-sm outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 p-6 pt-4 border-t border-slate-800 shrink-0">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saved}
              className={`rounded-2xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/30 min-w-[140px] ${
                saved ? "opacity-60 cursor-not-allowed" : "hover:bg-violet-500"
              }`}
            >
              {saved ? "Saved!" : "Save Quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
