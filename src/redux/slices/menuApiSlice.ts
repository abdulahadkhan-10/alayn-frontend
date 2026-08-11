import { baseApi } from "../store/baseApi";

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg?: boolean;
  dietaryType?: "VEG" | "NON_VEG" | "VEGAN";
  isAvailable: boolean;
  categoryId: string;
  outletId?: string;
  outletIds?: string[];
  category?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  outletId?: string;
  items?: MenuItem[];
}

export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenuItems: builder.query<MenuItem[], { categoryId?: string; search?: string; isAvailable?: boolean | string; isVeg?: boolean | string; dietaryType?: string } | void>({
      query: (params) => ({
        url: "/menu/items",
        method: "GET",
        params: params || undefined,
      }),
      transformResponse: (response: any) => (response?.data ?? response ?? []) as MenuItem[],
      providesTags: ["MenuItems"],
    }),

    getCategories: builder.query<MenuCategory[], void>({
      query: () => ({
        url: "/menu/categories",
        method: "GET",
      }),
      transformResponse: (response: any) => (response?.data ?? response ?? []) as MenuCategory[],
      providesTags: ["MenuCategories"],
    }),

    createCategory: builder.mutation<MenuCategory, { name: string; description?: string; outletId?: string }>({
      query: ({ outletId, ...body }) => ({
        url: "/menu/categories",
        method: "POST",
        body,
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ["MenuCategories"],
    }),

    createMenuItem: builder.mutation<MenuItem, Partial<MenuItem> & { outletId?: string }>({
      query: ({ outletId, ...body }) => ({
        url: "/menu/items",
        method: "POST",
        body,
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ["MenuItems"],
    }),

    updateMenuItem: builder.mutation<MenuItem, { id: string; data: Partial<MenuItem> }>({
      query: ({ id, data }) => ({
        url: `/menu/items/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ["MenuItems"],
    }),

    toggleMenuItemStatus: builder.mutation<MenuItem, { id: string; isAvailable: boolean; outletId?: string }>({
      query: ({ id, isAvailable, outletId }) => ({
        url: `/menu/items/${id}/status`,
        method: "PATCH",
        body: { isAvailable },
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ["MenuItems"],
    }),

    deleteMenuItem: builder.mutation<{ success: boolean; message?: string }, { id: string; outletId?: string }>({
      query: ({ id, outletId }) => ({
        url: `/menu/items/${id}`,
        method: "DELETE",
        headers: outletId ? { "x-outlet-id": outletId } : undefined,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: ["MenuItems"],
    }),
  }),
});


export const {
  useGetMenuItemsQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useToggleMenuItemStatusMutation,
  useDeleteMenuItemMutation,
} = menuApi;
