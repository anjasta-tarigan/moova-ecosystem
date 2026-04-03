import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  FileText,
  FolderOpen,
  MessageCircle,
  Upload,
  Users,
} from "lucide-react";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuthContext } from "../../contexts/AuthContext";
import { useEventRealtime } from "../../hooks/useEventRealtime";
import { getCardMeta, ManageEventCardKey } from "../../lib/manageEventCards";
import { adminApi } from "../../services/api/adminApi";

type ConfigForm = {
  title: string;
  format: string;
  category: string;
  location: string;
  date: string;
  deadline: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  fee: string;
  organizer: string;
  eventTypeId: string;
  rules: string;
  eligibility: string[];
};

type FaqRow = { id: string; question: string; answer: string };
type CriteriaRow = {
  id: string;
  name: string;
  weight: number;
  description: string;
};
type TimelineRow = {
  id: string;
  date: string;
  title: string;
  description: string;
};
type ResourceRow = {
  id?: string;
  title: string;
  url: string;
  type: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number | null;
};

type PendingUploadRow = {
  id: string;
  file: File;
  title: string;
  type: string;
};

type JudgeAssignmentRow = {
  id: string;
  judgeId: string;
  categoryId: string;
  currentStage: "ABSTRACT" | "PAPER" | "FINAL";
};

type StageRow = {
  stageType: "ABSTRACT" | "PAPER" | "FINAL";
  startAt: string;
  deadlineAt: string;
};

type AwardRow = {
  id: string;
  rank: number;
  title: string;
  tier: "MAIN" | "HONORABLE";
  description: string;
};

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const toLocalDateTimeInput = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIsoFromInput = (value?: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
};

const detectResourceType = (file: File) => {
  const mime = file.type.toLowerCase();
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("word")) return "DOC";
  if (mime.includes("presentation")) return "PPT";
  if (mime.includes("sheet") || mime.includes("excel")) return "XLS";
  if (mime.includes("zip")) return "ZIP";
  if (mime.includes("image")) return "IMAGE";
  return "OTHER";
};

