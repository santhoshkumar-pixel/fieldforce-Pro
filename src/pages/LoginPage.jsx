import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Activity, Lock, Mail, Shield, Check, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ADMIN_CREDENTIALS } from "../data/mockData";

export default function LoginPage() {
 const { login, isAuthenticated } = useAuth();
 const [email, setEmail] = useState(ADMIN_CREDENTIALS.email);
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);
 const [showForgotPassword, setShowForgotPassword] = useState(false);
 const [resetEmail, setResetEmail] = useState("");
 const [resetSuccess, setResetSuccess] = useState(false);
 const [resetLoading, setResetLoading] = useState(false);
 const [resetError, setResetError] = useState("");

 const handleResetSubmit = async (e) => {
 e.preventDefault();
 setResetLoading(true);
 setResetError("");
 try {
 // Simulate sending reset link
 await new Promise((resolve) => setTimeout(resolve, 1200));
 setResetSuccess(true);
 } catch (err) {
 setResetError("Failed to request password reset. Please try again.");
 } finally {
 setResetLoading(false);
 }
 };

 useEffect(() => {
 const saved = localStorage.getItem("theme");
 const isDark = saved !== null ? saved === "dark" : true;
 if (isDark) {
 document.documentElement.classList.add("dark");
 document.documentElement.style.colorScheme = "dark";
 } else {
 document.documentElement.classList.remove("dark");
 document.documentElement.style.colorScheme = "light";
 }
 }, []);

 if (isAuthenticated) return <Navigate to="/" replace />;

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError("");
 try {
 const result = await login(email, password);
 if (!result.success) {
 setError(result.error);
 }
 } catch (err) {
 setError("An unexpected error occurred. Please try again.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex min-h-screen items-center justify-center bg-slate-900 dark:bg-slate-950 px-4">
 <div className="absolute inset-0 overflow-hidden">
 <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-sky-500/5 blur-3xl" />
 <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
 </div>

 <div className="relative w-full max-w-md">
 <div className="mb-8 text-center">
 <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-slate-800">
 <Activity className="h-7 w-7 text-sky-400" />
 </div>
 <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
 FieldForce Pro
 </p>
 <h1 className="mt-2 text-3xl font-semibold text-white">
 Operations Console
 </h1>
 <p className="mt-2 text-sm text-slate-400">
 Retearn operations control center
 </p>
 </div>

 {showForgotPassword ? (
 <form
 onSubmit={handleResetSubmit}
 className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-xl "
 >
 <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
 <Lock className="h-4 w-4 text-sky-400" />
 Reset Password
 </div>

 {resetSuccess ? (
 <div className="text-center space-y-4 py-4">
 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
 <Check className="h-6 w-6" />
 </div>
 <h3 className="text-lg font-medium text-white">Reset Link Sent</h3>
 <p className="text-sm text-slate-400 leading-relaxed">
 We've sent a password reset link to <br />
 <span className="font-mono text-sky-300">{resetEmail}</span>
 </p>
 <button
 type="button"
 onClick={() => {
 setShowForgotPassword(false);
 setResetSuccess(false);
 }}
 className="mt-6 w-full rounded-2xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500"
 >
 Back to Sign In
 </button>
 </div>
 ) : (
 <>
 <p className="mb-6 text-sm text-slate-400 leading-relaxed">
 Enter your email address below and we'll send you instructions to reset your password.
 </p>

 {resetError && (
 <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
 {resetError}
 </div>
 )}

 <label className="block text-sm text-slate-400">
 Email Address
 <div className="relative mt-2">
 <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 type="email"
 value={resetEmail}
 onChange={(e) => setResetEmail(e.target.value)}
 placeholder="name@fieldforce.io"
 className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
 required
 />
 </div>
 </label>

 <button
 type="submit"
 disabled={resetLoading}
 className="mt-6 w-full rounded-2xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500 disabled:opacity-60"
 >
 {resetLoading ? "Sending Link..." : "Send Reset Link"}
 </button>

 <button
 type="button"
 onClick={() => setShowForgotPassword(false)}
 className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 "
 >
 <ArrowLeft className="h-4 w-4" />
 Back to Sign In
 </button>
 </>
 )}
 </form>
 ) : (
 <form
 onSubmit={handleSubmit}
 className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/50 backdrop-blur-xl"
 >
 <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
 <Shield className="h-4 w-4 text-sky-400" />
 Authorized role access only
 </div>

 {error && (
 <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
 {error}
 </div>
 )}

 <label className="block text-sm text-slate-400">
 Email
 <div className="relative mt-2">
 <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-slate-100 outline-none ring-sky-500/0 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
 required
 />
 </div>
 </label>

 <label className="mt-4 block text-sm text-slate-400">
 Password
 <div className="relative mt-2">
 <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Enter password"
 className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-slate-100 outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
 required
 />
 </div>
 </label>

 <div className="mt-2 text-right">
 <button
 type="button"
 onClick={() => {
 setShowForgotPassword(true);
 setResetEmail(email);
 setResetError("");
 }}
 className="text-xs text-sky-400 hover:text-sky-300 hover:underline "
 >
 Forgot password?
 </button>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="mt-6 w-full rounded-2xl bg-sky-600 py-3 font-medium text-white hover:bg-sky-500 disabled:opacity-60"
 >
 {loading ? "Signing in…" : "Sign In"}
 </button>

 <div className="mt-6 space-y-1.5 border-t border-slate-800/80 pt-4 text-center text-xs text-slate-500">
 <p>
 Super Admin: <span className="text-slate-400 font-mono">superadmin@fieldforce.io</span> / <span className="text-slate-400 font-mono">password123</span>
 </p>
 <p>
 Admin: <span className="text-slate-400 font-mono">admin@fieldforce.io</span> / <span className="text-slate-400 font-mono">admin123</span>
 </p>
 </div>
 </form>
 )}
 </div>
 </div>
 );
}
