import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Save, UploadCloud, FileText, Trash2, History, Check, 
  Users, Layers, Link as LinkIcon, AlertCircle, Play, Eye, 
  CheckCircle, Lock, Award, Download, ChevronRight, RefreshCw, MessageSquare
} from 'lucide-react';
import Button from '../components/Button';

// --- Types ---
type SubmissionStatus = 'draft' | 'submitted' | 'under_review' | 'revision_requested' | 'scored';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface FileUpload {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number; // 0-100
  url?: string;
}

// --- Mock Initial Data ---
const INITIAL_DATA = {
  teamName: "Project Alpha",
  members: [
    { id: '1', name: 'Alex Participant', role: 'Leader', avatar: 'AP' },
    { id: '2', name: 'Sarah Engineer', role: 'Member', avatar: 'SE' }
  ] as TeamMember[],
  project: {
    title: "Carbon Capture Prototype v1",
    tagline: "Reducing industrial emissions through porous metal-organic frameworks.",
    description: "Our solution utilizes a novel porous material to capture CO2 directly from industrial flues...",
    category: "Deep Tech",
    sdgs: ["13", "9"],
    techStack: "Python, TensorFlow, Arduino",
    problem: "",
    solution: ""
  },
  links: {
    github: "https://github.com/project-alpha/core",
    demo: ""
  },
  files: [
    { id: 'f1', name: 'Technical_Paper_v1.pdf', size: '2.4 MB', type: 'application/pdf', progress: 100 }
  ] as FileUpload[]
};

const MOCK_RESULTS = {
  totalScore: 92,
  maxScore: 100,
  rank: "Top 5%",
  breakdown: [
    { label: "Innovation", score: 28, max: 30 },
    { label: "Feasibility", score: 24, max: 25 },
    { label: "Impact", score: 25, max: 25 },
    { label: "Presentation", score: 15, max: 20 },
  ],
  feedback: "Excellent technical implementation. The scalable model needs more economic validation in the final business plan.",
  certificateAvailable: true
};

