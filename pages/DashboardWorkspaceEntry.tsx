import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Layers,
  Lock,
  MessageSquare,
  UploadCloud,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { eventsApi } from "../services/api/eventsApi";
import { submissionsApi } from "../services/api/submissionsApi";

type EventTimeline = {
  id: string;
  title: string;
  date: string;
  description?: string;
  order?: number;
};

type StudentEventDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  status: string;
  registration?: { team?: { name?: string } | null } | null;
  timeline?: EventTimeline[];
  submissionId?: string | null;
  categories?: { name: string }[];
  faqs?: { question: string; answer: string }[];
};

type SubmissionData = {
  id: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "REVISION_REQUESTED"
    | "SCORED";
  files?: { id: string; name: string; size: string }[];
  scores?: Array<{ totalScore?: number; comment?: string; status?: string }>;
};

type StageViewModel = {
  id: string;
  title: string;
  deadline: string;
  status: "completed" | "active" | "locked";
  feedback?: string | null;
  score?: number | null;
  requirements: string[];
};

const DEFAULT_STAGES: Array<Omit<StageViewModel, "status">> = [
  {
    id: "abstract",
    title: "1. Abstract Review",
    deadline: "TBD",
    requirements: [
      "Abstract document (PDF)",
      "Problem statement",
      "Method overview",
    ],
  },
  {
    id: "paper",
    title: "2. Full Paper & Poster",
    deadline: "TBD",
    requirements: [
      "Technical paper (PDF)",
      "Digital poster (JPG/PNG)",
      "Demo or repository link",
    ],
  },
  {
    id: "final",
    title: "3. Final Presentation",
    deadline: "TBD",
    requirements: ["Pitch deck", "Live demo", "Q&A preparation"],
  },
];

const parseStageDate = (date?: string) => {
  if (!date) return Number.NaN;
  const value = Date.parse(date);
  return Number.isNaN(value) ? Number.NaN : value;
};

const normalizeStageTitle = (title: string, index: number) => {
  if (/^\d+\./.test(title.trim())) return title;
  return `${index + 1}. ${title}`;
};

const buildStageRequirements = (index: number, categories: string[]) => {
  if (index === 0) {
    return [
      "Abstract document (PDF)",
      "Research objective and impact",
      "Initial methodology",
    ];
  }

  if (index === 1) {
    return ["Technical paper (PDF)", "Poster asset", "Progress demo link"];
  }

  if (categories.length > 0) {
    return [
      `Final pitch aligned with: ${categories.join(", ")}`,
      "Presentation deck",
      "Q&A readiness",
    ];
  }

  return ["Presentation deck", "Final demo", "Q&A readiness"];
};

