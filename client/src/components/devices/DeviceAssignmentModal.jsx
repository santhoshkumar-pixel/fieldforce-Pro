import { useState, useEffect } from "react";
import { X, User, Briefcase, MapPin } from "lucide-react";
import { api } from "../../utils/api";

const PRESET_BRANCHES = [
  "Goa HQ",
  "North Goa Branch",
  "South Goa Branch",
  "Central Goa Branch",
  "Bhutan Tech Center",
  "London Terminal",
  "São Paulo Solar Hub",
  "Singapore Operations"
];

export default function DeviceAssignmentModal({ open, onClose, device, onAssign }) {
  const [assigneeType, setAssigneeType] = useState("FIELD_ENGINEER"); // FIELD_ENGINEER, EMPLOYEE, BRANCH
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [assignmentDate, setAssignmentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [returnDate, setReturnDate] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      // Fetch users for employee/field engineer assignment dropdown
      const fetchUsers = async () => {
        setLoadingUsers(true);
        setError(null);
        try {
          const data = await api.users.getAll();
          setUsers(data || []);
        } catch (err) {
          console.error("Failed to load users for device assignment:", err);
          setError("Failed to load users list.");
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [open]);

  if (!open || !device) return null;

  // Filter users based on selection
  const filteredUsers = users.filter((u) => {
    const isTech = u.role === "Field Technician" || u.role === "Technician";
    return assigneeType === "FIELD_ENGINEER" ? isTech : !isTech;
  });

  const handleUserChange = (userId) => {
    setAssigneeId(userId);
    const selected = users.find((u) => u.id === userId);
    setAssigneeName(selected ? selected.name : "");
  };

  const handleBranchChange = (branchName) => {
    setAssigneeId(branchName);
    setAssigneeName(branchName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!assigneeName) {
      setError("Please select an assignment target.");
      return;
    }
    onAssign({
      assigneeType,
      assigneeId,
      assigneeName,
      assignmentDate,
      returnDate
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-lg font-bold text-white">Assign Device {device.id}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assignment Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Assignment Target Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssigneeType("FIELD_ENGINEER");
                  setAssigneeId("");
                  setAssigneeName("");
                }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition-all ${
                  assigneeType === "FIELD_ENGINEER"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Field Engineer
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssigneeType("EMPLOYEE");
                  setAssigneeId("");
                  setAssigneeName("");
                }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition-all ${
                  assigneeType === "EMPLOYEE"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <User className="h-4 w-4" />
                Employee
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssigneeType("BRANCH");
                  setAssigneeId("");
                  setAssigneeName("");
                }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-semibold transition-all ${
                  assigneeType === "BRANCH"
                    ? "border-violet-500 bg-violet-500/10 text-violet-400"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <MapPin className="h-4 w-4" />
                Branch Location
              </button>
            </div>
          </div>

          {/* Selection Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              {assigneeType === "BRANCH" ? "Select Branch" : "Select User"}
            </label>

            {assigneeType === "BRANCH" ? (
              <select
                required
                value={assigneeId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500/50"
              >
                <option value="">-- Choose Branch --</option>
                {PRESET_BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            ) : loadingUsers ? (
              <div className="text-xs text-slate-500 py-3">Loading users list...</div>
            ) : (
              <select
                required
                value={assigneeId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500/50"
              >
                <option value="">-- Choose Member --</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Assignment Date
              </label>
              <input
                type="date"
                required
                value={assignmentDate}
                onChange={(e) => setAssignmentDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Expected Return Date (Optional)
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 shadow-lg shadow-sky-950/20"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
