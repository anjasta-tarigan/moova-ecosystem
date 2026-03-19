// @deprecated Use JudgeScoringView.tsx instead
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  Youtube,
  Users,
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  Maximize2,
  Download,
  ExternalLink,
  Lock,
} from "lucide-react";
import Button from "../components/Button";

// --- MOCK DATA ---
const SUBMISSION = {
  id: "sub-102",
  title: "AI for Crop Disease Detection",
  team: "AgriVision",
  track: "AI/ML",
  abstract:
    "We propose a lightweight CNN model deployable on edge devices (Raspberry Pi) to detect early onset of cassava mosaic disease in rural African farms. Our solution works offline and provides actionable treatment advice.",
  problem:
    "Cassava mosaic disease causes $2B+ in annual losses. Farmers lack access to experts for early diagnosis.",
  solution:
    "A mobile app connected to a specialized camera rig that scans leaves and uses our custom model to identify pathogens with 94% accuracy.",
  techStack: ["Python", "TensorFlow Lite", "Flutter", "Raspberry Pi"],
  files: [
    { name: "Technical_Paper.pdf", size: "2.4 MB" },
    { name: "Field_Test_Results.xlsx", size: "1.1 MB" },
    { name: "Business_Model_Canvas.pdf", size: "0.8 MB" },
  ],
  video: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
  repo: "https://github.com/agrivision/core",
  members: [
    { name: "Jane Doe", role: "Lead Dev", avatar: "JD" },
    { name: "John Smith", role: "Data Scientist", avatar: "JS" },
    { name: "Amara K.", role: "Agronomist", avatar: "AK" },
  ],
};

const RUBRIC = [
  {
    id: "c1",
    label: "Innovation & Novelty",
    weight: 30,
    max: 10,
    desc: "Is the solution unique compared to existing alternatives?",
  },
  {
    id: "c2",
    label: "Technical Feasibility",
    weight: 30,
    max: 10,
    desc: "Is the implementation sound and technically viable?",
  },
  {
    id: "c3",
    label: "Impact Potential",
    weight: 25,
    max: 10,
    desc: "Does it significantly address the target SDG?",
  },
  {
    id: "c4",
    label: "Presentation Quality",
    weight: 15,
    max: 10,
    desc: "Clarity of the pitch, video, and documentation.",
  },
];

