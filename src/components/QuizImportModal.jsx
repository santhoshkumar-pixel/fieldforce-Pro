import { useState, useRef, useCallback } from "react";
import mammoth from "mammoth";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Trash2,
  Eye,
  Sparkles,
  HelpCircle,
  Info,
} from "lucide-react";
import { saveQuiz, generateQuizId, generateQuestionId } from "../data/quizStore";

// ── Expected table columns (case-insensitive) ──────────────────────────────────
// | Question | Option A | Option B | Option C | Option D | Correct Answer | Explanation |
// Correct Answer: A / B / C / D  OR  1 / 2 / 3 / 4

const REQUIRED_COLS = ["question", "option a", "option b", "option c", "option d", "correct answer"];
const OPTIONAL_COLS = ["explanation"];

const difficultyOptions = ["Easy", "Medium", "Hard"];
const roleOptions = ["ALL", "Operational Manager", "Field Technician", "Warehouse Manager", "Technician"];

// ── Generate a downloadable Word template ─────────────────────────────────────
function downloadTemplate() {
  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>Quiz Import Template</title>
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h2>Quiz Import Template</h2>
  <p>Fill in this table to import questions. Do not modify the header row.</p>
  <table>
    <thead>
      <tr>
        <th>Question</th>
        <th>Option A</th>
        <th>Option B</th>
        <th>Option C</th>
        <th>Option D</th>
        <th>Correct Answer</th>
        <th>Explanation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>What is the primary purpose of a Safety Data Sheet (SDS)?</td>
        <td>To record employee attendance</td>
        <td>To provide chemical hazard and safe handling information</td>
        <td>To list emergency contact numbers</td>
        <td>To document inventory levels</td>
        <td>B</td>
        <td>An SDS provides information on chemical hazards, safe handling, PPE requirements, and emergency procedures.</td>
      </tr>
      <tr>
        <td>Which PPE is required when working at heights above 2 metres?</td>
        <td>Safety glasses only</td>
        <td>Hard hat and safety shoes</td>
        <td>Full body harness with lanyard</td>
        <td>Gloves and earplugs</td>
        <td>C</td>
        <td>A full body harness with a lanyard is mandatory when working at heights above 2 metres to prevent fall injuries.</td>
      </tr>
      <tr>
        <td>FIFO stands for:</td>
        <td>Fixed Income, Fixed Output</td>
        <td>First In, First Out</td>
        <td>Fast Inventory, Field Operations</td>
        <td>Final Invoice, Final Order</td>
        <td>B</td>
        <td>FIFO (First In, First Out) is an inventory method where the oldest stock items are sold or used first.</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
  `;
  const blob = new Blob([htmlContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Quiz_Import_Template.doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Parse a raw row object into a Question ─────────────────────────────────────
function parseRow(row, rowIndex) {
  // Normalize keys to lowercase
  const normalized = {};
  for (const key of Object.keys(row)) {
    normalized[key.trim().toLowerCase()] = row[key];
  }

  const question = String(normalized["question"] || "").trim();
  const optA = String(normalized["option a"] || "").trim();
  const optB = String(normalized["option b"] || "").trim();
  const optC = String(normalized["option c"] || "").trim();
  const optD = String(normalized["option d"] || "").trim();
  const correctRaw = String(normalized["correct answer"] || "").trim().toUpperCase();
  const explanation = String(normalized["explanation"] || "").trim();

  const errors = [];
  if (!question) errors.push("Question text is empty");
  if (!optA) errors.push("Option A is empty");
  if (!optB) errors.push("Option B is empty");
  if (!optC) errors.push("Option C is empty");
  if (!optD) errors.push("Option D is empty");
  if (!correctRaw) errors.push("Correct Answer is empty");

  const answerMap = { A: 0, B: 1, C: 2, D: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
  const correctIndex = answerMap[correctRaw];
  if (correctRaw && correctIndex === undefined) {
    errors.push(`Correct Answer "${correctRaw}" is invalid (use A/B/C/D)`);
  }

  return {
    id: generateQuestionId(),
    rowIndex,
    text: question,
    options: [optA, optB, optC, optD],
    correctIndex: correctIndex ?? 0,
    explanation,
    errors,
    valid: errors.length === 0,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function QuizImportModal({ trainingMaterials = [], onClose, onSaved }) {
  const fileInputRef = useRef(null);

  // Step state: "upload" | "preview" | "configure" | "done"
  const [step, setStep] = useState("upload");

  // File state
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");

  // Parsed questions
  const [parsedQuestions, setParsedQuestions] = useState([]);

  // Quiz config
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");
  const [quizRole, setQuizRole] = useState("ALL");
  const [linkedMaterialId, setLinkedMaterialId] = useState("");

  // Preview expanded question
  const [expandedQ, setExpandedQ] = useState(null);

  // ── Parse HTML Table from Document ──────────────────────────────────────────
  const parseHtmlTable = (htmlString) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const table = doc.querySelector("table");
    if (!table) {
      throw new Error("No table found in the document. Please ensure your quiz questions are inside a table.");
    }

    const trs = Array.from(table.querySelectorAll("tr"));
    if (trs.length < 2) {
      throw new Error("The table must contain a header row and at least one question row.");
    }

    // Parse headers (from first row)
    const headers = Array.from(trs[0].querySelectorAll("th, td")).map((el) => el.textContent.trim().toLowerCase());

    // Validate headers
    const missingCols = REQUIRED_COLS.filter((rc) => !headers.includes(rc));
    if (missingCols.length > 0) {
      throw new Error(
        `Missing required columns: ${missingCols.map((c) => `"${c}"`).join(", ")}. Please use the provided template.`
      );
    }

    const rows = [];
    for (let i = 1; i < trs.length; i++) {
      const tds = Array.from(trs[i].querySelectorAll("td"));
      if (tds.length === 0) continue;

      // Check if row is entirely empty
      const isEmpty = tds.every((td) => !td.textContent.trim());
      if (isEmpty) continue;

      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = tds[index] ? tds[index].textContent.trim() : "";
      });
      rows.push(rowObj);
    }

    return rows;
  };

  // ── Parse Word File ─────────────────────────────────────────────────────────
  const parseFile = useCallback((file) => {
    setParseError("");
    setFileName(file.name);

    if (!file.name.match(/\.(docx|doc)$/i)) {
      setParseError("Invalid file type. Please upload a .docx or .doc file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;

        // Detect if ZIP (docx)
        const arr = new Uint8Array(arrayBuffer).subarray(0, 2);
        const isZip = arr[0] === 0x50 && arr[1] === 0x4B;

        let htmlContent = "";

        if (isZip) {
          const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
          htmlContent = result.value;
        } else {
          const decoder = new TextDecoder("utf-8");
          htmlContent = decoder.decode(arrayBuffer);
        }

        const rows = parseHtmlTable(htmlContent);

        if (rows.length === 0) {
          setParseError("The uploaded document table contains no data rows.");
          return;
        }

        const questions = rows.map((row, i) => parseRow(row, i + 2)); // row 1 = header
        setParsedQuestions(questions);

        // Auto-suggest title from file name
        const baseName = file.name.replace(/\.(docx|doc)$/i, "").replace(/[-_]/g, " ");
        setQuizTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));

        setStep("preview");
      } catch (err) {
        setParseError(err.message || "Failed to read the file. Please ensure it is a valid Word document.");
        console.error("Document parse error:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  // ── Remove a question from preview ──────────────────────────────────────────
  const removeQuestion = (idx) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Save Quiz ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!quizTitle.trim()) return;
    const validQuestions = parsedQuestions.filter((q) => q.valid);
    if (validQuestions.length === 0) return;

    const quiz = {
      id: generateQuizId(),
      title: quizTitle.trim(),
      description: quizDescription.trim(),
      difficulty: quizDifficulty,
      targetedRole: quizRole,
      trainingMaterialId: linkedMaterialId || null,
      questions: validQuestions.map(({ id, text, options, correctIndex, explanation }) => ({
        id,
        text,
        options,
        correctIndex,
        explanation,
      })),
      importedFrom: fileName,
      createdAt: new Date().toISOString(),
    };

    saveQuiz(quiz);
    setStep("done");
    onSaved?.();
  };

  const validCount = parsedQuestions.filter((q) => q.valid).length;
  const invalidCount = parsedQuestions.length - validCount;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-3xl my-8 rounded-none border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="relative flex items-start justify-between gap-4 p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="h-[3px] absolute top-0 left-0 w-full bg-gradient-to-r from-violet-500 via-emerald-500 to-sky-500" />
          <div className="flex items-center gap-3 pt-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Quiz from Word</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload a Word document to bulk-create quiz questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl p-1.5 transition-colors mt-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step Indicator ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-800 bg-slate-950/30">
          {[
            { key: "upload", label: "Upload File" },
            { key: "preview", label: "Preview Questions" },
            { key: "configure", label: "Configure Quiz" },
            { key: "done", label: "Done" },
          ].map((s, i, arr) => {
            const stepOrder = ["upload", "preview", "configure", "done"];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.key);
            const isActive = s.key === step;
            const isDone = thisIdx < currentIdx;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                      isActive
                        ? "bg-violet-500 text-white"
                        : isDone
                        ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isActive ? "text-white" : isDone ? "text-emerald-400" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-700 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1 — UPLOAD
        ══════════════════════════════════════════════════════════════════════ */}
        {step === "upload" && (
          <div className="p-6 space-y-5">
            {/* Template download banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/8 p-4">
              <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sky-300">
                  Use the official import template for best results
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Your Word document table must include these columns:{" "}
                  <span className="text-slate-200 font-mono">Question, Option A, Option B, Option C, Option D, Correct Answer</span>
                  {" "}(Correct Answer: A / B / C / D). The <span className="text-slate-200 font-mono">Explanation</span> column is optional.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 shrink-0 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 px-3 py-2 text-xs font-bold transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Template
              </button>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-12 cursor-pointer transition-all ${
                dragging
                  ? "border-emerald-500/70 bg-emerald-500/8 scale-[1.01]"
                  : "border-slate-700 bg-slate-950/30 hover:border-slate-600 hover:bg-slate-950/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className={`flex h-16 w-16 items-center justify-center rounded-3xl border transition-colors ${
                dragging ? "border-emerald-500/40 bg-emerald-500/15" : "border-slate-700 bg-slate-800/60"
              }`}>
                <FileText className={`h-8 w-8 transition-colors ${dragging ? "text-emerald-400" : "text-slate-400"}`} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white">
                  {dragging ? "Drop your file here" : "Drag & drop your Word file"}
                </p>
                <p className="text-xs text-slate-500">
                  or click to browse &nbsp;•&nbsp; Accepts .docx, .doc
                </p>
              </div>
            </div>

            {parseError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/25 bg-rose-500/8 p-4">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed">{parseError}</p>
              </div>
            )}

            {/* Format reference */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Required Column Format
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {["Question", "Option A", "Option B", "Option C", "Option D", "Correct Answer", "Explanation"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">
                          {h}
                          {!["Explanation"].includes(h) && (
                            <span className="ml-1 text-rose-400">*</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-400">
                      <td className="px-3 py-2 text-slate-300 max-w-[180px] truncate">What is LOTO?</td>
                      <td className="px-3 py-2">List, Order…</td>
                      <td className="px-3 py-2">Lock Out, Tag Out</td>
                      <td className="px-3 py-2">Level, Output…</td>
                      <td className="px-3 py-2">Locate, Operate…</td>
                      <td className="px-3 py-2 font-bold text-emerald-400">B</td>
                      <td className="px-3 py-2 text-slate-500 italic">Optional hint</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2 — PREVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {step === "preview" && (
          <div className="p-6 space-y-5">
            {/* Summary banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className="text-2xl font-black text-white">{parsedQuestions.length}</p>
                <p className="text-xs text-slate-500 mt-1">Total Rows</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-center">
                <p className="text-2xl font-black text-emerald-400">{validCount}</p>
                <p className="text-xs text-slate-500 mt-1">Valid Questions</p>
              </div>
              <div className={`rounded-2xl border p-4 text-center ${
                invalidCount > 0 ? "border-rose-500/20 bg-rose-500/8" : "border-slate-800 bg-slate-950/50"
              }`}>
                <p className={`text-2xl font-black ${invalidCount > 0 ? "text-rose-400" : "text-slate-500"}`}>
                  {invalidCount}
                </p>
                <p className="text-xs text-slate-500 mt-1">With Errors</p>
              </div>
            </div>

            {invalidCount > 0 && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300 leading-relaxed">
                  <span className="font-bold">{invalidCount} row{invalidCount !== 1 ? "s" : ""}</span> have
                  errors and will be skipped. You can remove them or fix your spreadsheet and re-upload.
                  Only {validCount} valid question{validCount !== 1 ? "s" : ""} will be imported.
                </p>
              </div>
            )}

            {/* Question list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-colors ${
                    q.valid
                      ? "border-slate-800 bg-slate-950/40"
                      : "border-rose-500/25 bg-rose-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Number */}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[10px] font-black border ${
                        q.valid
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug ${q.valid ? "text-white" : "text-rose-200"}`}>
                        {q.text || <span className="italic text-slate-500">No question text</span>}
                      </p>

                      {/* Errors */}
                      {q.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {q.errors.map((err, ei) => (
                            <p key={ei} className="text-[10px] text-rose-400 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {err}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Expanded view */}
                      {expandedQ === idx && q.valid && (
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {q.options.map((opt, oi) => (
                            <div
                              key={oi}
                              className={`rounded-xl px-3 py-2 text-xs border ${
                                oi === q.correctIndex
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold"
                                  : "border-slate-700 bg-slate-900/50 text-slate-400"
                              }`}
                            >
                              <span className="font-bold mr-1.5">
                                {String.fromCharCode(65 + oi)}.
                              </span>
                              {opt}
                              {oi === q.correctIndex && (
                                <CheckCircle2 className="inline h-3 w-3 ml-1.5 text-emerald-400" />
                              )}
                            </div>
                          ))}
                          {q.explanation && (
                            <div className="col-span-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-400 italic">
                              <span className="font-semibold text-slate-300 not-italic">Explanation: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {q.valid && (
                        <button
                          onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                          className="rounded-xl p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                          title="Preview options"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => removeQuestion(idx)}
                        className="rounded-xl p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove question"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {parsedQuestions.length === 0 && (
                <div className="py-10 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
                  All questions have been removed.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => { setStep("upload"); setFileName(""); setParsedQuestions([]); }}
                className="rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 text-sm font-semibold"
              >
                ← Re-upload
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setStep("configure")}
                disabled={validCount === 0}
                className={`flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-bold transition-colors ${
                  validCount > 0
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                Configure Quiz ({validCount} questions)
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3 — CONFIGURE
        ══════════════════════════════════════════════════════════════════════ */}
        {step === "configure" && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-400 font-semibold w-fit">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {validCount} questions ready to import
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quiz Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Field Safety Assessment"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Brief description of what this quiz assesses..."
                  rows="2"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500/50 px-4 py-2.5 text-sm outline-none resize-none"
                />
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {difficultyOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setQuizDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        quizDifficulty === d
                          ? d === "Easy"
                            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                            : d === "Medium"
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                            : "border-rose-500/50 bg-rose-500/15 text-rose-400"
                          : "border-slate-800 bg-slate-950 text-slate-500 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Target Role
                </label>
                <select
                  value={quizRole}
                  onChange={(e) => setQuizRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r === "ALL" ? "ALL Roles (General)" : r}</option>
                  ))}
                </select>
              </div>

              {/* Link to Training Module */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Link to Training Module (Optional)
                </label>
                <select
                  value={linkedMaterialId}
                  onChange={(e) => setLinkedMaterialId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 text-sm cursor-pointer"
                >
                  <option value="">— Standalone Quiz (no module link) —</option>
                  {trainingMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.type}] {m.title}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  When linked, this quiz will appear inside the training module's viewer page.
                </p>
              </div>
            </div>

            {/* File info */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              Importing from: <span className="text-slate-300 font-medium">{fileName}</span>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setStep("preview")}
                className="rounded-2xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 text-sm font-semibold"
              >
                ← Back
              </button>
              <div className="flex-1" />
              <button
                onClick={handleSave}
                disabled={!quizTitle.trim() || validCount === 0}
                className={`flex items-center gap-2 rounded-2xl px-8 py-2.5 text-sm font-bold transition-colors ${
                  quizTitle.trim() && validCount > 0
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Import {validCount} Questions
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 4 — DONE
        ══════════════════════════════════════════════════════════════════════ */}
        {step === "done" && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/15 border border-emerald-500/25">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Quiz Imported Successfully!</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                <span className="font-bold text-white">{validCount} questions</span> from{" "}
                <span className="font-mono text-xs text-slate-300">{fileName}</span> have been
                imported into{" "}
                <span className="font-bold text-violet-400">"{quizTitle}"</span>.
              </p>
              {linkedMaterialId && (
                <p className="text-xs text-sky-400 flex items-center justify-center gap-1.5 mt-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Linked to training module — quiz will appear in that module's viewer
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  // Reset for another import
                  setStep("upload");
                  setFileName("");
                  setParsedQuestions([]);
                  setQuizTitle("");
                  setQuizDescription("");
                  setQuizDifficulty("Medium");
                  setQuizRole("ALL");
                  setLinkedMaterialId("");
                }}
                className="rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-5 py-2.5 text-sm font-semibold"
              >
                Import Another
              </button>
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
