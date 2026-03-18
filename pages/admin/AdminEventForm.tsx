import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../services/api/adminApi";
import { eventsApi } from "../../services/api/eventsApi";
import PageHeader from "../../components/admin/PageHeader";
import AdminInput from "../../components/admin/AdminInput";
import AdminSelect from "../../components/admin/AdminSelect";
import Button from "../../components/Button";

const formatOptions = ["ONLINE", "IN_PERSON", "HYBRID"] as const;
const statusOptions = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"] as const;

const eventSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().min(3, "Slug is required"),
    shortDescription: z
      .string()
      .min(10, "Short description must be at least 10 characters"),
    fullDescription: z
      .string()
      .min(20, "Full description must be at least 20 characters"),
    date: z.string().min(2, "Date is required"),
    deadline: z.string().min(2, "Deadline is required"),
    location: z.string().min(2, "Location is required"),
    format: z.enum(formatOptions),
    category: z.string().min(2, "Category is required"),
    status: z.enum(statusOptions),
    fee: z.string().default("Gratis"),
    organizer: z.string().min(2, "Organizer is required"),
    theme: z.string().optional().default(""),
    prizePool: z.string().optional().default(""),
    teamSizeMin: z.coerce.number().int().min(1, "Min team size must be >= 1"),
    teamSizeMax: z.coerce.number().int().min(1, "Max team size must be >= 1"),
    eligibility: z.string().optional().default(""),
    sdgs: z.string().optional().default(""),
    image: z.string().optional().default(""),
  })
  .refine((data) => data.teamSizeMax >= data.teamSizeMin, {
    path: ["teamSizeMax"],
    message: "Max team size cannot be smaller than min",
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

const AdminEventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = useMemo(() => Boolean(id), [id]);

  const [relations, setRelations] = useState<RelationPayload>({
    timeline: [],
    faqs: [],
    categories: [],
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const slugEditedManually = useRef(false);

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
      sdgs: "",
      image: "",
    },
  });

  const titleValue = watch("title");

  useEffect(() => {
    if (!slugEditedManually.current && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, setValue]);

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
        sdgs: Array.isArray(event.sdgs) ? event.sdgs.join(",") : "",
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

  const parseSdgs = (value?: string) =>
    (value || "")
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((num) => !Number.isNaN(num));

  const onSubmit = async (data: EventFormData) => {
    const payload = {
      ...data,
      eligibility: parseEligibility(data.eligibility),
      sdgs: parseSdgs(data.sdgs),
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
      navigate("/admin/events");
    } catch (error) {
      setLoadError("Failed to save event. Please try again.");
    }
  };

  return (
    <>
      <PageHeader title={isEditMode ? "Edit Event" : "Create Event"} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-sm"
      >
        {loadError && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {...register("slug", {
              onChange: () => {
                slugEditedManually.current = true;
              },
            })}
            error={errors.slug?.message}
          />

          <div className="md:col-span-2">
            <label
              htmlFor="shortDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Short Description
            </label>
            <textarea
              id="shortDescription"
              {...register("shortDescription")}
              rows={2}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              placeholder="One-liner for the event hero section"
            />
            {errors.shortDescription && (
              <p className="mt-1 text-sm text-red-600">
                {errors.shortDescription.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="fullDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Description
            </label>
            <textarea
              id="fullDescription"
              {...register("fullDescription")}
              rows={5}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              placeholder="Add richer context for the event detail page"
            />
            {errors.fullDescription && (
              <p className="mt-1 text-sm text-red-600">
                {errors.fullDescription.message}
              </p>
            )}
          </div>

          <AdminInput
            label="Event Date"
            id="date"
            placeholder="Jan 15, 2025"
            {...register("date")}
            error={errors.date?.message}
          />
          <AdminInput
            label="Registration Deadline"
            id="deadline"
            placeholder="2025-01-10"
            {...register("deadline")}
            error={errors.deadline?.message}
          />

          <AdminInput
            label="Location"
            id="location"
            placeholder="Jakarta / Online"
            {...register("location")}
            error={errors.location?.message}
          />
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
            label="Category"
            id="category"
            placeholder="Competition / Conference"
            {...register("category")}
            error={errors.category?.message}
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

          <AdminInput
            label="Fee"
            id="fee"
            placeholder="Gratis"
            {...register("fee")}
            error={errors.fee?.message}
          />
          <AdminInput
            label="Organizer"
            id="organizer"
            placeholder="GIVA"
            {...register("organizer")}
            error={errors.organizer?.message}
          />

          <AdminInput
            label="Theme"
            id="theme"
            placeholder="Climate Resilience"
            {...register("theme")}
            error={errors.theme?.message}
          />
          <AdminInput
            label="Prize Pool"
            id="prizePool"
            placeholder="$50,000"
            {...register("prizePool")}
            error={errors.prizePool?.message}
          />

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

          <div className="md:col-span-2">
            <label
              htmlFor="eligibility"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Eligibility (one per line)
            </label>
            <textarea
              id="eligibility"
              {...register("eligibility")}
              rows={3}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-3"
              placeholder={"Students\nResearchers\nProfessionals"}
            />
            {errors.eligibility && (
              <p className="mt-1 text-sm text-red-600">
                {errors.eligibility.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="sdgs"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              SDGs (comma separated numbers)
            </label>
            <input
              id="sdgs"
              {...register("sdgs")}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="3, 7, 13"
            />
            {errors.sdgs && (
              <p className="mt-1 text-sm text-red-600">{errors.sdgs.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="image"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Cover Image URL
            </label>
            <input
              id="image"
              {...register("image")}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="https://..."
            />
            {errors.image && (
              <p className="mt-1 text-sm text-red-600">
                {errors.image.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          {isFetching && (
            <p className="text-sm text-gray-500">Loading event data...</p>
          )}
          <div className="ml-auto flex gap-3">
            <Button
              type="button"
              onClick={() => navigate("/admin/events")}
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