const ManageEventCardForm: React.FC = () => {
  const { id, cardKey } = useParams<{ id: string; cardKey: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuthContext();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDetail, setEventDetail] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [eligibilityCategories, setEligibilityCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [judgeOptions, setJudgeOptions] = useState<
    Array<{ id: string; fullName: string; email: string }>
  >([]);

  const [newEventType, setNewEventType] = useState("");
  const [newEligibilityCategory, setNewEligibilityCategory] = useState("");

  const [config, setConfig] = useState<ConfigForm>({
    title: "",
    format: "HYBRID",
    category: "",
    location: "",
    date: "",
    deadline: "",
    registrationOpenDate: "",
    registrationCloseDate: "",
    fee: "",
    organizer: "",
    eventTypeId: "",
    rules: "",
    eligibility: [],
  });
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [criteria, setCriteria] = useState<CriteriaRow[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [rulesText, setRulesText] = useState("");
  const [rulesEligibility, setRulesEligibility] = useState<string[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUploadRow[]>([]);
  const [assignments, setAssignments] = useState<JudgeAssignmentRow[]>([]);
  const [stages, setStages] = useState<StageRow[]>([
    { stageType: "ABSTRACT", startAt: "", deadlineAt: "" },
    { stageType: "PAPER", startAt: "", deadlineAt: "" },
    { stageType: "FINAL", startAt: "", deadlineAt: "" },
  ]);
  const [awardsEnabled, setAwardsEnabled] = useState(false);
  const [awards, setAwards] = useState<AwardRow[]>([]);

  const basePath = useMemo(
    () =>
      location.pathname.startsWith("/superadmin") ? "/superadmin" : "/admin",
    [location.pathname],
  );

  const card = useMemo(() => getCardMeta(cardKey), [cardKey]);
  const readonly = !isSuperAdmin;

  const hydrateFormState = useCallback((event: any) => {
    setConfig({
      title: event?.title || "",
      format: event?.format || "HYBRID",
      category: event?.category || "",
      location: event?.location || "",
      date: event?.date || "",
      deadline: event?.deadline || "",
      registrationOpenDate: toLocalDateTimeInput(event?.registrationOpenDate),
      registrationCloseDate: toLocalDateTimeInput(event?.registrationCloseDate),
      fee: event?.fee || "",
      organizer: event?.organizer || "",
      eventTypeId: event?.eventTypeId || "",
      rules: event?.rules || "",
      eligibility: Array.isArray(event?.eligibility) ? event.eligibility : [],
    });

    setFaqs(
      (event?.faqs || []).map((item: any) => ({
        id: item.id || makeId(),
        question: item.question || "",
        answer: item.answer || "",
      })),
    );

    setCriteria(
      (event?.criteria || []).map((item: any) => ({
        id: item.id || makeId(),
        name: item.name || "",
        weight: Number(item.weight || 0),
        description: item.description || "",
      })),
    );

    setTimeline(
      (event?.timeline || []).map((item: any) => ({
        id: item.id || makeId(),
        date: item.date || "",
        title: item.title || "",
        description: item.description || "",
      })),
    );

    setRulesText(event?.rules || "");
    setRulesEligibility(
      Array.isArray(event?.eligibility) ? event.eligibility : [],
    );

    setResources(
      (event?.resources || []).map((item: any) => ({
        id: item.id,
        title: item.title || "",
        url: item.url || "",
        type: item.type || "OTHER",
        fileName: item.fileName || item.title || "resource",
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
      })),
    );

    setAssignments(
      (event?.judgeAssignments || []).map((item: any) => ({
        id: item.id || makeId(),
        judgeId: item.judgeId,
        categoryId: item.categoryId,
        currentStage: (item.currentStage || "ABSTRACT") as
          | "ABSTRACT"
          | "PAPER"
          | "FINAL",
      })),
    );

    const nextStages: StageRow[] = ["ABSTRACT", "PAPER", "FINAL"].map(
      (stageType) => {
        const found = (event?.stages || []).find(
          (stage: any) => stage.stageType === stageType,
        );
        return {
          stageType: stageType as StageRow["stageType"],
          startAt: toLocalDateTimeInput(found?.startAt),
          deadlineAt: toLocalDateTimeInput(found?.deadlineAt),
        };
      },
    );
    setStages(nextStages);

    setAwardsEnabled(Boolean(event?.awardsEnabled));
    setAwards(
      (event?.awards || []).map((item: any) => ({
        id: item.id || makeId(),
        rank: Number(item.rank || 0),
        title: item.title || "",
        tier: (item.tier || "MAIN") as "MAIN" | "HONORABLE",
        description: item.description || "",
      })),
    );
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [eventResponse, taxonomyResponse, usersResponse] =
        await Promise.all([
          adminApi.getManageEvent(id),
          adminApi.getEventTaxonomies(),
          isSuperAdmin
            ? adminApi.getAdminJudgeUsers({
                role: "JUDGE",
                page: 1,
                limit: 200,
              })
            : Promise.resolve({ data: { data: [] } }),
        ]);

      const eventPayload = eventResponse.data?.data ?? eventResponse.data;
      const taxonomyPayload =
        taxonomyResponse.data?.data ?? taxonomyResponse.data;
      const usersPayload =
        usersResponse?.data?.data ?? usersResponse?.data ?? [];

      setEventDetail(eventPayload);
      setEventTitle(eventPayload?.title || "Untitled Event");
      setEventTypes(taxonomyPayload?.eventTypes || []);
      setEligibilityCategories(taxonomyPayload?.eligibilityCategories || []);

      const normalizedUsers = Array.isArray(usersPayload)
        ? usersPayload
            .map((user: any) => ({
              id: user.id,
              fullName: user.fullName || "Unknown Judge",
              email: user.email || "",
            }))
            .filter((user: any) => Boolean(user.id))
        : [];

      setJudgeOptions(normalizedUsers);
      hydrateFormState(eventPayload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load event card form",
      );
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFormState, id, isSuperAdmin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRealtimeUpdate = useCallback(() => {
    void loadData();
  }, [loadData]);

  useEventRealtime(id, handleRealtimeUpdate, Boolean(id));

  const categories = useMemo(
    () =>
      Array.isArray(eventDetail?.categories) ? eventDetail.categories : [],
    [eventDetail?.categories],
  );

  const mergedJudgeOptions = useMemo(() => {
    const map = new Map<
      string,
      { id: string; fullName: string; email: string }
    >();

    for (const item of judgeOptions) {
      map.set(item.id, item);
    }

    for (const assignment of eventDetail?.judgeAssignments || []) {
      if (assignment.judgeId && assignment.judge) {
        map.set(assignment.judgeId, {
          id: assignment.judgeId,
          fullName: assignment.judge.fullName || "Unknown Judge",
          email: assignment.judge.email || "",
        });
      }
    }

    return [...map.values()];
  }, [eventDetail?.judgeAssignments, judgeOptions]);

  const eligibilityOptions = useMemo(() => {
    const merged = new Set<string>();
    for (const item of eligibilityCategories) merged.add(item.name);
    for (const item of config.eligibility) merged.add(item);
    for (const item of rulesEligibility) merged.add(item);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [config.eligibility, eligibilityCategories, rulesEligibility]);

  const criteriaWeightTotal = useMemo(
    () => criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0),
    [criteria],
  );

  const saveAction = async (
    executor: () => Promise<any>,
    successMessage: string,
  ) => {
    try {
      setIsSaving(true);
      setActionMessage(null);
      await executor();
      setActionMessage(successMessage);
      await loadData();
    } catch (err: any) {
      setActionMessage(
        err?.response?.data?.message || "Failed to save changes",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEligibility = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleCreateEventType = async () => {
    const normalized = newEventType.trim();
    if (normalized.length < 2) return;

    await saveAction(
      () => adminApi.createEventTypeTaxonomy(normalized),
      "Event type added",
    );
    setNewEventType("");
  };

  const handleCreateEligibilityCategory = async () => {
    const normalized = newEligibilityCategory.trim();
    if (normalized.length < 2) return;

    await saveAction(
      () => adminApi.createEventEligibilityTaxonomy(normalized),
      "Eligibility category added",
    );
    setNewEligibilityCategory("");
  };

  const handleResourceInput = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const nextRows = Array.from(fileList).map((file) => ({
      id: makeId(),
      file,
      title: file.name.replace(/\.[^/.]+$/, ""),
      type: detectResourceType(file),
    }));
    setPendingUploads((prev) => [...prev, ...nextRows]);
  };

  const handleUploadResources = async () => {
    if (pendingUploads.length === 0) return;

    const formData = new FormData();
    pendingUploads.forEach((item) => {
      formData.append("files", item.file);
      formData.append("titles", item.title);
      formData.append("types", item.type);
    });

    await saveAction(async () => {
      const response = await adminApi.uploadEventResources(formData);
      const payload = response.data?.data ?? response.data;
      const uploaded = Array.isArray(payload?.files) ? payload.files : [];
      setResources((prev) => [...prev, ...uploaded]);
      setPendingUploads([]);
      if (uploaded.length > 0) {
        await adminApi.patchEventResources(id!, {
          resources: [...resources, ...uploaded],
        });
      }
    }, "Resources uploaded and saved");
  };

  if (isLoading) return <LoadingSpinner />;

  if (!card) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">
        Unknown card route.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  const renderReadOnlyBadge = () => {
    if (!readonly) return null;
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        Readonly mode active for Admin. Editing is restricted to Superadmin.
      </div>
    );
  };

  const renderConfigurationForm = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Event Name
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.title}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, title: event.target.value }))
            }
            disabled={readonly}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Event Type
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.eventTypeId}
            onChange={(event) =>
              setConfig((prev) => ({
                ...prev,
                eventTypeId: event.target.value,
              }))
            }
            disabled={readonly}
          >
            <option value="">Select event type</option>
            {eventTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Format
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.format}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, format: event.target.value }))
            }
            disabled={readonly}
          >
            <option value="ONLINE">ONLINE</option>
            <option value="HYBRID">HYBRID</option>
            <option value="IN_PERSON">IN_PERSON</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Category
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.category}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, category: event.target.value }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Event Date
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.date}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, date: event.target.value }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Registration Deadline
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.deadline}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, deadline: event.target.value }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Registration Opens
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.registrationOpenDate}
            onChange={(event) =>
              setConfig((prev) => ({
                ...prev,
                registrationOpenDate: event.target.value,
              }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Registration Closes
          <input
            type="datetime-local"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.registrationCloseDate}
            onChange={(event) =>
              setConfig((prev) => ({
                ...prev,
                registrationCloseDate: event.target.value,
              }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Location
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.location}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, location: event.target.value }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Fee
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.fee}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, fee: event.target.value }))
            }
            disabled={readonly}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Organizer
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={config.organizer}
            onChange={(event) =>
              setConfig((prev) => ({ ...prev, organizer: event.target.value }))
            }
            disabled={readonly}
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Eligibility</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {eligibilityOptions.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={config.eligibility.includes(item)}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    eligibility: prev.eligibility.includes(item)
                      ? prev.eligibility.filter((entry) => entry !== item)
                      : [...prev.eligibility, item],
                  }))
                }
                disabled={readonly}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Rules Summary
        <textarea
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={config.rules}
          onChange={(event) =>
            setConfig((prev) => ({ ...prev, rules: event.target.value }))
          }
          disabled={readonly}
        />
      </label>

      {!readonly && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            + Add Event Type
            <div className="mt-1 flex gap-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={newEventType}
                onChange={(event) => setNewEventType(event.target.value)}
              />
              <Button type="button" onClick={handleCreateEventType}>
                Add
              </Button>
            </div>
          </label>

          <label className="text-sm font-medium text-slate-700">
            + Add Eligibility Category
            <div className="mt-1 flex gap-2">
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={newEligibilityCategory}
                onChange={(event) =>
                  setNewEligibilityCategory(event.target.value)
                }
              />
              <Button type="button" onClick={handleCreateEligibilityCategory}>
                Add
              </Button>
            </div>
          </label>
        </div>
      )}

      {!readonly && (
        <Button
          type="button"
          onClick={() =>
            saveAction(
              () =>
                adminApi.patchEventConfig(id!, {
                  ...config,
                  title: config.title.trim(),
                  registrationOpenDate: toIsoFromInput(
                    config.registrationOpenDate,
                  ),
                  registrationCloseDate: toIsoFromInput(
                    config.registrationCloseDate,
                  ),
                  eligibility: config.eligibility,
                }),
              "Configuration updated",
            )
          }
          disabled={isSaving || config.title.trim().length < 3}
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      )}
    </div>
  );

  const renderFaqForm = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        {faqs.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No FAQ entries yet.
          </div>
        )}
        {faqs.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4"
          >
            <label className="text-sm font-medium text-slate-700">
              Question {index + 1}
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.question}
                onChange={(event) =>
                  setFaqs((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, question: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Answer
              <textarea
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.answer}
                onChange={(event) =>
                  setFaqs((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, answer: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>
            {!readonly && (
              <div>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setFaqs((prev) => prev.filter((row) => row.id !== item.id))
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setFaqs((prev) => [
                ...prev,
                { id: makeId(), question: "", answer: "" },
              ])
            }
          >
            Add FAQ
          </Button>
          <Button
            type="button"
            onClick={() =>
              saveAction(
                () =>
                  adminApi.patchEventFaqs(id!, {
                    faqs: faqs
                      .map((item, index) => ({
                        question: item.question.trim(),
                        answer: item.answer.trim(),
                        order: index + 1,
                      }))
                      .filter((item) => item.question && item.answer),
                  }),
                "FAQs updated",
              )
            }
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save FAQs"}
          </Button>
        </div>
      )}
    </div>
  );

  const renderCriteriaForm = () => (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Total weight: <strong>{criteriaWeightTotal}%</strong>
      </div>

      <div className="space-y-3">
        {criteria.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No criteria configured yet.
          </div>
        )}
        {criteria.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-12"
          >
            <label className="md:col-span-4 text-sm font-medium text-slate-700">
              Criteria Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.name}
                onChange={(event) =>
                  setCriteria((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, name: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            <label className="md:col-span-2 text-sm font-medium text-slate-700">
              Weight (%)
              <input
                type="number"
                min={0}
                max={100}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.weight}
                onChange={(event) =>
                  setCriteria((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, weight: Number(event.target.value || 0) }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            <label className="md:col-span-6 text-sm font-medium text-slate-700">
              Description
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.description}
                onChange={(event) =>
                  setCriteria((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, description: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            {!readonly && (
              <div className="md:col-span-12">
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setCriteria((prev) =>
                      prev.filter((row) => row.id !== item.id),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setCriteria((prev) => [
                ...prev,
                { id: makeId(), name: "", weight: 0, description: "" },
              ])
            }
          >
            Add Criteria
          </Button>
          <Button
            type="button"
            onClick={() =>
              saveAction(
                () =>
                  adminApi.patchEventCriteria(id!, {
                    criteria: criteria
                      .map((item, index) => ({
                        name: item.name.trim(),
                        weight: Number(item.weight || 0),
                        description: item.description.trim(),
                        order: index + 1,
                      }))
                      .filter((item) => item.name && item.weight > 0),
                  }),
                "Criteria updated",
              )
            }
            disabled={isSaving || criteriaWeightTotal !== 100}
          >
            {isSaving ? "Saving..." : "Save Criteria"}
          </Button>
        </div>
      )}
    </div>
  );

  const renderTimelineForm = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        {timeline.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Timeline is still empty.
          </div>
        )}
        {timeline.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-12"
          >
            <label className="md:col-span-3 text-sm font-medium text-slate-700">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.date}
                onChange={(event) =>
                  setTimeline((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, date: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            <label className="md:col-span-4 text-sm font-medium text-slate-700">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.title}
                onChange={(event) =>
                  setTimeline((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, title: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            <label className="md:col-span-5 text-sm font-medium text-slate-700">
              Description
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.description}
                onChange={(event) =>
                  setTimeline((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, description: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            {!readonly && (
              <div className="md:col-span-12">
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setTimeline((prev) =>
                      prev.filter((row) => row.id !== item.id),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setTimeline((prev) => [
                ...prev,
                { id: makeId(), date: "", title: "", description: "" },
              ])
            }
          >
            Add Milestone
          </Button>
          <Button
            type="button"
            onClick={() =>
              saveAction(
                () =>
                  adminApi.patchEventTimeline(id!, {
                    timeline: timeline
                      .map((item, index) => ({
                        date: item.date,
                        title: item.title.trim(),
                        description: item.description.trim(),
                        order: index + 1,
                      }))
                      .filter((item) => item.date && item.title),
                  }),
                "Timeline updated",
              )
            }
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Timeline"}
          </Button>
        </div>
      )}
    </div>
  );

  const renderRulesForm = () => (
    <div className="space-y-5">
      <label className="block text-sm font-medium text-slate-700">
        Rules Content
        <textarea
          rows={8}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          value={rulesText}
          onChange={(event) => setRulesText(event.target.value)}
          disabled={readonly}
        />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Eligibility</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {eligibilityOptions.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={rulesEligibility.includes(item)}
                onChange={() =>
                  toggleEligibility(item, (next) => setRulesEligibility(next))
                }
                disabled={readonly}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      {!readonly && (
        <Button
          type="button"
          onClick={() =>
            saveAction(
              () =>
                adminApi.patchEventRules(id!, {
                  rules: rulesText,
                  eligibility: rulesEligibility,
                }),
              "Rules updated",
            )
          }
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Rules"}
        </Button>
      )}
    </div>
  );

  const renderResourcesForm = () => (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-700">Published Files</p>
        <div className="mt-3 space-y-2">
          {resources.length === 0 && (
            <p className="text-sm text-slate-500">No resources uploaded.</p>
          )}
          {resources.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-700 hover:underline"
              >
                {item.title}
              </a>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {item.type}
              </span>
              {!readonly && (
                <button
                  type="button"
                  className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setResources((prev) =>
                      prev.filter((_, row) => row !== index),
                    )
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {!readonly && (
        <>
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Upload size={16} />
              Select files for upload
              <input
                type="file"
                className="hidden"
                multiple
                onChange={(event) => handleResourceInput(event.target.files)}
              />
            </label>

            <div className="mt-3 space-y-2">
              {pendingUploads.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-12"
                >
                  <label className="md:col-span-5 text-sm font-medium text-slate-700">
                    File title
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      value={item.title}
                      onChange={(event) =>
                        setPendingUploads((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? { ...row, title: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="md:col-span-3 text-sm font-medium text-slate-700">
                    Type
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      value={item.type}
                      onChange={(event) =>
                        setPendingUploads((prev) =>
                          prev.map((row) =>
                            row.id === item.id
                              ? { ...row, type: event.target.value }
                              : row,
                          ),
                        )
                      }
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOC">DOC</option>
                      <option value="PPT">PPT</option>
                      <option value="XLS">XLS</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="ZIP">ZIP</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </label>
                  <div className="md:col-span-4 flex items-end justify-between text-xs text-slate-500">
                    <span className="truncate">{item.file.name}</span>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() =>
                        setPendingUploads((prev) =>
                          prev.filter((row) => row.id !== item.id),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleUploadResources}
              disabled={isSaving || pendingUploads.length === 0}
            >
              {isSaving ? "Uploading..." : "Upload & Save"}
            </Button>
            <Button
              type="button"
              onClick={() =>
                saveAction(
                  () => adminApi.patchEventResources(id!, { resources }),
                  "Resources updated",
                )
              }
              disabled={isSaving}
            >
              Save Current List
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderCommunityView = () => {
    const threads = eventDetail?.communityThreads || [];
    return (
      <div className="space-y-3">
        {threads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
            <MessageCircle className="mx-auto mb-2 text-slate-300" size={18} />
            Forum Empty
          </div>
        ) : (
          threads.map((thread: any) => (
            <article
              key={thread.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  {thread.author?.fullName || "Unknown"}
                </span>
                <span>•</span>
                <span>{new Date(thread.createdAt).toLocaleString()}</span>
              </div>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                {thread.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{thread.content}</p>
              <p className="mt-2 text-xs text-slate-500">
                Likes: {thread.likeCount} • Replies: {thread.replyCount}
              </p>
            </article>
          ))
        )}
      </div>
    );
  };

  const renderParticipantsView = () => {
    const participants = eventDetail?.registrations || [];
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Participant</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Team</th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={4}>
                  No participants yet.
                </td>
              </tr>
            )}
            {participants.map((row: any) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.user?.fullName || "-"}</td>
                <td className="px-4 py-3">{row.user?.email || "-"}</td>
                <td className="px-4 py-3">
                  {row.team ? "Team" : "Individual"}
                </td>
                <td className="px-4 py-3">{row.team?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJudgesForm = () => (
    <div className="space-y-4">
      {categories.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          No event categories found. Add event categories first to assign
          judges.
        </div>
      )}

      <div className="space-y-3">
        {assignments.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No judge assignments yet.
          </div>
        )}

        {assignments.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-12"
          >
            <label className="md:col-span-5 text-sm font-medium text-slate-700">
              Judge
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.judgeId}
                onChange={(event) =>
                  setAssignments((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, judgeId: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              >
                <option value="">Select judge</option>
                {mergedJudgeOptions.map((judge) => (
                  <option key={judge.id} value={judge.id}>
                    {judge.fullName} ({judge.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-4 text-sm font-medium text-slate-700">
              Category
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.categoryId}
                onChange={(event) =>
                  setAssignments((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? { ...row, categoryId: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              >
                <option value="">Select category</option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="md:col-span-3 text-sm font-medium text-slate-700">
              Stage
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={item.currentStage}
                onChange={(event) =>
                  setAssignments((prev) =>
                    prev.map((row) =>
                      row.id === item.id
                        ? {
                            ...row,
                            currentStage: event.target.value as
                              | "ABSTRACT"
                              | "PAPER"
                              | "FINAL",
                          }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              >
                <option value="ABSTRACT">ABSTRACT</option>
                <option value="PAPER">PAPER</option>
                <option value="FINAL">FINAL</option>
              </select>
            </label>

            {!readonly && (
              <div className="md:col-span-12">
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setAssignments((prev) =>
                      prev.filter((row) => row.id !== item.id),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readonly && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setAssignments((prev) => [
                ...prev,
                {
                  id: makeId(),
                  judgeId: "",
                  categoryId: "",
                  currentStage: "ABSTRACT",
                },
              ])
            }
          >
            Add Assignment
          </Button>
          <Button
            type="button"
            onClick={() =>
              saveAction(
                () =>
                  adminApi.patchEventJudges(id!, {
                    assignments: assignments
                      .map((item) => ({
                        judgeId: item.judgeId,
                        categoryId: item.categoryId,
                        currentStage: item.currentStage,
                      }))
                      .filter((item) => item.judgeId && item.categoryId),
                  }),
                "Judge assignments updated",
              )
            }
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Judge Assignments"}
          </Button>
        </div>
      )}
    </div>
  );

  const renderStagesForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stages.map((item, index) => (
          <div
            key={item.stageType}
            className="rounded-lg border border-slate-200 p-4"
          >
            <p className="text-sm font-bold text-slate-800">{item.stageType}</p>
            <label className="mt-3 block text-xs font-medium text-slate-600">
              Start time
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={item.startAt}
                onChange={(event) =>
                  setStages((prev) =>
                    prev.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, startAt: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Deadline
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                value={item.deadlineAt}
                onChange={(event) =>
                  setStages((prev) =>
                    prev.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, deadlineAt: event.target.value }
                        : row,
                    ),
                  )
                }
                disabled={readonly}
              />
            </label>
          </div>
        ))}
      </div>

      {!readonly && (
        <Button
          type="button"
          onClick={() =>
            saveAction(
              () =>
                adminApi.patchEventStages(id!, {
                  stages: stages.map((item) => ({
                    stageType: item.stageType,
                    startAt: toIsoFromInput(item.startAt),
                    deadlineAt: toIsoFromInput(item.deadlineAt),
                  })),
                }),
              "Competition stages updated",
            )
          }
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Stages"}
        </Button>
      )}
    </div>
  );

  const renderAwardsForm = () => (
    <div className="space-y-4">
      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={awardsEnabled}
          onChange={(event) => setAwardsEnabled(event.target.checked)}
          disabled={readonly}
        />
        Enable awards for this event
      </label>

      {awardsEnabled && (
        <div className="space-y-3">
          {awards.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-12"
            >
              <label className="md:col-span-2 text-sm font-medium text-slate-700">
                Rank
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={item.rank}
                  onChange={(event) =>
                    setAwards((prev) =>
                      prev.map((row) =>
                        row.id === item.id
                          ? { ...row, rank: Number(event.target.value || 0) }
                          : row,
                      ),
                    )
                  }
                  disabled={readonly}
                />
              </label>

              <label className="md:col-span-4 text-sm font-medium text-slate-700">
                Title
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={item.title}
                  onChange={(event) =>
                    setAwards((prev) =>
                      prev.map((row) =>
                        row.id === item.id
                          ? { ...row, title: event.target.value }
                          : row,
                      ),
                    )
                  }
                  disabled={readonly}
                />
              </label>

              <label className="md:col-span-3 text-sm font-medium text-slate-700">
                Tier
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={item.tier}
                  onChange={(event) =>
                    setAwards((prev) =>
                      prev.map((row) =>
                        row.id === item.id
                          ? {
                              ...row,
                              tier: event.target.value as "MAIN" | "HONORABLE",
                            }
                          : row,
                      ),
                    )
                  }
                  disabled={readonly}
                >
                  <option value="MAIN">MAIN</option>
                  <option value="HONORABLE">HONORABLE</option>
                </select>
              </label>

              <label className="md:col-span-3 text-sm font-medium text-slate-700">
                Description
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={item.description}
                  onChange={(event) =>
                    setAwards((prev) =>
                      prev.map((row) =>
                        row.id === item.id
                          ? { ...row, description: event.target.value }
                          : row,
                      ),
                    )
                  }
                  disabled={readonly}
                />
              </label>

              {!readonly && (
                <div className="md:col-span-12">
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600 hover:underline"
                    onClick={() =>
                      setAwards((prev) =>
                        prev.filter((row) => row.id !== item.id),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readonly && (
        <div className="flex flex-wrap gap-2">
          {awardsEnabled && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setAwards((prev) => [
                  ...prev,
                  {
                    id: makeId(),
                    rank: prev.length + 1,
                    title: "",
                    tier: prev.length >= 3 ? "HONORABLE" : "MAIN",
                    description: "",
                  },
                ])
              }
            >
              Add Award Row
            </Button>
          )}
          <Button
            type="button"
            onClick={() =>
              saveAction(
                () =>
                  adminApi.patchEventAwards(id!, {
                    awardsEnabled,
                    awards: awards
                      .map((item) => ({
                        rank: Number(item.rank || 0),
                        title: item.title.trim(),
                        tier: item.tier,
                        description: item.description.trim(),
                      }))
                      .filter((item) => item.rank > 0 && item.title),
                  }),
                "Awards updated",
              )
            }
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Awards"}
          </Button>
        </div>
      )}
    </div>
  );

  const renderCardContent = () => {
    switch (card.key as ManageEventCardKey) {
      case "configuration":
        return renderConfigurationForm();
      case "faqs":
        return renderFaqForm();
      case "criteria":
        return renderCriteriaForm();
      case "timeline":
        return renderTimelineForm();
      case "rules":
        return renderRulesForm();
      case "resources":
        return renderResourcesForm();
      case "community":
        return renderCommunityView();
      case "participants":
        return renderParticipantsView();
      case "judges":
        return renderJudgesForm();
      case "stages":
        return renderStagesForm();
      case "awards":
        return renderAwardsForm();
      default:
        return null;
    }
  };

  const iconByCard: Record<ManageEventCardKey, React.ReactNode> = {
    configuration: <FolderOpen size={18} />,
    faqs: <MessageCircle size={18} />,
    criteria: <FileText size={18} />,
    timeline: <Calendar size={18} />,
    rules: <FileText size={18} />,
    resources: <Upload size={18} />,
    community: <MessageCircle size={18} />,
    participants: <Users size={18} />,
    judges: <Users size={18} />,
    stages: <Calendar size={18} />,
    awards: <FileText size={18} />,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {eventTitle}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
            <span className="inline-flex rounded-lg bg-slate-100 p-2 text-slate-700">
              {iconByCard[card.key as ManageEventCardKey]}
            </span>
            {card.title}
          </h1>
          <p className="text-sm text-slate-500">{card.subtitle}</p>
        </div>

        <Button
          type="button"
          onClick={() => navigate(`${basePath}/events/${id}/edit`)}
        >
          Back to Cards
        </Button>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {actionMessage}
        </div>
      )}

      {renderReadOnlyBadge()}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {renderCardContent()}
      </section>
    </div>
  );
};

export default ManageEventCardForm;
