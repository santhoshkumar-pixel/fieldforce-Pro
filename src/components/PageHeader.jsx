export default function PageHeader({ title, description, action }) {
 return (
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <h2 className="text-2xl font-semibold text-white gradient-title">{title}</h2>
 {description && (
 <p className="mt-1 max-w-3xl text-sm text-slate-400">{description}</p>
 )}
 </div>
 {action}
 </div>
 );
}
