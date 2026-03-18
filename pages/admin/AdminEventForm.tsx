import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import AdminInput from "../../components/admin/AdminInput";
import Button from "../../components/Button";

const eventSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description is required"),
  registrationStartDate: z.string(),
  registrationEndDate: z.string(),
  submissionStartDate: z.string(),
  submissionEndDate: z.string(),
});

type EventFormData = z.infer<typeof eventSchema>;

const AdminEventForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  const fetchEvent = useCallback(async () => {
    if (!isEditMode || !id) return;
    try {
      const response = await adminApi.getEvents({ id }); 
      const event = response.data.data;
      const formattedEvent = {
        ...event,
        registrationStartDate: event.registrationStartDate?.slice(0, 16) || '',
        registrationEndDate: event.registrationEndDate?.slice(0, 16) || '',
        submissionStartDate: event.submissionStartDate?.slice(0, 16) || '',
        submissionEndDate: event.submissionEndDate?.slice(0, 16) || '',
      };
      reset(formattedEvent);
    } catch (error) {
      // Error handled silently
    }
  }, [id, isEditMode, reset]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const onSubmit = async (data: EventFormData) => {
    try {
      if (isEditMode && id) {
        await adminApi.updateEvent(id, data);
      } else {
        await adminApi.createEvent(data);
      }
      navigate("/admin/events");
    } catch (error) {
      // Error handled silently
    }
  };

  return (
    <>
      <PageHeader title={isEditMode ? "Edit Event" : "Create Event"} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminInput
            label="Event Name"
            id="name"
            {...register("name")}
            error={errors.name?.message}
          />
          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
          <AdminInput
            label="Registration Start"
            id="registrationStartDate"
            type="datetime-local"
            {...register("registrationStartDate")}
            error={errors.registrationStartDate?.message}
          />
          <AdminInput
            label="Registration End"
            id="registrationEndDate"
            type="datetime-local"
            {...register("registrationEndDate")}
            error={errors.registrationEndDate?.message}
          />
          <AdminInput
            label="Submission Start"
            id="submissionStartDate"
            type="datetime-local"
            {...register("submissionStartDate")}
            error={errors.submissionStartDate?.message}
          />
          <AdminInput
            label="Submission End"
            id="submissionEndDate"
            type="datetime-local"
            {...register("submissionEndDate")}
            error={errors.submissionEndDate?.message}
          />
        </div>
        <div className="mt-8 flex justify-end">
          <Button
            type="button"
            onClick={() => navigate("/admin/events")}
            className="mr-4 bg-gray-200 text-gray-800"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Event"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default AdminEventForm;
