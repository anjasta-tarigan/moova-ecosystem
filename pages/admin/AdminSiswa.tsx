import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { adminApi } from "../../services/api/adminApi";
import {
  Search,
  Users,
  Eye,
  UserX,
  UserCheck,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface StudentListItem {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    avatar?: string;
    schoolName?: string;
    province?: string;
    city?: string;
    completeness?: number;
  };
}

type ToastState = { type: "success" | "error"; msg: string } | null;

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const AdminSiswa = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentListItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getStudents({ search, page, limit: 20 });
      setStudents(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const handleToggleActive = async (student: StudentListItem) => {
    setTogglingId(student.id);
    try {
      await adminApi.toggleStudentActive(student.id);
      await fetchStudents();
      showToast(
        "success",
        `${student.fullName} has been ${student.isActive ? "deactivated" : "activated"}.`,
      );
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to update status.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteStudent(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      await fetchStudents();
      showToast("success", "Student account deleted permanently.");
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewProfile = (student: StudentListItem) => {
    if (isSuperAdmin) navigate(`/superadmin/siswa/${student.id}`);
    else navigate(`/admin/siswa/${student.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manage Students
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} registered student{total !== 1 ? "s" : ""} on the platform.
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by name, email, school..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchStudents}
            className="mt-3 text-sm text-red-600 hover:underline font-bold"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No students found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Student",
                    "Email",
                    "Institution",
                    "Status",
                    "Completeness",
                    "Joined",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {student.profile?.avatar ? (
                          <img
                            src={student.profile.avatar}
                            alt={student.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200 shrink-0">
                            {getInitials(student.fullName)}
                          </div>
                        )}
                        <span className="font-medium text-slate-900 whitespace-nowrap">
                          {student.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {student.email}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-700 text-sm font-medium">
                          {student.profile?.schoolName || "—"}
                        </p>
                        {(student.profile?.city ||
                          student.profile?.province) && (
                          <p className="text-slate-400 text-xs">
                            {[student.profile.city, student.profile.province]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          student.isActive
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }`}
                      >
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (student.profile?.completeness ?? 0) >= 80
                                ? "bg-emerald-500"
                                : (student.profile?.completeness ?? 0) >= 40
                                  ? "bg-amber-500"
                                  : "bg-red-400"
                            }`}
                            style={{
                              width: `${student.profile?.completeness ?? 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {student.profile?.completeness ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-sm">
                      {formatDate(student.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewProfile(student)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(student)}
                          disabled={togglingId === student.id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            student.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={student.isActive ? "Deactivate" : "Activate"}
                        >
                          {togglingId === student.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : student.isActive ? (
                            <UserX size={15} />
                          ) : (
                            <UserCheck size={15} />
                          )}
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setDeleteTarget(student);
                              setShowDelete(true);
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-2">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showDelete && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setShowDelete(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Student Account
              </h3>
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-red-600 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-bold text-red-800 mb-1">
                    This action cannot be undone.
                  </p>
                  <p className="text-sm text-red-700">
                    Account <strong>{deleteTarget.fullName}</strong> (
                    {deleteTarget.email}) will be permanently deleted. All their
                    teams, submissions and data will be removed.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
                disabled={deleting}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSiswa;
