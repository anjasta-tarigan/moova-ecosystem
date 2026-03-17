import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Building, BookOpen, GraduationCap, 
  Calendar, Link as LinkIcon, Github, Linkedin, Globe, Camera, 
  Save, CheckCircle, AlertCircle, Shield, Lock, Trash2, Plus, Upload, X,
  FileBadge, AlertTriangle
} from 'lucide-react';
import Button from '../components/Button';
import { userService, UserProfile } from '../services/userService';

const DashboardProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'academic' | 'public' | 'security'>('general');
  const [notification, setNotification] = useState<{type: 'success'|'error', msg: string} | null>(null);
  const [newSkill, setNewSkill] = useState('');
  
  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      // Auto-redirect to academic tab if incomplete
      if (data.completeness < 80) {
        setActiveTab('academic');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await userService.updateProfile(profile);
      setProfile(updated);
      showNotification('success', 'Profile updated successfully.');
    } catch (e) {
      showNotification('error', 'Failed to save changes.');
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
          const updated = await userService.updateProfile({ ...profile, avatar: url });
          setProfile(updated);
          showNotification('success', 'Profile photo updated.');
        }
      } catch (err) {
        showNotification('error', 'Failed to upload photo.');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && profile && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (profile) {
      setProfile({ ...profile, skills: profile.skills.filter(s => s !== skillToRemove) });
    }
  };

  const isComplete = (profile?.completeness || 0) >= 80;

  if (loading) return <div className="p-12 text-center text-slate-500">Loading profile data...</div>;
  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {/* Header & Status */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Profile & Affiliation</h1>
            <p className="text-slate-500 mt-1">Manage your academic identity for event registration and certification.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px] shadow-md">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Completeness Banner */}
        <div className={`rounded-xl p-4 border flex items-start gap-4 ${
          isComplete ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
        }`}>
          <div className={`p-2 rounded-full shrink-0 ${isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isComplete ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div className="flex-1">
            <h4 className={`font-bold text-sm mb-1 ${isComplete ? 'text-emerald-900' : 'text-amber-900'}`}>
              {isComplete ? 'Profile Complete' : 'Profile Incomplete'}
            </h4>
            <p className={`text-sm mb-3 ${isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isComplete 
                ? 'Your academic profile meets the requirements for international competitions.' 
                : 'You must complete the Academic & Affiliation section to register for events or join teams.'}
            </p>
            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                style={{ width: `${profile.completeness}%` }}
              ></div>
            </div>
            <p className="text-xs mt-1 text-slate-500 font-medium text-right">{profile.completeness}% Completed</p>
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
                  src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=random`} 
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

            <h2 className="text-xl font-bold text-slate-900">{profile.firstName || 'New'} {profile.lastName || 'User'}</h2>
            <div className="flex justify-center items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                {profile.affiliationType}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-2 mb-6 font-medium">{profile.institution || 'No Institution'}</p>

            <div className="border-t border-slate-100 pt-6 text-left space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{profile.country || 'Global'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <GraduationCap size={16} className="text-slate-400 shrink-0" />
                <span>{profile.educationLevel}</span>
              </div>
              {profile.studentId && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <FileBadge size={16} className="text-slate-400 shrink-0" />
                  <span>ID: {profile.studentId}</span>
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
                { id: 'general', label: 'Basic Identity', icon: User },
                { id: 'academic', label: 'Academic & Affiliation', icon: GraduationCap, alert: !isComplete },
                { id: 'public', label: 'Public Profile', icon: Globe },
                { id: 'security', label: 'Security', icon: Shield },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors border-b-2 whitespace-nowrap relative ${
                    activeTab === tab.id 
                      ? 'border-primary-600 text-primary-700 bg-primary-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.alert && <span className="absolute top-3 right-3 w-2 h-2 bg-amber-500 rounded-full"></span>}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-8 flex-1">
              
              {/* --- GENERAL TAB --- */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">First Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={profile.firstName} 
                        onChange={e => handleChange('firstName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Last Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={profile.lastName} 
                        onChange={e => handleChange('lastName', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          value={profile.email} 
                          disabled 
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed text-sm font-medium" 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Contact support to change email.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                          type="tel" 
                          value={profile.phone} 
                          onChange={e => handleChange('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Country / Region <span className="text-red-500">*</span></label>
                    <select 
                      value={profile.country} 
                      onChange={e => handleChange('country', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                    >
                      <option value="">Select Country</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Germany">Germany</option>
                      <option value="Singapore">Singapore</option>
                      <option value="India">India</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>
                </div>
              )}

              {/* --- ACADEMIC TAB (MANDATORY) --- */}
              {activeTab === 'academic' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                    <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                      <AlertCircle size={16} />
                      This section is required for event registration and certificate issuance.
                    </p>
                  </div>

                  {/* Affiliation Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Affiliation Type <span className="text-red-500">*</span></label>
                    <select 
                      value={profile.affiliationType} 
                      onChange={e => handleChange('affiliationType', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                    >
                      <option value="University">University</option>
                      <option value="High School">High School</option>
                      <option value="Research Institution">Research Institution</option>
                      <option value="Company">Company</option>
                      <option value="Independent">Independent / Freelance</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Institution / Organization Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          value={profile.institution} 
                          onChange={e => handleChange('institution', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                          placeholder="e.g. Imperial College London"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Faculty / Department <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={profile.faculty} 
                        onChange={e => handleChange('faculty', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                        placeholder="e.g. Faculty of Engineering"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Major / Field of Study <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          value={profile.fieldOfStudy} 
                          onChange={e => handleChange('fieldOfStudy', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                          placeholder="e.g. Computer Science"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Education Level <span className="text-red-500">*</span></label>
                      <select 
                        value={profile.educationLevel} 
                        onChange={e => handleChange('educationLevel', e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                      >
                        <option>High School</option>
                        <option>Undergraduate</option>
                        <option>Master</option>
                        <option>PhD</option>
                        <option>Professional</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Graduation Year (Expected) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                          type="number" 
                          value={profile.graduationYear} 
                          onChange={e => handleChange('graduationYear', e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                          placeholder="2025"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Student / Academic ID (Optional)</label>
                    <input 
                      type="text" 
                      value={profile.studentId} 
                      onChange={e => handleChange('studentId', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium" 
                      placeholder="e.g. ID-123456"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Providing this helps verify your status for specific grants.</p>
                  </div>
                </div>
              )}

              {/* --- PUBLIC TAB --- */}
              {activeTab === 'public' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Short Bio</label>
                    <textarea 
                      value={profile.bio} 
                      onChange={e => handleChange('bio', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-sm font-medium h-32 resize-none"
                      placeholder="Tell the community about your research interests and goals..."
                    />
                    <p className="text-right text-xs text-slate-400 mt-1">{profile.bio.length}/500 chars</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Research Interests & Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.skills.map((skill, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm font-bold rounded-full border border-primary-100">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-primary-900"><X size={14} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSkill()}
                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                        placeholder="Add a skill (e.g. Robotics, Python)..."
                      />
                      <Button size="sm" type="button" onClick={addSkill} className="w-auto px-4"><Plus size={18} /></Button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">Academic & Social Links</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Linkedin size={20} />
                        </div>
                        <input 
                          type="url" 
                          value={profile.linkedin}
                          onChange={e => handleChange('linkedin', e.target.value)}
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
                          onChange={e => handleChange('github', e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-200 focus:border-slate-500 outline-none text-sm"
                          placeholder="GitHub URL"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Globe size={20} />
                        </div>
                        <input 
                          type="url" 
                          value={profile.website}
                          onChange={e => handleChange('website', e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-sm"
                          placeholder="Personal Website"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                          <BookOpen size={20} />
                        </div>
                        <input 
                          type="url" 
                          value={profile.googleScholar}
                          onChange={e => handleChange('googleScholar', e.target.value)}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none text-sm"
                          placeholder="Google Scholar URL"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- SECURITY TAB --- */}
              {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  
                  {/* Password Change */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Lock size={20} className="text-primary-600" /> Change Password
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Current Password</label>
                        <input type="password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">New Password</label>
                        <input type="password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Confirm New Password</label>
                        <input type="password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-100 outline-none text-sm" />
                      </div>
                      <Button variant="outline" size="sm">Update Password</Button>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Connected Accounts */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <LinkIcon size={20} className="text-primary-600" /> Connected Accounts
                    </h3>
                    <div className="space-y-3 max-w-lg">
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center gap-3">
                          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" className="w-6 h-6" alt="Google" />
                          <span className="font-bold text-slate-700 text-sm">Google</span>
                        </div>
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Connected
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white opacity-60">
                        <div className="flex items-center gap-3">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" className="w-6 h-6" alt="Microsoft" />
                          <span className="font-bold text-slate-700 text-sm">Microsoft</span>
                        </div>
                        <button className="text-xs text-primary-600 font-bold hover:underline">Connect</button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 mt-8">
                    <Shield className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Two-Factor Authentication</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Protect your account by adding an extra layer of security. We support Authenticator apps (Google/Microsoft Auth).
                      </p>
                      <button className="text-xs font-bold text-amber-800 underline mt-2">Enable 2FA</button>
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