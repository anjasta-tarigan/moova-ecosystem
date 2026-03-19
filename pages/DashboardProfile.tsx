import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building,
  Calendar,
  Camera,
  CheckCircle,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
} from "lucide-react";
import Button from "../components/Button";
import { UserProfile, userService } from "../services/userService";

const DashboardProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "academic" | "public">(
    "general",
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [newSkill, setNewSkill] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      if ((data.completeness || 0) < 80) setActiveTab("academic");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await userService.updateProfile(profile);
      setProfile(updated);
      showNotification("success", "Profile updated successfully.");
    } catch (e) {
      showNotification("error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(true);
      try {
        const url = await userService.uploadAvatar(e.target.files[0]);
        if (profile) {
          const updated = await userService.updateProfile({
            ...profile,
            avatar: url,
          });
          setProfile(updated);
          showNotification("success", "Profile photo updated.");
        }
      } catch (err) {
        showNotification("error", "Failed to upload photo.");
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const addSkill = () => {
    if (
      newSkill.trim() &&
      profile &&
      !profile.skills.includes(newSkill.trim())
    ) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({
        ...profile,
        skills: profile.skills.filter((s) => s !== skillToRemove),
      });
    }
  };

  const isComplete = (profile?.completeness || 0) >= 80;

  if (loading)
    return (
      <div className="p-12 text-center text-slate-500">
        Loading profile data...
      </div>
    );
  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Header & Status */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Profile & Affiliation
            </h1>
            <p className="text-slate-500 mt-1">
              Data is pulled directly from the server; please keep your school
              or student identity complete.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[140px] shadow-md"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Completeness Banner */}
        <div
          className={`rounded-xl p-4 border flex items-start gap-4 ${
            isComplete
              ? "bg-emerald-50 border-emerald-100"
              : "bg-amber-50 border-amber-100"
          }`}
        >
          <div
            className={`p-2 rounded-full shrink-0 ${isComplete ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
          >
            {isComplete ? (
              <CheckCircle size={24} />
            ) : (
              <AlertTriangle size={24} />
            )}
          </div>
          <div className="flex-1">
            <h4
              className={`font-bold text-sm mb-1 ${isComplete ? "text-emerald-900" : "text-amber-900"}`}
            >
              {isComplete ? "Profile Complete" : "Profile Incomplete"}
            </h4>
            <p
              className={`text-sm mb-3 ${isComplete ? "text-emerald-700" : "text-amber-700"}`}
            >
              {isComplete
                ? "Your academic profile meets the requirements for international competitions."
                : "You must complete the Academic & Affiliation section to register for events or join teams."}
            </p>
            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${profile.completeness}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1 text-slate-500 font-medium text-right">
              {profile.completeness}% Completed
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: ID Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary-600 to-primary-800"></div>

            <div className="relative z-10 mt-8 mb-4">
              <div className="w-32 h-32 mx-auto rounded-full p-1.5 bg-white shadow-lg relative group cursor-pointer">
                <img
                  src={
                    profile.avatar ||
                    `https://ui-avatars.com/api/?name=${profile.fullName}&background=random`
                  }
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border border-slate-100"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingAvatar ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="text-white" size={24} />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {profile.fullName || "Pengguna"}
            </h2>
            <p className="text-sm text-slate-500 mt-2 mb-6 font-medium">
              {profile.schoolName || "No school provided"}
            </p>

            <div className="border-t border-slate-100 pt-6 text-left space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              {(profile.city || profile.province) && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400 shrink-0" />
                  <span>
                    {[profile.city, profile.province]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {profile.studentId && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="text-xs font-semibold text-slate-500">
                    ID
                  </span>
                  <span>{profile.studentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tabs & Forms */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {[
                { id: "general", label: "Identitas Dasar", icon: User },
                {
                  id: "academic",
                  label: "Data Akademik",
                  icon: GraduationCap,
                  alert: !isComplete,
                },
                { id: "public", label: "Profil Publik", icon: Linkedin },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? "border-primary-600 text-primary-700 bg-primary-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.alert && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1">
              {/* --- GENERAL TAB --- */}
              {activeTab === "general" && profile && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) =>
                            handleChange("fullName", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Nomor Telepon <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                          placeholder="08xxxxxxxx"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Tanggal Lahir
                      </label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="date"
                          value={profile.birthDate || ""}
                          onChange={(e) =>
                            handleChange("birthDate", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Jenis Kelamin
                      </label>
                      <select
                        value={profile.gender}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                      >
                        <option value="">Pilih</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Alamat
                      </label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) =>
                          handleChange("address", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="Alamat domisili"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- ACADEMIC TAB (MANDATORY) --- */}
              {activeTab === "academic" && profile && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                    <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                      <AlertCircle size={16} />
                      Academic data is required for event registration and
                      certificates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Nama Sekolah / Kampus{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={profile.schoolName}
                          onChange={(e) =>
                            handleChange("schoolName", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                          placeholder="Nama institusi"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Jenjang
                      </label>
                      <select
                        value={profile.schoolLevel}
                        onChange={(e) =>
                          handleChange("schoolLevel", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                      >
                        <option value="">Pilih</option>
                        <option value="High School">High School</option>
                        <option value="University">University</option>
                        <option value="Research Institution">
                          Research Institution
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Jurusan / Major
                      </label>
                      <div className="relative">
                        <BookOpen
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={profile.major}
                          onChange={(e) =>
                            handleChange("major", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                          placeholder="Contoh: Computer Science"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Kelas / Grade
                      </label>
                      <input
                        type="text"
                        value={profile.grade}
                        onChange={(e) => handleChange("grade", e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="XI / Semester 5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        NIS / Student ID
                      </label>
                      <input
                        type="text"
                        value={profile.studentId}
                        onChange={(e) =>
                          handleChange("studentId", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="ID akademik"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                        Provinsi
                      </label>
                      <input
                        type="text"
                        value={profile.province}
                        onChange={(e) =>
                          handleChange("province", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                        placeholder="Contoh: Jawa Barat"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                      Kota / Kabupaten
                    </label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                      placeholder="Contoh: Bandung"
                    />
                  </div>
                </div>
              )}

              {/* --- PUBLIC TAB --- */}
              {activeTab === "public" && profile && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                      Bio Singkat
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleChange("bio", e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium h-32 resize-none"
                      placeholder="Describe your research interests or current project"
                    />
                    <p className="text-right text-xs text-slate-400 mt-1">
                      {profile.bio.length}/500 chars
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                      Keahlian
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm font-bold rounded-full border border-primary-100"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill()}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                        placeholder="Tambah skill (ex: React, Data Science)"
                      />
                      <Button
                        size="sm"
                        type="button"
                        onClick={addSkill}
                        className="w-auto px-4"
                      >
                        <Plus size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">
                      Tautan Publik
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Linkedin size={20} />
                        </div>
                        <input
                          type="url"
                          value={profile.linkedin}
                          onChange={(e) =>
                            handleChange("linkedin", e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm"
                          placeholder="LinkedIn URL"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <Github size={20} />
                        </div>
                        <input
                          type="url"
                          value={profile.github}
                          onChange={(e) =>
                            handleChange("github", e.target.value)
                          }
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-500 outline-none text-sm"
                          placeholder="GitHub URL"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
