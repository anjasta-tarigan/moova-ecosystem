import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import AdminSelect from "../../components/admin/AdminSelect";
import Button from "../../components/Button";

const assignmentSchema = z.object({
  juriId: z.string().nonempty("Juri is required"),
  eventCategoryId: z.string().nonempty("Event Category is required"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

const SuperAdminJuriAssignments = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  // These would typically be fetched from the API
  const juris = [{ id: "1", name: "Juri 1" }];
  const categories = [{ id: "1", name: "Category 1" }];

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      await adminApi.createJuriAssignment(data);
      // Show success message
    } catch (error) {
      console.error("Failed to create assignment", error);
    }
  };

  return (
    <>
      <PageHeader
        title="Juri Assignments"
        subtitle="Assign Juri to event categories."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-8 rounded-lg shadow-sm"
          >
            <div className="space-y-6">
              <AdminSelect
                label="Select Juri"
                id="juriId"
                {...register("juriId")}
                error={errors.juriId?.message}
              >
                <option value="">Select a Juri</option>
                {juris.map((juri) => (
                  <option key={juri.id} value={juri.id}>
                    {juri.name}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                label="Select Event Category"
                id="eventCategoryId"
                {...register("eventCategoryId")}
                error={errors.eventCategoryId?.message}
              >
                <option value="">Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div className="mt-8">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Assigning..." : "Assign Juri"}
              </Button>
            </div>
          </form>
        </div>
        <div className="md:col-span-2">
          {/* List of existing assignments would go here */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-4">Current Assignments</h3>
            <p className="text-gray-500">
              Assignment list will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminJuriAssignments;
