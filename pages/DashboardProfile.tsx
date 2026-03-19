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
  birthDate?: string | null;
  gender?: string;
  address?: string;
  province?: string;
  city?: string;
  educationLevel?: string;
  affiliationType?: string;
  schoolName?: string;
  schoolLevel?: string;
  faculty?: string;
  fieldOfStudy?: string;
  major?: string;
  graduationYear?: string;
  grade?: string;
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

const WORLD_COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo (Brazzaville)",
  "Congo (Kinshasa)",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
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
      birthDate: profileData.birthDate || null,
      gender: profileData.gender || "",
      address: profileData.address || "",
      province: profileData.province || "",
      city: profileData.city || "",
      educationLevel:
        profileData.educationLevel || profileData.schoolLevel || "",
      affiliationType:
        profileData.affiliationType || profileData.schoolLevel || "",
      schoolName: profileData.schoolName || profileData.institution || "",
      faculty: profileData.faculty || "",
      fieldOfStudy: profileData.fieldOfStudy || profileData.major || "",
      schoolLevel: profileData.schoolLevel || "",
      major: profileData.major || "",
      graduationYear: profileData.graduationYear || profileData.grade || "",
      grade: profileData.grade || "",
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
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChange = (field: string, value: any) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: { ...prev.profile, [field]: value },
      };
    });
  };

  const handleUserChange = (field: string, value: any) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        user: { ...prev.user, [field]: value },
      };
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const res = await profileApi.uploadAvatar(file);
      const { avatarUrl } = res.data.data;

      // Update local state immediately (optimistic)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              profile: { ...prev.profile, avatar: avatarUrl },
            }
          : prev,
      );

      showNotification("success", "Profile photo updated.");
    } catch (err: any) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to upload photo.",
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
        fullName: profile.user?.fullName || "",
        phone: profile.profile?.phone || "",
        birthDate: profile.profile?.birthDate || null,
        gender: profile.profile?.gender || "",
        address: profile.profile?.address || "",
        country: profile.profile?.country || "",
        affiliationType: profile.profile?.affiliationType || "University",
        schoolName: profile.profile?.schoolName || "",
        schoolLevel: profile.profile?.schoolLevel || "",
        faculty: profile.profile?.faculty || "",
        fieldOfStudy: profile.profile?.fieldOfStudy || "",
        major: profile.profile?.major || "",
        studentId: profile.profile?.studentId || "",
        grade: profile.profile?.grade || "",
        graduationYear: profile.profile?.graduationYear || "",
        province: profile.profile?.province || "",
        city: profile.profile?.city || "",
        educationLevel: profile.profile?.educationLevel || "",
        bio: profile.profile?.bio || "",
        skills: profile.profile?.skills || [],
        linkedin: profile.profile?.linkedin || "",
        github: profile.profile?.github || "",
        website: profile.profile?.website || "",
        googleScholar: profile.profile?.googleScholar || "",
      };

      const res = await profileApi.updateProfile(payload);

      setProfile(res.data.data);

      showNotification("success", "Profile updated successfully.");
    } catch (err: any) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    setPasswordErrors({});
    try {
      await profileApi.changePassword(passwordForm);
      showNotification("success", "Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password.";
      if (msg.toLowerCase().includes("current")) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
      } else {
        showNotification("error", msg);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const completeness = profile?.profile?.completeness || 0;
  const isComplete = completeness >= 80;

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

  const apiBase =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

  const avatarSrc = profile.profile?.avatar
    ? profile.profile.avatar.startsWith("http")
      ? profile.profile.avatar
      : `${apiBase}${profile.profile.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.fullName || "User")}&background=random`;

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
                    src={avatarSrc}
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
                {profile?.user?.fullName || "New User"}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase rounded-full">
                  {profile?.profile?.affiliationType || "Unknown"}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {profile?.profile?.schoolName || "No Institution"}
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
                    <span className="truncate">
                      {profile?.user?.email || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <MapPin size={16} className="text-slate-400" />
                    <span>
                      {profile?.profile?.country ||
                        profile?.profile?.province ||
                        "Global"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <GraduationCap size={16} className="text-slate-400" />
                    <span>
                      {profile?.profile?.educationLevel ||
                        profile?.profile?.schoolLevel ||
                        "Not set"}
                    </span>
                  </div>
                  {profile?.profile?.studentId ? (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <FileBadge size={16} className="text-slate-400" />
                      <span>ID: {profile.profile.studentId}</span>
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
                      isComplete
                        ? "bg-emerald-50 border-emerald-100"
                        : "bg-amber-50 border-amber-100"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        isComplete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {isComplete
                          ? "Profile Complete"
                          : "Profile Incomplete — complete Academic & Affiliation to register for events"}
                      </p>
                      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden mt-3">
                        <div
                          className={`h-full ${
                            isComplete ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium text-right">
                        {completeness}% Completed
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
                          value={profile?.user?.fullName?.split(" ")[0] || ""}
                          onChange={(e) => {
                            const lastName =
                              profile?.user?.fullName
                                ?.split(" ")
                                .slice(1)
                                .join(" ") || "";
                            handleUserChange(
                              "fullName",
                              `${e.target.value} ${lastName}`.trim(),
                            );
                          }}
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
                        value={
                          profile?.user?.fullName
                            ?.split(" ")
                            .slice(1)
                            .join(" ") || ""
                        }
                        onChange={(e) => {
                          const firstName =
                            profile?.user?.fullName?.split(" ")[0] || "";
                          handleUserChange(
                            "fullName",
                            `${firstName} ${e.target.value}`.trim(),
                          );
                        }}
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
                      value={profile?.profile?.country || ""}
                      onChange={(e) => handleChange("country", e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Country / Region</option>
                      {WORLD_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
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
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Lock size={20} className="text-primary-600" />
                      Change Password
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              currentPassword: e.target.value,
                            }));
                            setPasswordErrors((p) => ({
                              ...p,
                              currentPassword: "",
                            }));
                          }}
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm font-medium
                ${passwordErrors.currentPassword ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                          placeholder="Enter current password"
                        />
                        {passwordErrors.currentPassword && (
                          <p className="text-xs text-red-600 mt-1">
                            {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              newPassword: e.target.value,
                            }));
                            setPasswordErrors((p) => ({
                              ...p,
                              newPassword: "",
                            }));
                          }}
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm font-medium
                ${passwordErrors.newPassword ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                          placeholder="Min. 8 characters"
                        />
                        {passwordErrors.newPassword && (
                          <p className="text-xs text-red-600 mt-1">
                            {passwordErrors.newPassword}
                          </p>
                        )}
                        {passwordForm.newPassword && (
                          <div className="mt-2">
                            <div className="flex gap-1 mb-1">
                              {[1, 2, 3, 4].map((i) => (
                                <div
                                  key={i}
                                  className={`h-1 flex-1 rounded-full transition-colors ${
                                    passwordForm.newPassword.length >= i * 3
                                      ? i <= 1
                                        ? "bg-red-400"
                                        : i <= 2
                                          ? "bg-amber-400"
                                          : i <= 3
                                            ? "bg-blue-400"
                                            : "bg-emerald-500"
                                      : "bg-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-slate-400">
                              {passwordForm.newPassword.length < 4
                                ? "Too short"
                                : passwordForm.newPassword.length < 7
                                  ? "Weak"
                                  : passwordForm.newPassword.length < 10
                                    ? "Good"
                                    : "Strong"}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              confirmPassword: e.target.value,
                            }));
                            setPasswordErrors((p) => ({
                              ...p,
                              confirmPassword: "",
                            }));
                          }}
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm font-medium
                ${
                  passwordErrors.confirmPassword
                    ? "border-red-300 bg-red-50"
                    : passwordForm.confirmPassword &&
                        passwordForm.newPassword ===
                          passwordForm.confirmPassword
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200"
                }`}
                          placeholder="Re-enter new password"
                        />
                        {passwordErrors.confirmPassword ? (
                          <p className="text-xs text-red-600 mt-1">
                            {passwordErrors.confirmPassword}
                          </p>
                        ) : passwordForm.confirmPassword &&
                          passwordForm.newPassword ===
                            passwordForm.confirmPassword ? (
                          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} /> Passwords match
                          </p>
                        ) : null}
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock size={16} />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

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
