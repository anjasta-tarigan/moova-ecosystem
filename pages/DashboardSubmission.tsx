import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Award,
  CheckCircle,
  ChevronLeft,
  Clock,
  FileText,
  Link as LinkIcon,
  Play,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import { submissionsApi } from "../services/api/submissionsApi";

type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "SCORED";

interface SubmissionFile {
  id: string;
  name: string;
  size: string;
  mimeType?: string;
  url?: string;
  uploadedAt?: string;
}

interface TeamMember {
  id: string;
  role: string;
  user?: { fullName?: string; email?: string };
}

interface SubmissionData {
  id: string;
  status: SubmissionStatus;
  currentStage?: string;
  projectTitle: string;
  tagline: string;
  description: string;
  techStack: string;
  githubLink: string;
  demoLink: string;
  consentGiven?: boolean;
  submittedAt?: string;
  event?: { id: string; title: string; deadline?: string };
  team?: { id: string; name: string; members: TeamMember[] };
  files: SubmissionFile[];
  scores?: Array<{ totalScore?: number }>;
}

const statusBadge = (status?: SubmissionStatus) => {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "SCORED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REVISION_REQUESTED":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const DashboardSubmission: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await submissionsApi.getSubmission(id);
      setSubmission(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat submission.");
    } finally {
      setLoading(false);
    }
  };

  const isDraft = submission?.status === "DRAFT";

  const handleChange = (field: keyof SubmissionData, value: any) => {
    if (!submission) return;
    setSubmission({ ...submission, [field]: value });
  };

  const handleSave = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      const payload = {
        projectTitle: submission.projectTitle,
        tagline: submission.tagline,
        description: submission.description,
        techStack: submission.techStack,
        githubLink: submission.githubLink,
        demoLink: submission.demoLink,
      };
      const res = await submissionsApi.updateSubmission(submission.id, payload);
      setSubmission(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file?: File) => {
    if (!submission || !file) return;
    setUploading(true);
    try {
      const res = await submissionsApi.uploadFile(submission.id, file);
      const uploaded = res.data.data;
      setSubmission({
        ...submission,
        files: [...(submission.files || []), uploaded],
      });
    } catch (err) {
      console.error(err);
      setError("Upload gagal. Pastikan format dan ukuran sesuai.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!submission) return;
    try {
      await submissionsApi.deleteFile(submission.id, fileId);
      setSubmission({
        ...submission,
        files: submission.files.filter((f) => f.id !== fileId),
      });
    } catch (err) {
      console.error(err);
      setError("Tidak bisa menghapus file.");
    }
  };

  const handleSubmit = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      await submissionsApi.submitSubmission(submission.id);
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Gagal submit. Pastikan minimal satu file terunggah.");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      await submissionsApi.withdrawSubmission(submission.id);
      await refresh();
    } catch (err) {
      console.error(err);
      setError("Tidak bisa menarik submission ini.");
    } finally {
      setSaving(false);
    }
  };

  const totalScore = useMemo(
    () => submission?.scores?.[0]?.totalScore,
    [submission],
  );

  if (!id) {
    return (
      <div className="p-8 text-slate-500">Submission ID tidak ditemukan.</div>
    );
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading submission...</div>;
  }

  if (!submission) {
    return <div className="p-8 text-slate-500">Submission tidak tersedia.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6">
        <div>
          <button
            onClick={() =>
              navigate(
                submission.event?.id
                  ? `/dashboard/event/${submission.event.id}`
                  : "/dashboard",
              )
            }
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Event
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Submission Portal
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${statusBadge(submission.status)}`}
            >
              {submission.status}
            </span>
          </div>
          {submission.event && (
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              {submission.event.title}
              {submission.event.deadline &&
                ` • Deadline ${submission.event.deadline}`}
            </p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                  Project Title
                </label>
                <input
                  type="text"
                  value={submission.projectTitle}
                  onChange={(e) => handleChange("projectTitle", e.target.value)}
                  disabled={!isDraft}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                  Tagline
                </label>
                <input
                  type="text"
                  value={submission.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  disabled={!isDraft}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                Description
              </label>
              <textarea
                value={submission.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={!isDraft}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm h-32 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                  Tech Stack
                </label>
                <input
                  type="text"
                  value={submission.techStack}
                  onChange={(e) => handleChange("techStack", e.target.value)}
                  disabled={!isDraft}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">
                  Links
                </label>
                <div className="relative">
                  <LinkIcon
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    type="url"
                    value={submission.githubLink}
                    onChange={(e) => handleChange("githubLink", e.target.value)}
                    disabled={!isDraft}
                    placeholder="Github link"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                  />
                </div>
                <div className="relative">
                  <Play
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    type="url"
                    value={submission.demoLink}
                    onChange={(e) => handleChange("demoLink", e.target.value)}
                    disabled={!isDraft}
                    placeholder="Demo link"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {isDraft && (
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" onClick={refresh}>
                  Reload
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || submission.files.length === 0}
                >
                  Submit
                </Button>
              </div>
            )}
            {!isDraft && submission.status === "SUBMITTED" && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={handleWithdraw}
                  disabled={saving}
                >
                  Withdraw
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UploadCloud size={18} className="text-primary-600" /> Files
              </h3>
              {isDraft && (
                <div>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}
            </div>

            {submission.files.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 bg-slate-50">
                Belum ada file yang diunggah.
              </div>
            ) : (
              <div className="space-y-3">
                {submission.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">{file.size}</p>
                      </div>
                    </div>
                    {isDraft && (
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                        title="Delete file"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalScore !== undefined && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-600" /> Score
              </h3>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {totalScore}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary-600" /> Team Members
            </h4>
            <div className="space-y-3">
              {(submission.team?.members || []).map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                    {(member.user?.fullName || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {member.user?.fullName || "Anggota"}
                    </p>
                    <p className="text-[11px] text-slate-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
            <h4 className="font-bold text-lg mb-2">Tips Singkat</h4>
            <ul className="space-y-2 text-sm text-slate-200">
              <li>• Lengkapi deskripsi dan tech stack sebelum submit.</li>
              <li>• Pastikan minimal satu file terunggah untuk submit.</li>
              <li>• Gunakan link demo yang dapat diakses publik.</li>
            </ul>
            <div className="mt-4 text-xs text-slate-400">
              Status saat ini: {submission.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSubmission;