const DashboardSubmission: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- State ---
  const [status, setStatus] = useState<SubmissionStatus>('draft');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("Just now");
  
  // Form Data
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [consent, setConsent] = useState(false);

  // Simulation: Dev Toggle to see Scored View
  // In a real app, this comes from DB based on ID
  useEffect(() => {
    if (id?.includes('score')) setStatus('scored');
    if (id?.includes('sub')) setStatus('submitted');
  }, [id]);

  // Autosave Simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === 'draft') {
        setIsSaving(true);
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 800);
      }
    }, 5000); // Auto-save every 5s if draft
    return () => clearTimeout(timer);
  }, [formData, status]);

  // --- Handlers ---

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleSubmit = () => {
    setIsSaving(true);
    setTimeout(() => {
      setStatus('submitted');
      setIsSaving(false);
      window.scrollTo(0, 0);
    }, 1500);
  };

  const handleFileUpload = () => {
    // Simulate upload
    const newFile: FileUpload = {
      id: `f-${Date.now()}`,
      name: "Pitch_Deck_Final.pptx",
      size: "4.5 MB",
      type: "application/vnd",
      progress: 0
    };
    setFormData(prev => ({ ...prev, files: [...prev.files, newFile] }));

    // Animate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFormData(prev => ({
        ...prev,
        files: prev.files.map(f => f.id === newFile.id ? { ...f, progress } : f)
      }));
      if (progress >= 100) clearInterval(interval);
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFormData(prev => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
  };

  // --- Render Helpers ---

  const StepIndicator = () => {
    const steps = [
      { id: 1, label: "Team Info" },
      { id: 2, label: "Project Info" },
      { id: 3, label: "Files & Links" },
      { id: 4, label: "Review" }
    ];

    return (
      <div className="mb-8">
        {/* Mobile Progress */}
        <div className="lg:hidden mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-primary-600 h-full transition-all duration-500" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
          </div>
        </div>

        {/* Desktop Stepper */}
        <div className="hidden lg:flex items-center justify-between relative max-w-3xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center bg-slate-50 px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isActive ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 
                  isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? <Check size={16} /> : step.id}
                </div>
                <span className={`text-xs font-bold mt-2 uppercase tracking-wide ${isActive ? 'text-primary-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Views ---

  const ReadOnlyView = () => (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8 opacity-80 pointer-events-none select-none grayscale-[0.5]">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Project Overview</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-slate-500 block">Title</span> <span className="font-medium">{formData.project.title}</span></div>
          <div><span className="text-slate-500 block">Category</span> <span className="font-medium">{formData.project.category}</span></div>
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Submitted Files</h3>
        <div className="space-y-2">
          {formData.files.map(f => (
            <div key={f.id} className="flex items-center gap-2 text-sm text-slate-600">
              <FileText size={16} /> {f.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ScoredResultsView = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Score Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30">
              {MOCK_RESULTS.totalScore}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">Excellent Work!</h2>
              <p className="text-emerald-100 text-lg">Your submission has been graded.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-1">Global Rank</div>
            <div className="text-4xl font-bold">{MOCK_RESULTS.rank}</div>
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers size={20} /> Score Breakdown
            </h3>
            <div className="space-y-4">
              {MOCK_RESULTS.breakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.score}/{item.max}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(item.score/item.max)*100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} /> Judge's Feedback
            </h3>
            <p className="text-slate-600 italic leading-relaxed text-sm">
              "{MOCK_RESULTS.feedback}"
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
              <span className="text-xs font-bold text-slate-500">Dr. A. Wright, Chief Scientist</span>
            </div>
          </div>
        </div>

        {/* Certificate */}
        {MOCK_RESULTS.certificateAvailable && (
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Certificate of Achievement</h4>
                <p className="text-xs text-slate-500">Verified on blockchain • ID: #882910</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-2">
              <Download size={16} /> Download PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6 mb-2">
        <div>
          <button 
            onClick={() => navigate('/dashboard/event/global-science-summit-2024')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Event
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Submission Portal</h1>
            {/* Status Badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
              status === 'draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              status === 'scored' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        {status === 'draft' && (
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Saving...' : `Saved ${lastSaved}`}
            </span>
          </div>
        )}
      </div>

      {/* Main Content Switcher */}
      {status === 'scored' ? (
        <ScoredResultsView />
      ) : status === 'submitted' || status === 'under_review' ? (
        <div className="space-y-8">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-blue-900 mb-1">Submission Received</h3>
              <p className="text-blue-700 text-sm">
                Your project is currently under review by the judging panel. You will be notified once scores are released.
                Results expected by <strong>Oct 25, 2024</strong>.
              </p>
            </div>
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100" onClick={() => setStatus('draft')}>
              Withdraw / Edit
            </Button>
          </div>
          <ReadOnlyView />
        </div>
      ) : (
        /* DRAFT FLOW */
        <>
          <StepIndicator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Area */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1: Team Info */}
              {currentStep === 1 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Users size={20} className="text-primary-600" /> Team Composition
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    {formData.members.map(member => (
                      <div key={member.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-primary-700">
                          {member.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500 uppercase tracking-wide">{member.role}</div>
                        </div>
                        {member.role === 'Leader' && <Lock size={16} className="text-slate-300" />}
                      </div>
                    ))}
                  </div>

                  {formData.members.length < 3 && (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 flex gap-3 text-sm mb-6">
                      <AlertCircle className="shrink-0" size={20} />
                      <p>Minimum team size is 3. You need to invite at least 1 more member before final submission.</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleNext}>Next Step <ChevronRight size={16} /></Button>
                  </div>
                </div>
              )}

              {/* Step 2: Project Info */}
              {currentStep === 2 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Layers size={20} className="text-primary-600" /> Project Details
                  </h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Project Title</label>
                      <input 
                        type="text" 
                        value={formData.project.title}
                        onChange={(e) => setFormData({...formData, project: {...formData.project, title: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                        placeholder="e.g. EcoSense AI"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tagline (100 chars max)</label>
                      <input 
                        type="text" 
                        value={formData.project.tagline}
                        onChange={(e) => setFormData({...formData, project: {...formData.project, tagline: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all"
                        placeholder="A short pitch..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Abstract / Description</label>
                      <textarea 
                        value={formData.project.description}
                        onChange={(e) => setFormData({...formData, project: {...formData.project, description: e.target.value}})}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-all h-32 resize-none"
                        placeholder="Describe your solution in detail..."
                      />
                      <div className="text-right text-xs text-slate-400 mt-1">
                        {formData.project.description.length}/2000 characters
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                        <select 
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                          value={formData.project.category}
                          onChange={(e) => setFormData({...formData, project: {...formData.project, category: e.target.value}})}
                        >
                          <option>Deep Tech</option>
                          <option>Clean Energy</option>
                          <option>BioTech</option>
                          <option>AI/ML</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tech Stack</label>
                        <input 
                          type="text" 
                          value={formData.project.techStack}
                          onChange={(e) => setFormData({...formData, project: {...formData.project, techStack: e.target.value}})}
                          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="e.g. React, Python, AWS"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={handleNext}>Next Step <ChevronRight size={16} /></Button>
                  </div>
                </div>
              )}

              {/* Step 3: Files */}
              {currentStep === 3 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <UploadCloud size={20} className="text-primary-600" /> Files & Links
                  </h3>

                  {/* Upload Area */}
                  <div 
                    onClick={handleFileUpload}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-primary-300 transition-all cursor-pointer mb-8 group"
                  >
                    <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-500 group-hover:scale-110 transition-transform">
                      <UploadCloud size={28} />
                    </div>
                    <p className="font-bold text-slate-700 text-lg">Click to upload files</p>
                    <p className="text-sm text-slate-400 mt-1">PDF, PPTX, MP4 (Max 100MB)</p>
                  </div>

                  {/* File List */}
                  <div className="space-y-3 mb-8">
                    {formData.files.map(file => (
                      <div key={file.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary-600 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-sm text-slate-900 truncate">{file.name}</span>
                            <span className="text-xs text-slate-500">{file.size}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary-500 h-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                          </div>
                        </div>
                        <button onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-500 p-1">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">GitHub Repository</label>
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                          type="url" 
                          value={formData.links.github}
                          onChange={(e) => setFormData({...formData, links: {...formData.links, github: e.target.value}})}
                          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="https://github.com/username/repo"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Demo Video Link (YouTube/Vimeo)</label>
                      <div className="relative">
                        <Play className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                          type="url" 
                          value={formData.links.demo}
                          onChange={(e) => setFormData({...formData, links: {...formData.links, demo: e.target.value}})}
                          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={handleNext}>Review & Submit <ChevronRight size={16} /></Button>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Eye size={20} className="text-primary-600" /> Review Submission
                  </h3>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6 mb-8">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Project</span>
                      <h4 className="text-lg font-bold text-slate-900">{formData.project.title}</h4>
                      <p className="text-slate-600 text-sm mt-1">{formData.project.tagline}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</span>
                        <p className="text-sm font-medium text-slate-800">{formData.project.category}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Files</span>
                        <p className="text-sm font-medium text-slate-800">{formData.files.length} Attached</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 mb-8">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      Once submitted, your project will be locked for judging. You will not be able to edit unless a revision is requested by the admins.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mb-8">
                    <div 
                      onClick={() => setConsent(!consent)}
                      className={`w-6 h-6 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                        consent ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {consent && <Check size={16} />}
                    </div>
                    <label className="text-sm text-slate-600 cursor-pointer select-none" onClick={() => setConsent(!consent)}>
                      I confirm that this work is original and complies with the competition rules.
                    </label>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={handleBack}>Back</Button>
                    <Button onClick={handleSubmit} disabled={!consent} className={!consent ? 'opacity-50 cursor-not-allowed' : ''}>
                      Confirm Submission
                    </Button>
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                <h4 className="font-bold text-slate-900 mb-4">Submission Checklist</h4>
                <div className="space-y-3">
                  {[
                    { label: "Team of 3+ Members", done: formData.members.length >= 3 },
                    { label: "Project Title & Abstract", done: !!formData.project.title && !!formData.project.description },
                    { label: "Pitch Deck Uploaded", done: formData.files.length > 0 },
                    { label: "Video Demo Link", done: !!formData.links.demo },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        item.done ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-300'
                      }`}>
                        {item.done && <Check size={12} />}
                      </div>
                      <span className={item.done ? 'text-slate-700 font-medium' : 'text-slate-400'}>{item.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Need help? Check the <a href="#" className="text-primary-600 hover:underline">Participant Guide</a> or contact support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardSubmission;