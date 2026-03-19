import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building,
  Calendar,
  Camera,
  CheckCircle,
  FileBadge,
  Github,
  Globe,
  GraduationCap,
  Link as LinkIcon,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import api from "../lib/axios";
import Button from "../components/Button";
import { useAuthContext } from "../contexts/AuthContext";
import { profileApi } from "../services/api/profileApi";

type Role = "SUPERADMIN" | "ADMIN" | "JUDGE" | "STUDENT" | "";

interface ProfileUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface ProfileData {
  avatar?: string;
  phone: string;
  country: string;
  province?: string;
  educationLevel?: string;
  affiliationType?: string;
  schoolName?: string;
  faculty?: string;
  fieldOfStudy?: string;
  graduationYear?: string;
  studentId?: string;
  bio: string;
  skills: string[];
  linkedin?: string;
  github?: string;
  website?: string;
  googleScholar?: string;
  completeness?: number;
}

interface ProfileState {
  user: ProfileUser;
  profile: ProfileData;
}

type Notification = { type: "success" | "error"; msg: string } | null;

const inputClass =
  "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium";
const selectClass = inputClass;
const labelClass =
  "block text-xs font-bold uppercase text-slate-500 mb-1.5 tracking-wide";

const countries = [
  "Indonesia",
  "United Kingdom",
  "United States",
  "Canada",
  "Germany",
  "Singapore",
  "India",
  "Nigeria",
  "Brazil",
  "Japan",
  "Malaysia",
  "Australia",
  "Other",
];

const affiliationTypes = [
  "University",
  "High School",
  "Research Institution",
  "Company",
  "Independent / Freelance",
];

const educationLevels = [
  "High School",
  "Undergraduate",
  "Master",
  "PhD",
  "Professional",
  "Other",
];

const tabs = [
  { id: "general" as const, label: "Basic Identity", icon: User },
  {
    id: "academic" as const,
    label: "Academic & Affiliation",
    icon: GraduationCap,
  },
  { id: "public" as const, label: "Public Profile", icon: Linkedin },
  { id: "security" as const, label: "Security", icon: Shield },
];

const normalizeProfile = (data: any, fallbackUser?: any): ProfileState => {
  const userData = data?.user || fallbackUser || data || {};
  const profileData = data?.profile || data || {};

  return {
    user: {
      id: userData.id || profileData.id || "",
      fullName: userData.fullName || profileData.fullName || "",
      email: userData.email || profileData.email || "",
      role: (userData.role as Role) || "",
      avatar: userData.avatar || profileData.avatar || "",
    },
    profile: {
      avatar: profileData.avatar || userData.avatar || "",
      phone: profileData.phone || "",
      country: profileData.country || profileData.province || "",
      province: profileData.province || "",
      educationLevel:
        profileData.educationLevel || profileData.schoolLevel || "",
      affiliationType:
        profileData.affiliationType || profileData.schoolLevel || "",
      schoolName: profileData.schoolName || profileData.institution || "",
      faculty: profileData.faculty || "",
      fieldOfStudy: profileData.fieldOfStudy || profileData.major || "",
      graduationYear: profileData.graduationYear || profileData.grade || "",
      studentId: profileData.studentId || "",
      bio: profileData.bio || "",
      skills: profileData.skills || [],
      linkedin: profileData.linkedin || "",
      github: profileData.github || "",
      website: profileData.website || "",
      googleScholar: profileData.googleScholar || "",
      completeness: profileData.completeness ?? data?.completeness ?? 0,
    },
  };
};

const getNameParts = (fullName: string) => {
  const parts = fullName?.trim()?.split(/\s+/).filter(Boolean) || [];
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
};

