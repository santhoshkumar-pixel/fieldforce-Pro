        {/* Technician Shifts & Punch Control Widget */}
        <Card>
          <CardHeader
            title="Technician Shifts & Punch Control"
            subtitle="Monitor live shift times and simulate punch in/out actions"
          />
          <CardBody className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 min-h-[360px]">
              {/* Left pane: Technicians list */}
              <div className="p-4 space-y-2 max-h-[380px] overflow-y-auto">
                {shifts.map((tech) => {
                  const workload = technicianWorkload.find(
                    (w) => w.name === tech.name
                  ) || { assigned: 0, completed: 0 };
                  const total = workload.assigned + workload.completed;
                  const pct = total > 0 ? (workload.completed / total) * 100 : 0;

                  return (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => setSelectedId(tech.id)}
                      className={`w-full rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                        selectedId === tech.id
                          ? "border-sky-500/50 bg-slate-800/85"
                          : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
                      }`}

                        {tech.shiftStatus !== shiftStatuses.OFF_SHIFT && (
                          <span className="font-mono text-xs font-bold text-sky-400">
                            {formatDuration(computeShiftDuration(tech))}
                          </span>
                        )}
                      </div>

                      {/* Ticket workload progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Jobs Done: {workload.completed}/{total}</span>
                          <span>{Math.round(pct)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right pane: Shift Control Action panel */}
              <div className="p-5 flex flex-col justify-between bg-slate-950/20">
                {selectedTech ? (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-base">
                          {selectedTech.name}
                        </h4>