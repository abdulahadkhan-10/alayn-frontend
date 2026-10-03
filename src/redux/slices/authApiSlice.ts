import { baseApi } from "../store/baseApi";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (body) => ({
                url: "/auth/register",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Auth"],
        }),

        login: builder.mutation({
            query: (body) => ({
                url: "/auth/login",
                method: "POST",
                body,
                credentials: "include",
            }),
            invalidatesTags: ["Auth"],
        }),

        getMe: builder.query({
            query: () => "/auth/me",
            providesTags: ["Auth"],
        }),

        logout: builder.mutation({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
                credentials: "include",
            }),
            invalidatesTags: ["Auth"],
        }),

        refreshToken: builder.mutation({
            query: (body) => ({
                url: "/auth/refresh",
                method: "POST",
                body,
                credentials: "include",
            }),
        }),

        updateProfile: builder.mutation({
            query: (body) => ({
                url: "/auth/profile",
                method: "PATCH",
                body,
                credentials: "include",
            }),
            invalidatesTags: ["Auth"],
        }),

        changePassword: builder.mutation({
            query: (body) => ({
                url: "/auth/change-password",
                method: "POST",
                body,
                credentials: "include",
            }),
        }),

        forgotPassword: builder.mutation({
            query: (body: { email: string }) => ({
                url: "/auth/forgot-password",
                method: "POST",
                body,
            }),
        }),

        verifyResetOtp: builder.mutation({
            query: (body: { email: string; otp: string }) => ({
                url: "/auth/verify-reset-otp",
                method: "POST",
                body,
            }),
        }),

        resetPassword: builder.mutation({
            query: (body: { email: string; resetToken: string; newPassword: string }) => ({
                url: "/auth/reset-password",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useGetMeQuery,
    useLogoutMutation,
    useRefreshTokenMutation,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useForgotPasswordMutation,
    useVerifyResetOtpMutation,
    useResetPasswordMutation,
} = authApi;