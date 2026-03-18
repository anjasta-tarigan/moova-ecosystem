import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  FileText,
  Save,
  Lock,
  MessageSquare,
  ExternalLink,
  Download,
  MonitorPlay,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import Button from "../components/Button";
import {
  judgeService,
  JudgingStage,
  Criterion,
  JudgeSubmissionDetail,
} from "../services/judgeService";

const JudgeScoringView: React.FC = () => {
  const { eventId, roundId, submissionId } = useParams(); // roundId = stage (abstract/paper/final)
  const navigate = useNavigate();

  // State
  const [submission, setSubmission] = useState<JudgeSubmissionDetail | null>(
    null,
  );
  const [rubric, setRubric] = useState<Criterion[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"doc" | "poster" | "video">("doc");

  useEffect(() => {
    const init = async () => {
      if (!submissionId || !roundId) return;
      try {
        const data = await judgeService.getSubmissionDetails(
          submissionId,
          roundId as JudgingStage,
        );
        setSubmission(data.submission);
        setRubric(data.rubric);

        // Default tab based on stage
        if (roundId === "paper") setActiveTab("doc");
        if (roundId === "final") setActiveTab("video");

        // Hydrate scores
        if (data.scoreRecord) {
          setScores(data.scoreRecord.criteriaScores);
          setComment(data.scoreRecord.comment);
          setStatus(
            data.scoreRecord.status === "submitted" ? "submitted" : "draft",
          );
        } else {
          const initial: any = {};
          data.rubric.forEach((c) => (initial[c.id] = 0));
          setScores(initial);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [submissionId, roundId]);

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((a: number, b: number) => a + b, 0);
  }, [scores]);

  const maxScore = useMemo(() => {
    return rubric.reduce((a: number, b) => a + b.max, 0);
  }, [rubric]);

  const handleSave = async (newStatus: "draft" | "submitted") => {
    if (!submissionId || !roundId) return;

    if (newStatus === "submitted") {
      if (!window.confirm("Submit final score? This cannot be undone.")) return;
    }

    setSaving(true);
    try {
      await judgeService.saveScore({
        submissionId,
        stage: roundId as JudgingStage,
        criteriaScores: scores,
        comment,
        status: newStatus,
      });
      setStatus(newStatus);
      if (newStatus === "submitted") {
        alert("Score submitted successfully.");
        navigate(-1);
      }
    } catch (e) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-slate-500">
        Loading evaluation console...
      </div>
    );
  if (!submission) return <div>Error loading submission.</div>;

  const isLocked = status === "submitted";

  // Determine which tabs to show based on available assets & stage
  const showPoster = roundId === "paper" || roundId === "final";
  const showVideo = roundId === "final" || submission.presentationUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm font-bold"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              {submission.title}
            </h2>
            <p className="text-xs text-slate-500">
              {submission.team} •{" "}
              <span className="uppercase">{roundId} Stage</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Current Score
            </div>
            <div
              className={`text-xl font-black ${totalScore > 0 ? "text-brand-blue" : "text-slate-300"}`}
            >
              {totalScore}{" "}
              <span className="text-slate-400 text-sm font-medium">
                / {maxScore}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isLocked || saving}
              onClick={() => handleSave("draft")}
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              size="sm"
              disabled={isLocked || saving}
              onClick={() => handleSave("submitted")}
              className={
                isLocked
                  ? "opacity-50 cursor-not-allowed"
                  : "bg-brand-solid-blue"
              }
            >
              {isLocked ? "Submitted" : "Final Submit"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Artifact Viewer */}
        <div className="flex-1 bg-slate-200/50 flex flex-col border-r border-slate-200 relative">
          {/* Viewer Tabs */}
          <div className="bg-white border-b border-slate-200 px-4 flex gap-1">
            <button
              onClick={() => setActiveTab("doc")}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === "doc" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500"}`}
            >
              <FileText size={14} /> Paper / Abstract
            </button>
            {showPoster && (
              <button
                onClick={() => setActiveTab("poster")}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === "poster" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500"}`}
              >
                <ImageIcon size={14} /> Poster
              </button>
            )}
            {showVideo && (
              <button
                onClick={() => setActiveTab("video")}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 ${activeTab === "video" ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-500"}`}
              >
                <MonitorPlay size={14} /> Presentation
              </button>
            )}
          </div>

          {/* Viewer Content */}
          <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            {activeTab === "doc" && (
              <div className="bg-white shadow-lg w-full max-w-3xl min-h-full p-12 border border-slate-200 text-slate-800">
                <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      {submission.title}
                    </h1>
                    <p className="text-sm text-slate-500">
                      {roundId === "abstract"
                        ? "Abstract View"
                        : "Full Paper View"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 text-xs">
                    <Download size={14} /> Download
                  </Button>
                </div>
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-sm font-bold uppercase text-slate-400 mb-2">
                    Abstract
                  </h3>
                  <p className="text-sm leading-relaxed mb-6 font-serif">
                    {submission.abstract}
                  </p>
                  <div className="bg-slate-50 p-8 border border-slate-100 rounded text-center text-slate-400 text-sm">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold">PDF Rendering Placeholder</p>
                    <p className="text-xs">
                      In production, this would render{" "}
                      {submission.fullPaperPdf || submission.abstractPdf}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "poster" && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="bg-white p-2 shadow-xl border border-slate-200 max-h-full aspect-[3/4] flex items-center justify-center bg-slate-50 text-slate-400">
                  {/* Mock Poster */}
                  <div className="text-center">
                    <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                    <p>Poster Preview</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="mt-4 gap-2">
                  <Maximize2 size={14} /> Full Screen
                </Button>
              </div>
            )}

            {activeTab === "video" && (
              <div className="w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl flex items-center justify-center text-white">
                <div className="text-center">
                  <ExternalLink size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-bold">Video Player</p>
                  <a
                    href={submission.presentationUrl}
                    target="_blank"
                    className="text-brand-blue hover:underline text-sm block mt-2"
                  >
                    Open External Link
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Scoring Instrument */}
        <div className="w-[400px] xl:w-[450px] bg-white flex flex-col shadow-xl z-10 border-l border-slate-200">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Grading Rubric</h3>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-bold text-brand-blue">
              Stage: {roundId}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
            {isLocked && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl shadow-xl border border-emerald-100 text-center">
                  <Lock size={32} className="mx-auto text-emerald-500 mb-2" />
                  <h3 className="font-bold text-slate-900">Grading Locked</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submission Complete.
                  </p>
                </div>
              </div>
            )}

            {rubric.map((crit) => (
              <div key={crit.id} className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="font-bold text-sm text-slate-900">
                    {crit.label}
                  </label>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    Max: {crit.max}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">
                  {crit.desc}
                </p>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={crit.max}
                    step="1"
                    value={scores[crit.id] || 0}
                    onChange={(e) =>
                      setScores({
                        ...scores,
                        [crit.id]: parseInt(e.target.value),
                      })
                    }
                    className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    disabled={isLocked}
                  />
                  <div className="w-12 h-10 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-900 bg-slate-50">
                    {scores[crit.id] || 0}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-slate-100">
              <label className="font-bold text-sm text-slate-900 mb-2 block flex items-center gap-2">
                <MessageSquare size={16} /> Final Comments
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none h-32"
                placeholder="Constructive feedback for the participants..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JudgeScoringView;
