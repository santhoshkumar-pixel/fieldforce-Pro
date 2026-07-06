import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

export default function CustomSelect({ value, onChange, options, className, dropdownClassName, containerClassName, fullWidth }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value && !opt.isHeader) || options.find(opt => !opt.isHeader);

  return (
    <div ref={containerRef} className={clsx("relative text-left", isOpen ? "z-50" : "z-10", fullWidth ? "w-full block" : "inline-block", containerClassName)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center justify-between gap-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-350 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 cursor-pointer transition-all",
          fullWidth && "w-full",
          className
        )}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={clsx("h-3 w-3 shrink-0 text-slate-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className={clsx(
            "absolute right-0 z-50 mt-1 max-h-60 w-max min-w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl focus:outline-none",
            dropdownClassName
          )}
        >
          {options.map((opt, idx) => {
            if (opt.isHeader) {
              return (
                <div
                  key={`header-${idx}-${opt.label}`}
                  className="px-2.5 py-1 text-[9px] font-extrabold text-purple-400/90 uppercase tracking-wider select-none border-b border-slate-900/50 mt-1.5 first:mt-0"
                >
                  {opt.label}
                </div>
              );
            }
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full text-left rounded-lg px-2.5 py-1.5 text-[11px] transition-all cursor-pointer font-medium block",
                  isSelected
                    ? "bg-purple-600 text-white font-bold ring-1 ring-purple-400/20"
                    : "text-slate-200 hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-300"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
