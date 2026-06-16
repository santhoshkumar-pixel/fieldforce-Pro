import { X, CheckCircle2, XCircle, Clock, Trophy, HelpCircle, AlertTriangle } from "lucide-react";

export default function AttemptDetailModal({ attempt, quiz, onClose }) {
  if (!attempt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-3xl my-8 rounded-none border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* Top Strip */}
        <div className={`h-[3px] w-full ${attempt.passed ? "bg-emerald-500" : "bg-rose-500"}`} />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
              attempt.passed 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quiz Attempt Review</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed responses submitted by the participant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-1.5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 border-b border-slate-800 bg-slate-950/25">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Participant</p>
            <p className="text-sm font-bold text-white truncate">{attempt.userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{attempt.userRole}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quiz Title</p>
            <p className="text-sm font-semibold text-slate-200 truncate">{attempt.quizTitle || "Untitled Quiz"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score</p>
            <div className="flex items-center gap-2">
              <span className={`text-base font-black ${attempt.passed ? "text-emerald-400" : "text-rose-400"}`}>
                {attempt.percentage}%
              </span>
              <span className="text-xs text-slate-500">
                ({attempt.score}/{attempt.total})
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time & Date</p>
            <p className="text-xs font-medium text-slate-300">
              {new Date(attempt.attemptedAt).toLocaleDateString()} at{" "}
              {new Date(attempt.attemptedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[10px] text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duration: {attempt.timeTaken || 0}s
            </p>
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar">
          {!quiz ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/15">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">Detailed responses unavailable</p>
                <p className="text-xs text-slate-500 max-w-md">
                  This quiz has been deleted, so individual question details and choices cannot be retrieved.
                </p>
              </div>
            </div>
          ) : (
            quiz.questions.map((q, idx) => {
              const answerState = attempt.answers?.find((a) => a.questionId === q.id) || 
                                  attempt.answers?.[idx]; // Fallback to index if questionId mismatch
              const selectedIdx = answerState?.selectedIndex;
              const isCorrect = answerState?.correct;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-4 space-y-4 transition-colors ${
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
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      Q{idx + 1}. {q.text}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 pl-8">
                    {q.options.map((option, optIdx) => {
                      const isSelected = optIdx === selectedIdx;
                      const isOptionCorrect = optIdx === q.correctIndex;
                      
                      let optStyle = "border-slate-800 bg-slate-950/30 text-slate-500";
                      if (isOptionCorrect) {
                        optStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold";
                      } else if (isSelected && !isCorrect) {
                        optStyle = "border-rose-500/40 bg-rose-500/10 text-rose-300 font-semibold";
                      }

                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs ${optStyle}`}
                        >
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold border ${
                            isOptionCorrect
                              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                              : isSelected
                              ? "border-rose-500/50 bg-rose-500/20 text-rose-300"
                              : "border-slate-700 bg-slate-800 text-slate-400"
                          }`}>
                            {letter}
                          </span>
                          <span className="flex-1 leading-normal">{option}</span>
                          {isOptionCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-auto" />}
                          {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-rose-400 shrink-0 ml-auto" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 ml-8">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        <span className="font-bold text-slate-300">Explanation: </span>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-800 bg-slate-950/30">
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-800 hover:bg-slate-750 text-white px-6 py-2 text-sm font-semibold transition-colors"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
}
