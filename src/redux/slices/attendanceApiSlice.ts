import { baseApi } from "../store/baseApi";

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    clockIn: builder.mutation({
      query: (body) => ({
        url: "/attendance/check-in",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
    clockOut: builder.mutation({
      query: (body) => ({
        url: "/attendance/check-out",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
    // Manager/owner correction of a punch (e.g. entering the real time of a missed clock-out)
    correctAttendance: builder.mutation<
      unknown,
      { id: string; checkInTime?: string; checkOutTime?: string; reason: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/attendance/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),
    getAttendanceLogs: builder.query({
      query: () => ({
        url: "/attendance",
        method: "GET",
      }),
      providesTags: ["Attendance"],
    }),
  }),
});

export const {
  useClockInMutation,
  useClockOutMutation,
  useCorrectAttendanceMutation,
  useGetAttendanceLogsQuery,
} = attendanceApi;