const DashboardProfile: React.FC = () => {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "general" | "academic" | "public" | "security"
  >("general");
  const [notification, setNotification] = useState<Notification>(null);
  const [newSkill, setNewSkill] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await profileApi.getProfile();
      const normalized = normalizeProfile(res.data?.data || res.data, user);
      setProfile(normalized);
      if ((normalized.profile.completeness || 0) < 80) {
        setActiveTab("academic");
      }
    } catch (err) {
      console.error(err);
      setLoadError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (field: keyof ProfileData, value: any) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            profile: {
              ...prev.profile,
              [field]: value,
            },
          }
        : prev,
    );
  };

  const handleNameChange = (part: "first" | "last", value: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const { firstName, lastName } = getNameParts(prev.user.fullName || "");
      const nextFirst = part === "first" ? value : firstName;
      const nextLast = part === "last" ? value : lastName;
      const nextFullName = [nextFirst, nextLast].filter(Boolean).join(" ");
      return {
        ...prev,
        user: { ...prev.user, fullName: nextFullName },
      };
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(true);
      try {
        const res = await profileApi.uploadAvatar(e.target.files[0]);
        const url =
          res.data?.data?.avatarUrl || res.data?.data?.avatar || res.data?.data;
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  avatar: url || prev.profile.avatar,
                },
              }
            : prev,
        );
        showNotification("success", "Profile photo updated.");
      } catch (err) {
        console.error(err);
        showNotification("error", "Failed to upload photo.");
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const addSkill = () => {
    const value = newSkill.trim();
    if (!value || !profile) return;
    setProfile({
      ...profile,
      profile: {
        ...profile.profile,
        skills: Array.from(new Set([...(profile.profile.skills || []), value])),
      },
    });
    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            profile: {
              ...prev.profile,
              skills: (prev.profile.skills || []).filter(
                (skill) => skill !== skillToRemove,
              ),
            },
          }
        : prev,
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload = {
        fullName: profile.user.fullName,
        phone: profile.profile.phone,
        country: profile.profile.country,
        affiliationType: profile.profile.affiliationType,
        schoolName: profile.profile.schoolName,
        faculty: profile.profile.faculty,
        fieldOfStudy: profile.profile.fieldOfStudy,
        educationLevel: profile.profile.educationLevel,
        graduationYear: profile.profile.graduationYear,
        studentId: profile.profile.studentId,
        bio: profile.profile.bio,
        skills: profile.profile.skills,
        linkedin: profile.profile.linkedin,
        github: profile.profile.github,
        website: profile.profile.website,
        googleScholar: profile.profile.googleScholar,
      };

      const res = await profileApi.updateProfile(payload);
      const normalized = normalizeProfile(res.data?.data || res.data, user);
      setProfile(normalized);
      showNotification("success", "Profile updated successfully.");
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      showNotification("error", "Please fill all password fields.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      showNotification("error", "New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
        confirmPassword: passwords.confirm,
      });
      showNotification("success", "Password updated successfully.");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        showNotification("error", "Change password is coming soon.");
      } else {
        showNotification("error", "Failed to update password.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const completeness = Math.min(
    100,
    Math.max(0, profile?.profile?.completeness ?? 0),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{loadError}</p>
        <button
          onClick={loadProfile}
          className="mt-3 text-sm text-red-600 hover:underline font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const { firstName, lastName } = getNameParts(profile.user.fullName);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}

      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Profile & Affiliation
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Manage your academic identity, affiliations, public presence, and
            security settings for the GIVA ecosystem.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[150px] shadow-md"
        >
          {saving ? (
            "Saving..."
          ) : (
            <span className="inline-flex items-center gap-2">
              <Save size={16} /> Save Changes
            </span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Identity Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-center relative">
            <div className="w-full h-24 bg-gradient-to-r from-primary-600 to-primary-800" />
            <div className="-mt-16 flex flex-col items-center px-6 pb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl relative group cursor-pointer">
                  <img
                    src={
                      profile.profile.avatar ||
                      profile.user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.fullName || "GIVA User")}`
                    }
                    alt="Profile avatar"
                    className="w-full h-full rounded-full object-cover border border-slate-100"
                  />
                  <div
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="text-white" size={22} />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-4">
                {profile.user.fullName || "GIVA User"}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                {profile.profile.affiliationType ? (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase rounded-full">
                    {profile.profile.affiliationType}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {profile.profile.schoolName || "No institution provided"}
              </p>

              <div className="w-full mt-6 space-y-3">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 text-right font-medium">
                  {completeness}% Complete
                </p>
                <div className="pt-3 border-t border-slate-100 space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Mail size={16} className="text-slate-400" />
                    <span className="truncate">{profile.user.email}</span>
                  </div>
                  {profile.profile.country || profile.profile.province ? (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <MapPin size={16} className="text-slate-400" />
                      <span>
                        {[profile.profile.country, profile.profile.province]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  ) : null}
                  {profile.profile.educationLevel ? (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <GraduationCap size={16} className="text-slate-400" />
                      <span>{profile.profile.educationLevel}</span>
                    </div>
                  ) : null}
                  {profile.profile.studentId ? (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <FileBadge size={16} className="text-slate-400" />
                      <span>{profile.profile.studentId}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tab Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const showAlert = tab.id === "academic" && completeness < 80;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 whitespace-nowrap relative ${
                      isActive
                        ? "border-primary-600 text-primary-700 bg-primary-50/50"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                    {showAlert && (
                      <span className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-8 flex-1">
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div
                    className={`rounded-xl p-4 border flex items-start gap-3 ${
                      completeness < 80
                        ? "bg-amber-50 border-amber-100"
                        : "bg-emerald-50 border-emerald-100"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        completeness < 80
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {completeness < 80 ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {completeness < 80
                          ? "Profile Incomplete — complete Academic & Affiliation to register for events"
                          : "Profile Complete"}
                      </p>
                      <div className="w-full bg-white/70 rounded-full h-2 overflow-hidden mt-3">
                        <div
                          className={`h-full ${
                            completeness < 80
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        {completeness}% completed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) =>
                            handleNameChange("first", e.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          placeholder="First name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) =>
                          handleNameChange("last", e.target.value)
                        }
                        className={inputClass}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Email Address</label>
                      <div className="relative">
                        <Mail
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="email"
                          value={profile.user.email}
                          disabled
                          className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed pl-10`}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Contact support to change email.
                      </p>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="tel"
                          value={profile.profile.phone}
                          onChange={(e) =>
                            handleChange("phone", e.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Country / Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={profile.profile.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "academic" && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                    <AlertCircle size={18} className="text-blue-600" />
                    <p className="text-sm text-blue-800 font-medium">
                      This section is required for event registration and
                      certificate issuance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>
                        Affiliation Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profile.profile.affiliationType}
                        onChange={(e) =>
                          handleChange("affiliationType", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">Select affiliation</option>
                        {affiliationTypes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Education Level <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={profile.profile.educationLevel}
                        onChange={(e) =>
                          handleChange("educationLevel", e.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">Select level</option>
                        {educationLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className={labelClass}>
                        Institution / Organization Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={profile.profile.schoolName}
                          onChange={(e) =>
                            handleChange("schoolName", e.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          placeholder="e.g. Universitas Indonesia"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>
                        Faculty / Department{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profile.profile.faculty}
                        onChange={(e) =>
                          handleChange("faculty", e.target.value)
                        }
                        className={inputClass}
                        placeholder="e.g. Faculty of Engineering"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Major / Field of Study{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <BookOpen
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={profile.profile.fieldOfStudy}
                          onChange={(e) =>
                            handleChange("fieldOfStudy", e.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>
                        Graduation Year / Grade{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar
                          className="absolute left-3 top-2.5 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          value={profile.profile.graduationYear}
                          onChange={(e) =>
                            handleChange("graduationYear", e.target.value)
                          }
                          className={`${inputClass} pl-10`}
                          placeholder="2025 or Class 11"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Student / Academic ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={profile.profile.studentId}
                        onChange={(e) =>
                          handleChange("studentId", e.target.value)
                        }
                        className={inputClass}
                        placeholder="e.g. 2021001234"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Providing this helps verify your status for specific
                        grants.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "public" && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Short Bio</label>
                    <textarea
                      value={profile.profile.bio}
                      onChange={(e) =>
                        handleChange("bio", e.target.value.slice(0, 500))
                      }
                      maxLength={500}
                      className={`${inputClass} h-32 resize-none`}
                      placeholder="Tell the community about your research interests and goals..."
                    />
                    <p className="text-xs text-slate-400 text-right mt-1">
                      {profile.profile.bio.length}/500 chars
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className={labelClass}>
                      Research Interests & Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(profile.profile.skills || []).map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-bold rounded-full px-3 py-1"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-primary-900"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill();
                          }
                        }}
                        className={inputClass}
                        placeholder="Add a skill (e.g. Robotics, Python)..."
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={addSkill}
                        className="px-4"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <LinkIcon size={16} className="text-slate-500" /> Academic
                      & Social Links
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Linkedin size={18} />
                        </div>
                        <input
                          type="url"
                          value={profile.profile.linkedin}
                          onChange={(e) =>
                            handleChange("linkedin", e.target.value)
                          }
                          className={inputClass}
                          placeholder="LinkedIn URL"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                          <Github size={18} />
                        </div>
                        <input
                          type="url"
                          value={profile.profile.github}
                          onChange={(e) =>
                            handleChange("github", e.target.value)
                          }
                          className={inputClass}
                          placeholder="GitHub URL"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Globe size={18} />
                        </div>
                        <input
                          type="url"
                          value={profile.profile.website}
                          onChange={(e) =>
                            handleChange("website", e.target.value)
                          }
                          className={inputClass}
                          placeholder="Personal Website"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                          <BookOpen size={18} />
                        </div>
                        <input
                          type="url"
                          value={profile.profile.googleScholar}
                          onChange={(e) =>
                            handleChange("googleScholar", e.target.value)
                          }
                          className={inputClass}
                          placeholder="Google Scholar URL"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Lock size={18} /> Change Password
                    </h3>
                    <div className="space-y-3 max-w-md">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwords.current}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            current: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwords.next}
                        onChange={(e) =>
                          setPasswords({ ...passwords, next: e.target.value })
                        }
                        className={inputClass}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwords.confirm}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            confirm: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePasswordUpdate}
                        disabled={passwordSaving}
                        className="mt-1 w-fit"
                      >
                        {passwordSaving ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-lg">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <LinkIcon size={18} /> Connected Accounts
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img
                            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                            alt="Google"
                            className="w-6 h-6"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              Google
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={12} /> Connected
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl opacity-60">
                        <div className="flex items-center gap-3">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                            alt="Microsoft"
                            className="w-6 h-6"
                          />
                          <p className="text-sm font-semibold text-slate-900">
                            Microsoft
                          </p>
                        </div>
                        <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2 max-w-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Shield size={18} />
                      <h4 className="text-sm font-bold">
                        Two-Factor Authentication
                      </h4>
                    </div>
                    <p className="text-sm text-amber-800">
                      Protect your account by adding an extra layer of security.
                      We support Authenticator apps (Google/Microsoft Auth).
                    </p>
                    <button className="text-sm font-semibold text-amber-800 underline">
                      Enable 2FA
                    </button>
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
