import { useRef, useState } from "react";
import { Camera, CheckCircle, FileVideo, Send, Upload, X } from "lucide-react";

export default function ReviewModal({ open, ticketId, onClose, onSubmit }) {
 const [message, setMessage] = useState("");
 const [mediaFile, setMediaFile] = useState(null);
 const [mediaPreview, setMediaPreview] = useState(null);
 const [mediaType, setMediaType] = useState(null); // "image" | "video"
 const fileInputRef = useRef(null);

 const resetState = () => {
 setMessage("");
 setMediaFile(null);
 setMediaPreview(null);
 setMediaType(null);
 };

 const handleClose = () => {
 resetState();
 onClose();
 };

 const handleFileChange = (e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setMediaFile(file);
 const url = URL.createObjectURL(file);
 setMediaPreview(url);
 setMediaType(file.type.startsWith("video") ? "video" : "image");
 };

 const handleRemoveMedia = () => {
 setMediaFile(null);
 setMediaPreview(null);
 setMediaType(null);
 if (fileInputRef.current) fileInputRef.current.value = "";
 };

 const handleSubmit = () => {
 const file = mediaFile;
 const type = mediaType;
 const msg = message;
 resetState();
 onClose();

 if (file) {
 // Convert to base64 so it can be stored and shown in notifications
 const reader = new FileReader();
 reader.onload = (e) => {
 onSubmit({
 ticketId,
 message: msg,
 mediaFileName: file.name,
 mediaDataUrl: e.target.result,
 mediaType: type,
 });
 };
 reader.readAsDataURL(file);
 } else {
 onSubmit({ ticketId, message: msg, mediaFileName: null, mediaDataUrl: null, mediaType: null });
 }
 };

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="absolute inset-0 bg-black/70 backdrop-blur-sm"
 onClick={handleClose}
 />

 {/* Modal */}
 <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/50">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-amber-900/30 to-slate-900 px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/40">
 <CheckCircle className="h-4 w-4 text-amber-400" />
 </div>
 <div>
 <h2 className="text-base font-semibold text-white">Review Submission</h2>
 <p className="text-xs text-slate-400">Upload completion proof & notes</p>
 </div>
 </div>
 <button
 type="button"
 onClick={handleClose}
 className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white "
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {/* Body */}
 <div className="space-y-4 p-6">
 {/* Ticket ID badge */}
 <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5">
 <span className="text-xs text-slate-400">Ticket:</span>
 <span className="text-xs font-bold text-sky-400">{ticketId}</span>
 </div>

 {/* Status info */}
 <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
 <CheckCircle className="h-4 w-4 shrink-0 text-amber-400" />
 <p className="text-xs text-amber-300">
 Submit your work completion evidence. A <strong>Complete</strong> button will appear after submission.
 </p>
 </div>

 {/* Upload area */}
 <div>
 <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
 Photo / Video
 </label>
 {!mediaPreview ? (
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/40 py-8 text-slate-400 hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-400"
 >
 <Upload className="h-7 w-7" />
 <span className="text-sm font-medium">Click to upload photo or video</span>
 <span className="text-xs text-slate-500">JPG, PNG, MP4, MOV supported</span>
 </button>
 ) : (
 <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
 {mediaType === "video" ? (
 <video
 src={mediaPreview}
 controls
 className="max-h-48 w-full object-cover"
 />
 ) : (
 <img
 src={mediaPreview}
 alt="Upload preview"
 className="max-h-48 w-full object-cover"
 />
 )}
 <div className="flex items-center justify-between bg-slate-800/90 px-3 py-2">
 <div className="flex items-center gap-2 text-xs text-slate-300">
 {mediaType === "video" ? (
 <FileVideo className="h-3.5 w-3.5 text-amber-400" />
 ) : (
 <Camera className="h-3.5 w-3.5 text-amber-400" />
 )}
 <span className="truncate max-w-[180px]">{mediaFile?.name}</span>
 </div>
 <button
 type="button"
 onClick={handleRemoveMedia}
 className="rounded-md p-1 text-slate-400 hover:bg-slate-700 hover:text-red-400"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>
 )}
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*,video/*"
 className="hidden"
 onChange={handleFileChange}
 />
 </div>

 {/* Message */}
 <div>
 <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
 Completion Notes
 </label>
 <textarea
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 placeholder="Describe the work completed, parts replaced, observations..."
 rows={3}
 className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 "
 />
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-900/80 px-6 py-4">
 <button
 type="button"
 onClick={handleClose}
 className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 "
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleSubmit}
 className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-500 "
 >
 <Send className="h-4 w-4" />
 Submit Review
 </button>
 </div>
 </div>
 </div>
 );
}
