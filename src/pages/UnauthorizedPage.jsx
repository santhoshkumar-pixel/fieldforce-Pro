import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
 const navigate = useNavigate();

 return (
 <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
 <div className="max-w-md w-full rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
 <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
 <ShieldAlert className="h-8 w-8 " />
 </div>
 <h2 className="text-2xl font-bold text-white tracking-tight">
 Access Denied
 </h2>
 <p className="mt-3 text-sm text-slate-400 leading-relaxed">
 You do not have the required permissions to access this page or resource. If you believe this is an error, please contact your system administrator to update your role permissions.
 </p>
 <div className="mt-8 border-t border-slate-800/80 pt-6">
 <button
 onClick={() => navigate("/")}
 className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 px-5 py-3 text-sm font-semibold "
 >
 <ArrowLeft className="h-4 w-4" />
 Back to Dashboard
 </button>
 </div>
 </div>
 </div>
 );
}
