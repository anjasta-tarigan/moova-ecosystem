import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../services/api/adminApi";
import { eventsApi } from "../../services/api/eventsApi";
import PageHeader from "../../components/admin/PageHeader";
import AdminInput from "../../components/admin/AdminInput";
import AdminSelect from "../../components/admin/AdminSelect";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuthContext } from "../../contexts/AuthContext";

const formatOptions = ["ONLINE", "IN_PERSON", "HYBRID"] as const;
const statusOptions = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"] as const;
const sdgOptions = Array.from({ length: 17 }, (_, idx) => idx + 1);

const eventSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    slug: z.string().min(5, "Slug is required"),
    shortDescription: z
      .string()
      .min(10, "Short description must be at least 10 characters")
      .max(250, "Short description must be at most 250 characters"),
    fullDescription: z
      .string()
      .min(20, "Full description must be at least 20 characters"),
    date: z.string().min(2, "Date is required"),
    deadline: z.string().min(2, "Deadline is required"),
    location: z.string().min(2, "Location is required"),
    format: z.enum(formatOptions),
    category: z.string().min(2, "Category is required"),
    status: z.enum(statusOptions),
    fee: z.string().optional().default("Gratis"),
    organizer: z.string().optional().default("GIVA"),
    theme: z.string().optional().default(""),
    prizePool: z.string().optional().default(""),
    teamSizeMin: z.coerce.number().int().min(1, "Min team size must be >= 1"),
    teamSizeMax: z.coerce.number().int().min(1, "Max team size must be >= 1"),
    eligibility: z.string().optional().default(""),
    sdgs: z.array(z.number()).default([]),
    image: z.string().optional().default(""),
  })
  .refine((data) => data.teamSizeMax >= data.teamSizeMin, {
    path: ["teamSizeMax"],
    message: "Max team size cannot be smaller than min",
  })
  .superRefine((data, ctx) => {
    const eventDate = new Date(data.date);
    const deadlineDate = new Date(data.deadline);
    if (
      Number.isNaN(eventDate.getTime()) ||
      Number.isNaN(deadlineDate.getTime())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "Please provide valid dates",
      });
    } else if (deadlineDate > eventDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "Deadline must be on or before the event date",
      });
    }

    const trimmedLocation = data.location.trim();
    if (data.format === "ONLINE") {
      if (!/^https?:\/\//i.test(trimmedLocation)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["location"],
          message: "Online format requires a valid meeting link (https)",
        });
      }
    } else if (!trimmedLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Location is required for this format",
      });
    }
  });

type EventFormData = z.infer<typeof eventSchema>;

