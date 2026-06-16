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

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={containerRef} className={clsx("relative text-left", fullWidth ? "w-full block" : "inline-block", containerClassName)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex items-center justify-between gap-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-350 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 cursor-pointer transition-all",
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
"absolute right-0 z-50 mt-1 max-h-60 w-max min-w-full overflow-y-auto rounded-xl border border-violet-500/25 bg-slate-950 p-1 shadow-2xl focus:outline-none",
            dropdownClassName
          )}
        >
          {options.map((opt) => {
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
                    ? "bg-violet-600 text-white font-bold ring-1 ring-violet-400/20"
                    : "text-slate-300 hover:bg-violet-500/20 hover:text-violet-200"
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
