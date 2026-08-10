import { baseApi } from "../store/baseApi";

export const holidayApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHolidays: builder.query({
      query: () => ({
        url: "/outlets/holidays",
        method: "GET",
      }),
      providesTags: ["Holidays"],
    }),
    createHoliday: builder.mutation({
      query: (body: { name: string; startDate: string; endDate: string; type?: string; description?: string; applyToAllOutlets?: boolean }) => ({
        url: "/outlets/holidays",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Holidays"],
    }),
    deleteHoliday: builder.mutation({
      query: (id: string) => ({
        url: `/outlets/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Holidays"],
    }),
    updateOperatingDays: builder.mutation({
      query: (body: { operatingDays: string[] }) => ({
        url: "/outlets/operating-days",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Holidays", "Outlet"],
    }),
  }),
});

export const {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateOperatingDaysMutation,
} = holidayApi;