type RelationPayload = {
  timeline: any[];
  faqs: any[];
  categories: any[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const cleanRichText = (value: string) =>
  value.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").trim();

const AdminEventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = useMemo(() => Boolean(id), [id]);
  const basePath = useMemo(
    () =>
      location.pathname.startsWith("/superadmin") ? "/superadmin" : "/admin",
    [location.pathname],
  );
  const { isSuperAdmin, isLoading: authLoading } = useAuthContext();

  const [relations, setRelations] = useState<RelationPayload>({
    timeline: [],
    faqs: [],
    categories: [],
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const slugEditedManually = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      fullDescription: "",
      date: "",
      deadline: "",
      location: "",
      format: "ONLINE",
      category: "",
      status: "DRAFT",
      fee: "Gratis",
      organizer: "GIVA",
      theme: "",
      prizePool: "",
      teamSizeMin: 1,
      teamSizeMax: 5,
      eligibility: "",
      sdgs: [],
      image: "",
    },
  });

  const titleValue = watch("title");
  const formatValue = watch("format");
  const shortDescriptionValue = watch("shortDescription") || "";
  const selectedSdgs = watch("sdgs") || [];
  const imageValue = watch("image");

  useEffect(() => {
    if (!slugEditedManually.current && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, setValue]);

  useEffect(() => {
    if (imageValue) {
      setBannerPreview(toAbsoluteUrl(imageValue));
    } else {
      setBannerPreview("");
    }
  }, [imageValue]);

  const fetchEvent = useCallback(async () => {
    if (!isEditMode || !id) return;
    setIsFetching(true);
    setLoadError(null);
    try {
      const response = await eventsApi.getEvent(id);
      const event = response.data.data || response.data;
      setRelations({
        timeline: event.timeline || [],
        faqs: event.faqs || [],
        categories: event.categories || [],
      });
      reset({
        title: event.title || "",
        slug: event.slug || "",
        shortDescription: event.shortDescription || "",
        fullDescription: event.fullDescription || "",
        date: event.date || "",
        deadline: event.deadline || "",
        location: event.location || "",
        format: event.format || "ONLINE",
        category: event.category || "",
        status: event.status || "DRAFT",
        fee: event.fee || "Gratis",
        organizer: event.organizer || "GIVA",
        theme: event.theme || "",
        prizePool: event.prizePool || "",
        teamSizeMin: event.teamSizeMin || 1,
        teamSizeMax: event.teamSizeMax || 5,
        eligibility: Array.isArray(event.eligibility)
          ? event.eligibility.join("\n")
          : "",
        sdgs: Array.isArray(event.sdgs) ? event.sdgs : [],
        image: event.image || "",
      });
      slugEditedManually.current = true;
    } catch (error) {
      setLoadError("Failed to load event data. Please try again.");
    } finally {
      setIsFetching(false);
    }
  }, [id, isEditMode, reset]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const parseEligibility = (value?: string) =>
    (value || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const toAbsoluteUrl = (url?: string) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    const apiBase =
      (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";
    const normalized = url.startsWith("/") ? url : `/${url}`;
    return `${apiBase}${normalized}`;
  };

  const handleBannerChange = async (file?: File) => {
    if (!file) return;
    setBannerError(null);

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setBannerError("Only JPG, PNG, or WebP files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBannerError("Maximum file size is 2MB.");
      return;
    }

    try {
      setIsUploadingBanner(true);
      const formData = new FormData();
      formData.append("banner", file);
      const response = await adminApi.uploadEventBanner(formData);
      const url = response.data?.data?.url || response.data?.url;
      setValue("image", url || "", { shouldValidate: true });
      setBannerPreview(toAbsoluteUrl(url));
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Failed to upload banner. Please try again.";
      setBannerError(message);
    } finally {
      setIsUploadingBanner(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onBannerInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void handleBannerChange(file || undefined);
  };

  const handleSdgToggle = (value: number) => {
    const current = selectedSdgs as number[];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setValue("sdgs", next, { shouldValidate: true });
  };

  const onSubmit = async (data: EventFormData) => {
    const payload = {
      ...data,
      eligibility: parseEligibility(data.eligibility),
      sdgs: selectedSdgs,
      fullDescription: cleanRichText(data.fullDescription),
      timeline: relations.timeline,
      faqs: relations.faqs,
      categories: relations.categories,
    };

    try {
      if (isEditMode && id) {
        await adminApi.updateEvent(id, payload);
      } else {
        await adminApi.createEvent(payload);
      }
      navigate(`${basePath}/events`);
    } catch (error) {
      const message =
        (error as any)?.response?.data?.message ||
        "Failed to save event. Please try again.";
      setLoadError(message);
    }
  };

  const locationLabel = useMemo(() => {
    if (formatValue === "ONLINE") return "Meeting Link";
    if (formatValue === "IN_PERSON") return "Physical Address";
    return "Location";
  }, [formatValue]);

  if (authLoading) return <LoadingSpinner />;

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-sm">
        <p className="text-lg font-semibold text-slate-900">Forbidden</p>
        <p className="text-sm text-slate-600 mt-2">
          Only Superadmins can manage event configurations. Please contact a
          Superadmin for access.
        </p>
        <Button className="mt-4" onClick={() => navigate(basePath)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader title={isEditMode ? "Edit Event" : "Create Event"} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-sm space-y-8"
      >
        {loadError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminInput
              label="Title"
              id="title"
              placeholder="Deep Tech Hackathon"
              {...register("title")}
              error={errors.title?.message}
            />
            <AdminInput
              label="Slug"
              id="slug"
              placeholder="deep-tech-hackathon"
              helperText="Auto-generated from the title; edit only if needed"
              {...register("slug", {
                onChange: () => {
                  slugEditedManually.current = true;
                },
              })}
              error={errors.slug?.message}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Short Description (max 250 chars)
            </label>
            <textarea
              id="shortDescription"
              {...register("shortDescription")}
              rows={3}
              maxLength={250}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              placeholder="One-liner for the event hero section"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {errors.shortDescription?.message ||
                  "Concise hook for the landing hero"}
              </span>
              <span>
                {shortDescriptionValue.length}
                /250
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="fullDescription"
              className="block text-sm font-medium text-gray-700"
            >
              Full Description (rich text allowed)
            </label>
            <textarea
              id="fullDescription"
              {...register("fullDescription")}
              rows={6}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              placeholder="Add richer context for the event detail page"
            />
            {errors.fullDescription && (
              <p className="text-sm text-red-600">
                {errors.fullDescription.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminSelect
              label="Format"
              id="format"
              {...register("format")}
              error={errors.format?.message}
            >
              {formatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AdminSelect>
            <AdminInput
              label={locationLabel}
              id="location"
              type={formatValue === "ONLINE" ? "url" : "text"}
              placeholder={
                formatValue === "ONLINE"
                  ? "https://zoom.us/meet/..."
                  : "Grand Hall, Jakarta"
              }
              {...register("location")}
              error={errors.location?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AdminInput
              label="Event Date"
              id="date"
              type="date"
              {...register("date")}
              error={errors.date?.message}
            />
            <AdminInput
              label="Registration Deadline"
              id="deadline"
              type="date"
              {...register("deadline")}
              error={errors.deadline?.message}
            />
            <AdminSelect
              label="Status"
              id="status"
              {...register("status")}
              error={errors.status?.message}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AdminSelect>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminInput
              label="Category"
              id="category"
              placeholder="Competition / Conference"
              {...register("category")}
              error={errors.category?.message}
            />
            <AdminInput
              label="Theme"
              id="theme"
              placeholder="Climate Resilience"
              optional
              {...register("theme")}
              error={errors.theme?.message}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Media</p>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Upload event banner (max 2MB, JPG/PNG/WebP)
                    </p>
                    <p className="text-xs text-slate-500">
                      The uploaded banner is optimized to WebP and stored
                      server-side.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingBanner}
                  >
                    {isUploadingBanner ? "Uploading..." : "Choose File"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onBannerInputChange}
                  />
                </div>
                {bannerError && (
                  <p className="mt-2 text-xs text-red-600">{bannerError}</p>
                )}
              </div>
              {bannerPreview && (
                <img
                  src={bannerPreview}
                  alt="Event banner preview"
                  className="h-28 w-full max-w-xs rounded-lg object-cover border border-slate-200"
                />
              )}
            </div>

            <AdminInput
              label="Banner URL"
              id="image"
              placeholder="https://cdn.example.com/banner.webp"
              optional
              helperText="You can paste a trusted URL instead of uploading."
              {...register("image")}
              error={errors.image?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AdminInput
              label="Team Size Min"
              id="teamSizeMin"
              type="number"
              {...register("teamSizeMin")}
              error={errors.teamSizeMin?.message}
            />
            <AdminInput
              label="Team Size Max"
              id="teamSizeMax"
              type="number"
              {...register("teamSizeMax")}
              error={errors.teamSizeMax?.message}
            />
            <AdminInput
              label="Fee"
              id="fee"
              placeholder="Gratis"
              optional
              {...register("fee")}
              error={errors.fee?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminInput
              label="Organizer"
              id="organizer"
              placeholder="GIVA"
              optional
              {...register("organizer")}
              error={errors.organizer?.message}
            />
            <AdminInput
              label="Prize Pool"
              id="prizePool"
              placeholder="$50,000"
              optional
              {...register("prizePool")}
              error={errors.prizePool?.message}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              SDGs (select all that apply)
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {sdgOptions.map((goal) => (
                <label
                  key={goal}
                  className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={selectedSdgs.includes(goal)}
                    onChange={() => handleSdgToggle(goal)}
                  />
                  <span>SDG {goal}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="eligibility"
              className="block text-sm font-medium text-gray-700"
            >
              Eligibility (one per line)
              <span className="ml-1 text-slate-400">(Opsional)</span>
            </label>
            <textarea
              id="eligibility"
              {...register("eligibility")}
              rows={3}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              placeholder={"Students\nResearchers\nProfessionals"}
            />
            {errors.eligibility && (
              <p className="text-sm text-red-600">
                {errors.eligibility.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {isFetching && (
            <p className="text-sm text-gray-500">Loading event data...</p>
          )}
          <div className="ml-auto flex gap-3">
            <Button
              type="button"
              onClick={() => navigate(`${basePath}/events`)}
              className="bg-gray-200 text-gray-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Event"
                  : "Create Event"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AdminEventForm;
