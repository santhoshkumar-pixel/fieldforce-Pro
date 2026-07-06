import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertTriangle,
  BookOpen,
  Clock,
} from "lucide-react";
import { saveQuizResult } from "../data/quizStore";

const PASS_THRESHOLD = 0.7; // 70%

const difficultyColors = {
  Easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

export default function QuizModal({ quiz, user, onClose }) {
  const [phase, setPhase] = useState("intro"); // intro | attempt | result
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null); // index of selected option for current Q
  const [answers, setAnswers] = useState([]); // [{questionId, selectedIndex, correct}]
  const [startTime, setStartTime] = useState(null);

  const totalQ = quiz.questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;

  // ── Start Quiz ──────────────────────────────────────────────────────────────
  const handleStart = () => {
    setPhase("attempt");
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setStartTime(Date.now());
  };

  // ── Select an option ────────────────────────────────────────────────────────
  const handleSelect = (idx) => {
    if (selected !== null) return; // already answered
    setSelected(idx);
  };

  // ── Next / Submit ───────────────────────────────────────────────────────────
  const handleNext = () => {
    const q = quiz.questions[currentQ];
    const correct = selected === q.correctIndex;
    const newAnswers = [
      ...answers,
      { questionId: q.id, selectedIndex: selected, correct },
    ];

    if (currentQ + 1 < totalQ) {
      setAnswers(newAnswers);
      setCurrentQ((prev) => prev + 1);
      setSelected(null);
    } else {
      // Submit — compute result
      const score = newAnswers.filter((a) => a.correct).length;
      const percentage = score / totalQ;
      const passed = percentage >= PASS_THRESHOLD;
      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const result = {
        quizId: quiz.id,
        userId: user?.id || user?.email || "anonymous",
        score,
        total: totalQ,
        percentage: Math.round(percentage * 100),
        passed,
        timeTaken,
        attemptedAt: new Date().toISOString(),
        answers: newAnswers,
      };
      saveQuizResult(result);
      setAnswers(newAnswers);
      setPhase("result");
    }
  };

  // ── Retake ──────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    handleStart();
  };

  // ── Computed score ──────────────────────────────────────────────────────────
  const score = answers.filter((a) => a.correct).length;
  const percentage = totalQ > 0 ? Math.round((score / totalQ) * 100) : 0;
  const passed = percentage >= PASS_THRESHOLD * 100;

  const currentQuestion = quiz.questions[currentQ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl rounded-none border border-violet-500/20 bg-slate-900 shadow-2xl shadow-violet-950/30 overflow-hidden"
      >
        {/* Top accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── INTRO PHASE ───────────────────────────────────────────────────── */}
        {phase === "intro" && (
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/30">
                  Quiz
                </span>
                {quiz.difficulty && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      difficultyColors[quiz.difficulty] || difficultyColors.Medium
                    }`}
                  >
                    {quiz.difficulty}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                  {quiz.targetedRole}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white pr-8">{quiz.title}</h2>
              {quiz.description && (
                <p className="text-sm text-slate-400 leading-relaxed">
                  {quiz.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className="text-2xl font-bold text-violet-400">{totalQ}</p>
                <p className="text-xs text-slate-500 mt-1">Questions</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">70%</p>
                <p className="text-xs text-slate-500 mt-1">Pass Mark</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className="text-2xl font-bold text-sky-400">~{Math.ceil(totalQ * 1.5)}m</p>
                <p className="text-xs text-slate-500 mt-1">Est. Time</p>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4 space-y-2">
              <p className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                Instructions
              </p>
              <ul className="space-y-1.5 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Read each question carefully and select the best answer.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Once you select an answer, you cannot change it.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Detailed explanations are shown after quiz completion.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">•</span>
                  Score 70% or above to pass this quiz.
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="rounded-2xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-violet-950/40 flex items-center gap-2"
              >
                Start Quiz
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── ATTEMPT PHASE ─────────────────────────────────────────────────── */}
        {phase === "attempt" && currentQuestion && (
          <div className="flex flex-col">
            {/* Progress Header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Question {currentQ + 1} of {totalQ}
                </span>
                <span className="text-xs font-semibold text-violet-400">
                  {Math.round(progress)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="p-6 space-y-5">
              <p className="text-base font-semibold text-white leading-relaxed">
                {currentQuestion.text}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  let optionStyle =
                    "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-white cursor-pointer";

                  if (selected !== null) {
                    if (idx === currentQuestion.correctIndex) {
                      optionStyle =
                        "border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
                    } else if (idx === selected && idx !== currentQuestion.correctIndex) {
                      optionStyle =
                        "border-rose-500/60 bg-rose-500/10 text-rose-300";
                    } else {
                      optionStyle = "border-slate-800 bg-slate-950/30 text-slate-500";
                    }
                  } else if (selected === idx) {
                    optionStyle =
                      "border-violet-500/60 bg-violet-500/10 text-violet-200";
                  }

                  const letter = String.fromCharCode(65 + idx); // A B C D
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={selected !== null}
                      className={`w-full text-left flex items-start gap-3 rounded-2xl border p-4 text-sm transition-all duration-200 ${optionStyle}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold border ${
                          selected !== null && idx === currentQuestion.correctIndex
                            ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
                            : selected !== null && idx === selected
                            ? "border-rose-500/60 bg-rose-500/20 text-rose-300"
                            : "border-slate-700 bg-slate-800/60 text-slate-400"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                      {selected !== null && idx === currentQuestion.correctIndex && (
                        <CheckCircle2 className="ml-auto shrink-0 h-4 w-4 text-emerald-400 mt-0.5" />
                      )}
                      {selected !== null && idx === selected && idx !== currentQuestion.correctIndex && (
                        <XCircle className="ml-auto shrink-0 h-4 w-4 text-rose-400 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Next / Submit */}
              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  onClick={handleNext}
                  disabled={selected === null}
                  className={`rounded-2xl px-6 py-2.5 text-sm font-bold flex items-center gap-2 transition-all ${
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
        )}

        {/* ── RESULT PHASE ──────────────────────────────────────────────────── */}
        {phase === "result" && (
          <div className="p-6 md:p-8 space-y-6 max-h-[88vh] overflow-y-auto">
            {/* Score Hero */}
            <div
              className={`rounded-2xl border p-6 text-center space-y-3 ${
                passed
                  ? "border-emerald-500/30 bg-emerald-500/8"
                  : "border-amber-500/30 bg-amber-500/8"
              }`}
            >
              {passed ? (
                <Trophy className="h-12 w-12 text-emerald-400 mx-auto" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
              )}
              <div>
                <p className="text-5xl font-black text-white">{percentage}%</p>
                <p className="text-slate-400 text-sm mt-1">
                  {score} out of {totalQ} correct
                </p>
              </div>
              <span
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                  passed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}
              >
                {passed ? "✓ Passed" : "⚠ Needs Review"}
              </span>
            </div>

            {/* Per-question Breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Question Breakdown
              </p>
              {quiz.questions.map((q, idx) => {
                const ans = answers[idx];
                const isCorrect = ans?.correct;
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      isCorrect
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : "border-rose-500/25 bg-rose-500/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-semibold text-white leading-snug flex-1">
                        Q{idx + 1}. {q.text}
                      </p>
                    </div>

                    <div className="pl-7 space-y-1">
                      {!isCorrect && (
                        <p className="text-xs text-rose-400">
                          Your answer:{" "}
                          <span className="font-semibold">
                            {q.options[ans?.selectedIndex] ?? "—"}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-emerald-400">
                        Correct answer:{" "}
                        <span className="font-semibold">
                          {q.options[q.correctIndex]}
                        </span>
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60 mt-2">
                          <span className="font-semibold text-slate-300">
                            Explanation:{" "}
                          </span>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 px-5 py-2.5 text-sm font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="rounded-2xl bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-violet-950/30"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
