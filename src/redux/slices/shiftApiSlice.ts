import { baseApi } from "../store/baseApi";

export const shiftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: () => ({
        url: "/shifts",
        method: "GET",
      }),
      providesTags: ["Shift"],
    }),
    createShift: builder.mutation({
      query: (body) => ({
        url: "/shifts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shift"],
    }),
    assignShift: builder.mutation({
      query: ({ shiftId, ...body }) => ({
        url: `/shifts/${shiftId}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shift"],
    }),
    updateShiftAssignment: builder.mutation({
      query: ({ assignmentId, ...body }) => ({
        url: `/shifts/assignments/${assignmentId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Shift"],
    }),
    deleteShiftAssignment: builder.mutation({
      query: (assignmentId: string) => ({
        url: `/shifts/assignments/${assignmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shift"],
    }),
    updateShift: builder.mutation({
      query: ({ shiftId, ...body }) => ({
        url: `/shifts/${shiftId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Shift"],
    }),
    deleteShift: builder.mutation({
      query: (shiftId: string) => ({
        url: `/shifts/${shiftId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shift"],
    }),
    requestSwap: builder.mutation({
      query: (body) => ({
        url: "/shifts/swaps",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shift"],
    }),
    updateSwapStatus: builder.mutation({
      query: ({ swapId, status }) => ({
        url: `/shifts/swaps/${swapId}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Shift"],
    }),
  }),
});

export const {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useAssignShiftMutation,
  useUpdateShiftAssignmentMutation,
  useDeleteShiftAssignmentMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useRequestSwapMutation,
  useUpdateSwapStatusMutation,
} = shiftApi;
