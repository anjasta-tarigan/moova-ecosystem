import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "../../services/api/adminApi";
import { useAuth } from "../../hooks/useAuth";

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN";
  isActive: boolean;
  createdAt: string;
}

type ToastState = { type: "success" | "error"; msg: string } | null;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const SuperAdminUsers = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAdminJudgeUsers({
        search,
        role: "ADMIN",
        page,
      });
      setUsers(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(
    () => () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    },
    [],
  );

  const validateCreate = () => {
    const errs: Record<string, string> = {};
    if (!createForm.fullName.trim()) errs.fullName = "Full name is required";
    if (!createForm.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email))
      errs.email = "Invalid email format";
    if (!createForm.password) errs.password = "Password is required";
    else if (createForm.password.length < 8)
      errs.password = "Minimum 8 characters";
    if (createForm.password !== createForm.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!editForm.fullName.trim()) errs.fullName = "Full name is required";
    if (!editForm.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email))
      errs.email = "Invalid email format";
    if (editForm.password) {
      if (editForm.password.length < 8) errs.password = "Minimum 8 characters";
      if (editForm.password !== editForm.confirmPassword)
        errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleCreate = async () => {
    const errs = validateCreate();
    if (Object.keys(errs).length) {
      setCreateErrors(errs);
      return;
    }
    setCreating(true);
    try {
      await adminApi.createAdminOrJudge({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: "ADMIN",
      });
      setShowCreate(false);
      setCreateForm({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setCreateErrors({});
      await fetchUsers();
      showToast("success", "Admin account created successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to create user.";
      if (
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("already")
      ) {
        setCreateErrors({ email: "This email is already registered." });
      } else {
        showToast("error", msg);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const errs = validateEdit();
    if (Object.keys(errs).length) {
      setEditErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
      };
      if (editForm.password) payload.password = editForm.password;
      await adminApi.updateAdminOrJudge(editTarget.id, payload);
      setShowEdit(false);
      setEditTarget(null);
      setEditErrors({});
      await fetchUsers();
      showToast("success", "Account updated successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update user.";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (target: AdminUser) => {
    if (target.role === "SUPERADMIN") {
      showToast("error", "Cannot change status for SUPERADMIN.");
      return;
    }
    setTogglingId(target.id);
    try {
      await adminApi.toggleUserActive(target.id);
      await fetchUsers();
      showToast(
        "success",
        `${target.fullName} has been ${target.isActive ? "deactivated" : "activated"}.`,
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
      await adminApi.deleteAdminOrJudge(deleteTarget.id);
      setShowDelete(false);
      setDeleteTarget(null);
      await fetchUsers();
      showToast("success", "Account deleted permanently.");
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.message || "Failed to delete user.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openCreateModal = () => {
    setCreateForm({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setCreateErrors({});
    setShowCreate(true);
  };

  const openEditModal = (target: AdminUser) => {
    if (target.role === "SUPERADMIN") return;
    setEditTarget(target);
    setEditForm({
      fullName: target.fullName,
      email: target.email,
      password: "",
      confirmPassword: "",
    });
    setEditErrors({});
    setShowEdit(true);
  };

  const openDeleteModal = (target: AdminUser) => {
    if (target.role === "SUPERADMIN") {
      showToast("error", "Cannot delete SUPERADMIN account.");
      return;
    }
    if (currentUser && target.id === currentUser.id) {
      showToast("error", "You cannot delete your own account.");
      return;
    }
    setDeleteTarget(target);
    setShowDelete(true);
  };

  const renderStatusBadge = (isActive: boolean) => (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
        isActive
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-red-100 text-red-700 border-red-200"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );

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
            Manage Admins
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Create and manage admin accounts for the platform.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors shrink-0"
        >
          <Plus size={16} /> Add Admin
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchUsers}
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
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">
              No admin accounts found.
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-sm text-slate-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Role",
                    "Status",
                    "Created",
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
                {users.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {initialsFromName(item.fullName)}
                        </div>
                        <span className="font-medium text-slate-900 whitespace-nowrap">
                          {item.fullName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {item.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.role === "SUPERADMIN"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        {item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(item.isActive)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {item.role === "SUPERADMIN" ? (
                        <span className="text-xs text-slate-400 italic">
                          Protected
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item)}
                            disabled={togglingId === item.id}
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              item.isActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={item.isActive ? "Deactivate" : "Activate"}
                          >
                            {togglingId === item.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : item.isActive ? (
                              <UserX size={15} />
                            ) : (
                              <UserCheck size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            disabled={currentUser?.id === item.id}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                            title={
                              currentUser?.id === item.id
                                ? "Cannot delete own account"
                                : "Delete"
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
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

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Add Admin Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  New account will have ADMIN role.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => {
                    setCreateForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }));
                    setCreateErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  placeholder="e.g. John Smith"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    createErrors.fullName
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {createErrors.fullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {createErrors.fullName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => {
                    setCreateForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
                    setCreateErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="admin@example.com"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    createErrors.email
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {createErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {createErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => {
                    setCreateForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }));
                    setCreateErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="Min. 8 characters"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    createErrors.password
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {createErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {createErrors.password}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={(e) => {
                    setCreateForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }));
                    setCreateErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }}
                  placeholder="Re-enter password"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    createErrors.confirmPassword
                      ? "border-red-300 bg-red-50"
                      : createForm.confirmPassword &&
                          createForm.password === createForm.confirmPassword
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200"
                  }`}
                />
                {createErrors.confirmPassword ? (
                  <p className="text-xs text-red-600 mt-1">
                    {createErrors.confirmPassword}
                  </p>
                ) : createForm.confirmPassword &&
                  createForm.password === createForm.confirmPassword ? (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle size={11} /> Passwords match
                  </p>
                ) : null}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Create Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Leave password blank to keep current.
                </p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => {
                    setEditForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }));
                    setEditErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    editErrors.fullName
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {editErrors.fullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {editErrors.fullName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm((prev) => ({ ...prev, email: e.target.value }));
                    setEditErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    editErrors.email
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {editErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {editErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                  New Password{" "}
                  <span className="text-slate-400 font-normal normal-case">
                    (optional)
                  </span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => {
                    setEditForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }));
                    setEditErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="Leave blank to keep current"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                    editErrors.password
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {editErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {editErrors.password}
                  </p>
                )}
              </div>
              {editForm.password && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => {
                      setEditForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }));
                      setEditErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                      }));
                    }}
                    placeholder="Re-enter new password"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all ${
                      editErrors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : editForm.confirmPassword &&
                            editForm.password === editForm.confirmPassword
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-slate-200"
                    }`}
                  />
                  {editErrors.confirmPassword ? (
                    <p className="text-xs text-red-600 mt-1">
                      {editErrors.confirmPassword}
                    </p>
                  ) : editForm.confirmPassword &&
                    editForm.password === editForm.confirmPassword ? (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={11} /> Passwords match
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Account
              </h3>
              <button
                onClick={() => setShowDelete(false)}
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
                    {deleteTarget.email}) will be permanently deleted from the
                    system.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDelete(false)}
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

export default SuperAdminUsers;
