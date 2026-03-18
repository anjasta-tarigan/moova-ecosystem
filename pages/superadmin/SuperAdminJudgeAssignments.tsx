import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { adminApi } from "../../services/api/adminApi";
import PageHeader from "../../components/admin/PageHeader";
import AdminSelect from "../../components/admin/AdminSelect";
import Button from "../../components/Button";

const assignmentSchema = z.object({
  judgeId: z.string().min(1, "Judge is required"),
  categoryId: z.string().min(1, "Event Category is required"),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

const SuperAdminJudgeAssignments = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  });

  const judges = [{ id: "1", name: "Judge 1" }];
  const categories = [{ id: "1", name: "Category 1" }];

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      await adminApi.createJudgeAssignment(data);
    } catch (error) {
      // Handled silently
    }
  };

  return (
    <>
      <PageHeader
        title="Judge Assignments"
        subtitle="Manage judge assignments to event categories."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-8 rounded-lg shadow-sm"
          >
            <div className="space-y-6">
              <AdminSelect
                label="Select Judge"
                id="judgeId"
                {...register("judgeId")}
                error={errors.judgeId?.message}
              >
                <option value="">Select a Judge</option>
                {judges.map((judge) => (
                  <option key={judge.id} value={judge.id}>
                    {judge.name}
                  </option>
                ))}
              </AdminSelect>
              <AdminSelect
                label="Select Event Category"
                id="categoryId"
                {...register("categoryId")}
                error={errors.categoryId?.message}
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
                {isSubmitting ? "Assigning..." : "Assign Judge"}
              </Button>
            </div>
          </form>
        </div>
        <div className="md:col-span-2">
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

export default SuperAdminJudgeAssignments;
