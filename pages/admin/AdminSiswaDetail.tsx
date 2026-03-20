import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { adminApi } from "../../services/api/adminApi";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Globe,
  Lock,
  UserX,
  UserCheck,
  Trash2,
  CheckCircle,
  AlertCircle,
  Shield,
  MapPin,
  Calendar,
  X,
} from "lucide-react";

type Tab = "identity" | "academic" | "public" | "security";

interface StudentProfile {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
    avatar?: string;
    country?: string;
    schoolName?: string;
    schoolLevel?: string;
    major?: string;
    studentId?: string;
    grade?: string;
    affiliationType?: string;
    faculty?: string;
    fieldOfStudy?: string;
    educationLevel?: string;
    graduationYear?: number;
    province?: string;
    city?: string;
    bio?: string;
    skills?: string[];
    linkedin?: string;
    github?: string;
    website?: string;
    googleScholar?: string;
    completeness?: number;
  };
}

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  { id: "identity", label: "Basic Identity", icon: <User size={16} /> },
  {
    id: "academic",
    label: "Academic & Affiliation",
    icon: <GraduationCap size={16} />,
  },
  { id: "public", label: "Public Profile", icon: <Globe size={16} /> },
  { id: "security", label: "Account & Security", icon: <Lock size={16} /> },
];

type ToastState = { type: "success" | "error"; msg: string } | null;

const AdminSiswaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("identity");
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminApi.getStudent(id!);
        setStudent(res.data.data);
      } catch (err) {
        console.error(err);
        setError("Student not found or access denied.");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const handleToggleActive = async () => {
    if (!student) return;
    setTogglingActive(true);
    try {
      await adminApi.toggleStudentActive(student.id);
      setStudent((prev) =>
        prev ? { ...prev, isActive: !prev.isActive } : prev,
      );
      showToast(
        "success",
        `Account ${student.isActive ? "deactivated" : "activated"}.`,
      );
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed.");
    } finally {
      setTogglingActive(false);
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    setDeleting(true);
    try {
      await adminApi.deleteStudent(student.id);
      showToast("success", "Student account deleted.");
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      showToast("error", err?.response?.data?.message || "Failed.");
      setDeleting(false);
    }
  };

  const ReadField = ({
    label,
    value,
    type = "text",
  }: {
    label: string;
    value?: string | number | null;
    type?: "text" | "textarea" | "url";
  }) => (
    <div>
      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide">
        {label}
      </label>
      {type === "textarea" ? (
        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[80px] leading-relaxed">
          {value ? (
            value
          ) : (
            <span className="text-slate-400 italic">Not provided</span>
          )}
        </div>
      ) : type === "url" && value ? (
        <a
          href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-blue-600 hover:underline truncate"
        >
          {value}
        </a>
      ) : (
        <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
          {value ? (
            value
          ) : (
            <span className="text-slate-400 italic">Not provided</span>
          )}
        </div>
      )}
    </div>
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

      <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Student Profile
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Viewing profile in read-only mode
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-red-600 font-bold hover:underline"
          >
            Go Back
          </button>
        </div>
      )}

      {!loading && !error && student && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
              <div className="relative inline-block mb-4">
                {student.profile?.avatar ? (
                  <img
                    src={student.profile.avatar}
                    alt={student.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold text-slate-500 border-4 border-white shadow-md">
                    {student.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                    student.isActive ? "bg-emerald-500" : "bg-red-400"
                  }`}
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {student.fullName}
              </h2>
              <p className="text-sm text-slate-500 mb-3">{student.email}</p>

              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border mb-4 ${
                  student.isActive
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-red-100 text-red-700 border-red-200"
                }`}
              >
                {student.isActive ? "Active" : "Inactive"}
              </span>

              {student.profile?.completeness !== undefined && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Profile Completeness</span>
                    <span className="font-bold">
                      {student.profile.completeness}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        student.profile.completeness >= 80
                          ? "bg-emerald-500"
                          : student.profile.completeness >= 40
                            ? "bg-amber-500"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${student.profile.completeness}%` }}
                    />
                  </div>
                </div>
              )}

              {student.profile?.province && (
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                  <MapPin size={12} />
                  {[student.profile.city, student.profile.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              {student.createdAt && (
                <p className="text-xs text-slate-400 flex items-center justify-center gap-1 mt-1">
                  <Calendar size={12} />
                  Joined{" "}
                  {new Date(student.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wide mb-3">
                Actions
              </h3>
              <button
                onClick={handleToggleActive}
                disabled={togglingActive}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                  student.isActive
                    ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200"
                }`}
              >
                {togglingActive ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : student.isActive ? (
                  <>
                    <UserX size={16} /> Deactivate Account
                  </>
                ) : (
                  <>
                    <UserCheck size={16} /> Activate Account
                  </>
                )}
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => setShowDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} /> Delete Account
                </button>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2">
                <Shield size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Profile data can only be edited by the student. You can only
                  manage account status.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50">
                <div className="flex overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-slate-900 text-slate-900 bg-white"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8">
                {activeTab === "identity" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User size={20} className="text-slate-500" />
                      Basic Identity
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <ReadField label="Full Name" value={student.fullName} />
                      <ReadField label="Email" value={student.email} />
                      <ReadField
                        label="Phone Number"
                        value={student.profile?.phone}
                      />
                      <ReadField
                        label="Date of Birth"
                        value={
                          student.profile?.birthDate
                            ? new Date(
                                student.profile.birthDate,
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : undefined
                        }
                      />
                      <ReadField
                        label="Gender"
                        value={student.profile?.gender}
                      />
                      <ReadField
                        label="Country"
                        value={student.profile?.country}
                      />
                      <ReadField
                        label="Province"
                        value={student.profile?.province}
                      />
                      <ReadField label="City" value={student.profile?.city} />
                    </div>

                    <ReadField
                      label="Address"
                      value={student.profile?.address}
                      type="textarea"
                    />
                  </div>
                )}

                {activeTab === "academic" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap size={20} className="text-slate-500" />
                      Academic & Affiliation
                    </h3>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wide">
                        Affiliation Type
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        {["SCHOOL", "UNIVERSITY", "INDEPENDENT"].map((type) => (
                          <span
                            key={type}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                              student.profile?.affiliationType === type
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            }`}
                          >
                            {type === "SCHOOL"
                              ? "🏫 School"
                              : type === "UNIVERSITY"
                                ? "🎓 University"
                                : "💼 Independent"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <ReadField
                        label="Institution Name"
                        value={student.profile?.schoolName}
                      />
                      <ReadField
                        label="School Level"
                        value={student.profile?.schoolLevel}
                      />
                      <ReadField
                        label="Faculty"
                        value={student.profile?.faculty}
                      />
                      <ReadField
                        label="Field of Study"
                        value={student.profile?.fieldOfStudy}
                      />
                      <ReadField
                        label="Major / Department"
                        value={student.profile?.major}
                      />
                      <ReadField
                        label="Student ID"
                        value={student.profile?.studentId}
                      />
                      <ReadField
                        label="Grade / Year"
                        value={student.profile?.grade}
                      />
                      <ReadField
                        label="Education Level"
                        value={student.profile?.educationLevel}
                      />
                      <ReadField
                        label="Graduation Year"
                        value={student.profile?.graduationYear?.toString()}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "public" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Globe size={20} className="text-slate-500" />
                      Public Profile
                    </h3>

                    <ReadField
                      label="Bio"
                      value={student.profile?.bio}
                      type="textarea"
                    />

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-3 tracking-wide">
                        Skills & Interests
                      </label>
                      {student.profile?.skills?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {student.profile.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-sm">
                          No skills added
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <ReadField
                        label="LinkedIn"
                        value={student.profile?.linkedin}
                        type="url"
                      />
                      <ReadField
                        label="GitHub"
                        value={student.profile?.github}
                        type="url"
                      />
                      <ReadField
                        label="Website / Portfolio"
                        value={student.profile?.website}
                        type="url"
                      />
                      <ReadField
                        label="Google Scholar"
                        value={student.profile?.googleScholar}
                        type="url"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Lock size={20} className="text-slate-500" />
                      Account & Security
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <ReadField label="Account ID" value={student.id} />
                      <ReadField label="Role" value={student.role} />
                      <ReadField
                        label="Account Status"
                        value={student.isActive ? "Active" : "Inactive"}
                      />
                      <ReadField
                        label="Member Since"
                        value={new Date(student.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      />
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                      <div className="flex items-start gap-3">
                        <Lock
                          size={18}
                          className="text-amber-600 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-bold text-amber-800 mb-1">
                            Password & Security
                          </p>
                          <p className="text-sm text-amber-700">
                            Password and security settings can only be managed
                            by the student. Administrators cannot view or change
                            password information.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                      <p className="text-xs font-bold uppercase text-slate-400 tracking-wide mb-3">
                        Connected Accounts
                      </p>
                      {[
                        { name: "Google", icon: "🔵" },
                        { name: "Microsoft", icon: "🟦" },
                      ].map((provider) => (
                        <div
                          key={provider.name}
                          className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <span>{provider.icon}</span>
                            <span className="text-sm font-medium text-slate-700">
                              {provider.name}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 italic">
                            Not connected
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelete && student && (
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
            <div className="p-6">
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
                    Account <strong>{student.fullName}</strong> and all
                    associated data (teams, submissions, certificates) will be
                    permanently deleted.
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

export default AdminSiswaDetail;
