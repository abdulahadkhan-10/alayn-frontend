import { baseApi } from "../store/baseApi";

export interface RestaurantCoupon {
  id: string;
  businessId: string;
  outletId: string | null;
  outletName: string | null;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  isActive: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRestaurantCouponPayload {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string | null;
  usageLimit?: number | null;
  outletId?: string | null;
}

export interface ValidateCouponPayload {
  code: string;
  subtotalAmount?: number;
  subtotalPaise?: number;
  outletId?: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  couponId: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  discountPaise: number;
  discountAmount: number;
  description?: string;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
}

export const restaurantCouponApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurantCoupons: builder.query<RestaurantCoupon[], { outletId?: string } | void>({
      query: (params) => ({
        url: "/restaurant-coupons",
        method: "GET",
        params: params?.outletId ? { outletId: params.outletId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response ?? [],
      providesTags: ["RestaurantCoupons"],
    }),

    createRestaurantCoupon: builder.mutation<RestaurantCoupon, CreateRestaurantCouponPayload>({
      query: (body) => ({
        url: "/restaurant-coupons",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ["RestaurantCoupons"],
    }),

    toggleRestaurantCouponStatus: builder.mutation<RestaurantCoupon, { id: string; isActive?: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/restaurant-coupons/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ["RestaurantCoupons"],
    }),

    deleteRestaurantCoupon: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/restaurant-coupons/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ["RestaurantCoupons"],
    }),

    validateRestaurantCoupon: builder.mutation<ValidateCouponResponse, ValidateCouponPayload>({
      query: (body) => ({
        url: "/restaurant-coupons/validate",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response?.data || response,
    }),
  }),
});

export const {
  useGetRestaurantCouponsQuery,
  useCreateRestaurantCouponMutation,
  useToggleRestaurantCouponStatusMutation,
  useDeleteRestaurantCouponMutation,
  useValidateRestaurantCouponMutation,
} = restaurantCouponApi;
