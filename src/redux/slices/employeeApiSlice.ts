import { baseApi } from "../store/baseApi";

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params) => {
        const { outletId, ...restParams } = params || {};
        return {
          url: "/employees",
          method: "GET",
          params: restParams,
          headers: outletId ? { "x-outlet-id": outletId } : undefined,
        };
      },
      providesTags: ["Employee"],
    }),
    createEmployee: builder.mutation({
      query: (body) => ({
        url: "/employees",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),
    uploadDocument: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/employees/${id}/documents`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Employee"],
    }),
    bulkUploadEmployees: builder.mutation({
      query: (formData: FormData) => ({
        url: "/employees/bulk-upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Employee"],
    }),
    getLeaveRequests: builder.query({
      query: () => ({
        url: "/leave-requests",
        method: "GET",
      }),
      providesTags: ["Leave"],
    }),
    createLeaveRequest: builder.mutation({
      query: (body) => ({
        url: "/leave-requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leave"],
    }),
    updateLeaveStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/leave-requests/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Leave"],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useUploadDocumentMutation,
  useBulkUploadEmployeesMutation,
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
} = employeeApi;