const DashboardJudgeScoring: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState<
    "overview" | "files" | "video" | "team"
  >("overview");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Simulates "Submitted" state

  // Initialize scores
  useEffect(() => {
    // In real app, fetch existing scores if draft exists
    const initialScores: Record<string, number> = {};
    RUBRIC.forEach((c) => (initialScores[c.id] = 0));
    setScores(initialScores);
  }, []);

  // --- Calculations ---
  const totalScore = useMemo(() => {
    let total = 0;
    RUBRIC.forEach((c) => {
      const score = scores[c.id] || 0;
      total += (score / c.max) * c.weight;
    });
    return Math.round(total * 10) / 10; // Round to 1 decimal
  }, [scores]);

  const progress = useMemo(() => {
    const filled = Object.values(scores).filter((s: number) => s > 0).length;
    return Math.round((filled / RUBRIC.length) * 100);
  }, [scores]);

  // --- Handlers ---
  const handleScoreChange = (id: string, val: number) => {
    if (isLocked) return;
    setScores((prev) => ({ ...prev, [id]: val }));
  };

  const handleCommentChange = (id: string, val: string) => {
    if (isLocked) return;
    setComments((prev) => ({ ...prev, [id]: val }));
  };

  const handleSaveDraft = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Draft saved successfully!");
    }, 800);
  };

  const handleSubmitFinal = () => {
    // Validate
    const incomplete = RUBRIC.some((c) => scores[c.id] === 0);
    if (incomplete) {
      alert("Please score all criteria before submitting.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to submit? This action cannot be undone.",
      )
    )
      return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsLocked(true);
      window.scrollTo(0, 0);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* LEFT PANEL: Submission Content */}
      <div className="flex-1 flex flex-col md:w-3/5 lg:w-2/3 h-full overflow-hidden border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 line-clamp-1">
                {SUBMISSION.title}
              </h1>
              <p className="text-xs text-slate-500">
                by {SUBMISSION.team} • {SUBMISSION.track}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {["overview", "files", "video", "team"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${
                  activeTab === tab
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {activeTab === "overview" && (
            <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-wider">
                  Abstract
                </h3>
                <p className="text-lg text-slate-800 leading-relaxed font-medium">
                  {SUBMISSION.abstract}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                  <h3 className="text-sm font-bold uppercase text-red-800 mb-2 tracking-wider">
                    The Problem
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {SUBMISSION.problem}
                  </p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <h3 className="text-sm font-bold uppercase text-emerald-800 mb-2 tracking-wider">
                    The Solution
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {SUBMISSION.solution}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 tracking-wider">
                  Tech Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {SUBMISSION.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <a
                  href={SUBMISSION.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-primary-600 font-bold text-sm hover:underline"
                >
                  <ExternalLink size={16} /> View Source Code
                </a>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-4 animate-in fade-in duration-300 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Attached Documents
              </h3>
              {SUBMISSION.files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-primary-300 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-primary-700">
                        {file.name}
                      </div>
                      <div className="text-xs text-slate-500">{file.size}</div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-full transition-colors">
                    <Download size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === "video" && (
            <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group">
                {/* Mock Video Embed */}
                <iframe
                  className="w-full h-full"
                  src={SUBMISSION.video}
                  title="Demo Video"
                  allowFullScreen
                ></iframe>
              </div>
              <p className="mt-4 text-sm text-slate-500 text-center">
                Video Demo Submission
              </p>
            </div>
          )}

          {activeTab === "team" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300 max-w-3xl mx-auto">
              {SUBMISSION.members.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">
                    {m.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{m.name}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">
                      {m.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Scoring Form */}
      <div className="w-full md:w-2/5 lg:w-1/3 bg-slate-50 flex flex-col h-full border-l border-slate-200 shadow-xl z-20">
        {/* Score Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Grading Rubric</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">
                {progress}% Complete
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Score
            </span>
            <span
              className={`text-2xl font-black ${totalScore > 0 ? "text-primary-600" : "text-slate-300"}`}
            >
              {totalScore}{" "}
              <span className="text-sm text-slate-400 font-medium">/ 100</span>
            </span>
          </div>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {isLocked && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Grading Locked
              </h3>
              <p className="text-slate-600 text-sm mt-2 mb-6">
                You have submitted the final score for this project. To make
                changes, please contact the event administrator.
              </p>
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                Return to Dashboard
              </Button>
            </div>
          )}

          <div className="space-y-8 pb-8">
            {RUBRIC.map((criterion) => (
              <div
                key={criterion.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <label className="font-bold text-slate-900 text-sm">
                    {criterion.label}
                  </label>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    Weight: {criterion.weight}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-snug">
                  {criterion.desc}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <input
                    type="range"
                    min="0"
                    max={criterion.max}
                    step="1"
                    value={scores[criterion.id] || 0}
                    onChange={(e) =>
                      handleScoreChange(criterion.id, parseInt(e.target.value))
                    }
                    disabled={isLocked}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="w-12 h-10 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-900 bg-slate-50">
                    {scores[criterion.id] || 0}
                  </div>
                </div>

                <div>
                  <textarea
                    placeholder="Optional comment..."
                    rows={1}
                    value={comments[criterion.id] || ""}
                    onChange={(e) =>
                      handleCommentChange(criterion.id, e.target.value)
                    }
                    disabled={isLocked}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:outline-none resize-y min-h-[40px]"
                  />
                </div>
              </div>
            ))}

            {/* General Feedback */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <label className="font-bold text-slate-900 text-sm mb-3 block flex items-center gap-2">
                <MessageSquare size={16} /> General Feedback
              </label>
              <textarea
                placeholder="Final thoughts for the team..."
                rows={4}
                value={generalFeedback}
                onChange={(e) =>
                  !isLocked && setGeneralFeedback(e.target.value)
                }
                disabled={isLocked}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-3">
          <Button
            fullWidth
            onClick={handleSubmitFinal}
            disabled={isLocked || isSubmitting}
            className={isLocked ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isSubmitting ? "Submitting..." : "Submit Final Score"}
          </Button>
          <button
            onClick={handleSaveDraft}
            disabled={isLocked || isSubmitting}
            className="w-full py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> Save Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardJudgeScoring;