const DashboardWorkspaceEntry: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [eventDetail, setEventDetail] = useState<StudentEventDetail | null>(
    null,
  );
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [activeTab, setActiveTab] = useState<"workflow" | "resources">(
    "workflow",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyWorkspaceAccess = async () => {
      if (!slug) {
        navigate("/dashboard/events", { replace: true });
        return;
      }

      const fallbackPath = `/dashboard/events/${encodeURIComponent(slug)}`;

      try {
        setLoading(true);
        setError(null);

        await eventsApi.getStudentWorkspaceAccess(slug);
        const detailResponse = await eventsApi.getStudentEventBySlug(slug);
        const detailPayload = detailResponse.data?.data ?? null;
        setEventDetail(detailPayload);

        if (detailPayload?.submissionId) {
          try {
            const submissionResponse = await submissionsApi.getSubmission(
              detailPayload.submissionId,
            );
            setSubmission(submissionResponse.data?.data ?? null);
          } catch {
            setSubmission(null);
          }
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          "You do not have permission to access this workspace.";
        navigate(fallbackPath, {
          replace: true,
          state: { workspaceError: message },
        });
      } finally {
        setLoading(false);
      }
    };

    void verifyWorkspaceAccess();
  }, [navigate, slug]);

  const stageRows = useMemo(() => {
    const categories = eventDetail?.categories?.map((item) => item.name) ?? [];

    const baseStages =
      eventDetail?.timeline && eventDetail.timeline.length > 0
        ? [...eventDetail.timeline]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((timeline, index) => ({
              id: timeline.id,
              title: normalizeStageTitle(timeline.title, index),
              deadline: timeline.date || "TBD",
              requirements: buildStageRequirements(index, categories),
            }))
        : DEFAULT_STAGES;

    const now = Date.now();
    const dates = baseStages.map((stage) => parseStageDate(stage.deadline));
    let activeIndex = dates.findIndex((timestamp) => {
      if (Number.isNaN(timestamp)) return false;
      return timestamp >= now;
    });

    if (activeIndex < 0) {
      activeIndex = baseStages.length - 1;
    }

    if (
      submission &&
      submission.status !== "DRAFT" &&
      baseStages.length > 1 &&
      activeIndex === 0
    ) {
      activeIndex = 1;
    }

    const latestScore =
      submission?.scores && submission.scores.length > 0
        ? [...submission.scores]
            .reverse()
            .find((item) => item.status === "SUBMITTED") ||
          submission.scores[submission.scores.length - 1]
        : null;

    return baseStages.map((stage, index) => {
      let status: StageViewModel["status"] = "locked";
      if (index < activeIndex) status = "completed";
      if (index === activeIndex) status = "active";

      if (
        submission &&
        submission.status === "SCORED" &&
        index <= activeIndex
      ) {
        status = "completed";
      }

      return {
        ...stage,
        status,
        feedback: index === 0 ? latestScore?.comment || null : null,
        score: index === 0 ? (latestScore?.totalScore ?? null) : null,
      };
    });
  }, [eventDetail, submission]);

  const teamName = eventDetail?.registration?.team?.name || "No team assigned";
  const hasSubmission = Boolean(eventDetail?.submissionId);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!eventDetail || error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">
            {error || "Failed to load workspace."}
          </p>
          <div className="mt-4">
            <Button onClick={() => navigate("/dashboard/events")}>
              Back to My Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <button
          onClick={() => navigate("/dashboard/events")}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ChevronLeft size={16} /> Back to My Events
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded border border-emerald-200">
                {eventDetail.status}
              </span>
              <span className="text-sm font-bold text-slate-500 flex items-center gap-1">
                <Users size={14} /> Team: {teamName}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {eventDetail.title}
            </h1>
            <p className="text-slate-600 max-w-3xl leading-relaxed text-sm">
              {eventDetail.fullDescription || eventDetail.shortDescription}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/team/manage")}
            >
              Manage Team
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (hasSubmission) {
                  navigate(`/dashboard/submission/${eventDetail.submissionId}`);
                  return;
                }

                navigate("/dashboard/team/manage");
              }}
            >
              {hasSubmission ? "Open Submission" : "Start Submission"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("workflow")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "workflow" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Competition Stages
        </button>
        <button
          onClick={() => setActiveTab("resources")}
          className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === "resources" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Resources & Rules
        </button>
      </div>

      {activeTab === "workflow" && (
        <div className="space-y-6">
          {stageRows.map((stage, idx) => {
            const isActive = stage.status === "active";
            const isCompleted = stage.status === "completed";
            const isLocked = stage.status === "locked";

            return (
              <div
                key={stage.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isActive
                    ? "bg-white border-primary-200 shadow-md ring-1 ring-primary-100"
                    : isCompleted
                      ? "bg-slate-50 border-slate-200 opacity-90"
                      : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div
                  className={`p-6 flex items-center justify-between border-b ${isActive ? "border-primary-100 bg-primary-50/30" : "border-slate-100"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-600"
                          : isActive
                            ? "bg-primary-600 text-white"
                            : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : isLocked ? (
                        <Lock size={18} />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-bold ${isActive ? "text-primary-900" : "text-slate-900"}`}
                      >
                        {stage.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-0.5">
                        Deadline: {stage.deadline}
                      </p>
                    </div>
                  </div>

                  {isCompleted && typeof stage.score === "number" && (
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Score
                      </div>
                      <div className="text-xl font-bold text-emerald-600">
                        {stage.score}/100
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {isCompleted && stage.feedback && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-4 flex gap-3">
                      <MessageSquare
                        className="text-emerald-600 shrink-0 mt-1"
                        size={18}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">
                          Judge Feedback
                        </h4>
                        <p className="text-sm text-emerald-800 mt-1">
                          {stage.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {isActive && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <AlertCircle
                              size={16}
                              className="text-primary-600"
                            />
                            Requirements
                          </h4>
                          <ul className="space-y-2">
                            {stage.requirements.map(
                              (requirement, requirementIndex) => (
                                <li
                                  key={`${stage.id}-${requirementIndex}`}
                                  className="flex items-center gap-2 text-sm text-slate-600"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  {requirement}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (hasSubmission) {
                              navigate(
                                `/dashboard/submission/${eventDetail.submissionId}`,
                              );
                              return;
                            }

                            navigate("/dashboard/team/manage");
                          }}
                          className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                        >
                          <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-primary-600 group-hover:scale-110 transition-transform">
                            <UploadCloud size={24} />
                          </div>
                          <p className="text-sm font-bold text-slate-700">
                            {hasSubmission
                              ? "Open Submission Workspace"
                              : "Prepare Submission Workspace"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Continue in the submission portal.
                          </p>
                        </button>
                      </div>
                      <div className="flex justify-end pt-4 border-t border-slate-100">
                        <Button
                          onClick={() => {
                            if (hasSubmission) {
                              navigate(
                                `/dashboard/submission/${eventDetail.submissionId}`,
                              );
                              return;
                            }
                            navigate("/dashboard/team/manage");
                          }}
                        >
                          {hasSubmission
                            ? "Open Submission"
                            : "Go to Team Setup"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {isCompleted &&
                    submission?.files &&
                    submission.files.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Submitted Files
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {submission.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium text-slate-700 border border-slate-200"
                            >
                              <FileText size={16} /> {file.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {isLocked && (
                    <div className="text-center py-4 text-slate-400 text-sm italic">
                      This stage will unlock once the previous stage is
                      completed.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Download size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Event Resources</h3>
          <p className="text-slate-500 mb-6">
            Download templates, guidebooks, and rules.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            {[
              "Participant Guide.pdf",
              "Submission Template.docx",
              "Official Rules.pdf",
            ].map((resource) => (
              <div
                key={resource}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {resource}
                  </span>
                </div>
                <Download size={16} className="text-slate-400" />
              </div>
            ))}
          </div>

          {eventDetail.faqs && eventDetail.faqs.length > 0 && (
            <div className="mt-8 text-left max-w-3xl mx-auto border-t border-slate-100 pt-6 space-y-4">
              <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wide">
                Rules & Clarifications
              </h4>
              {eventDetail.faqs.slice(0, 4).map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="text-sm font-bold text-slate-900">
                    {faq.question}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate("/dashboard/events")}>
          Back to Event Hub
        </Button>
      </div>
    </div>
  );
};

export default DashboardWorkspaceEntry;
