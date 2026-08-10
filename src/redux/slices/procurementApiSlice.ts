import { baseApi } from "../store/baseApi";
import type { InventoryItemApi } from "./inventoryApiSlice";

export interface SupplierApi {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category?: string;
  type?: "ONLINE" | "OFFLINE";
  userId?: string;
  password?: string;
  initialPassword?: string;
  user?: { id: string; email: string; name: string; role: string };
  outletId?: string;
  outlet?: { id: string; name: string };
  createdAt?: string;
}

export interface PurchaseOrderItemApi {
  id?: string;
  purchaseOrderId?: string;
  itemId: string;
  orderedQuantity: number;
  dispatchedQuantity?: number;
  receivedQuantity?: number;
  unitCostPaise: number;
  item?: InventoryItemApi;
}

export interface PurchaseOrderApi {
  id: string;
  supplierId: string;
  status:
    | "DRAFT"
    | "SENT"
    | "PACKING"
    | "PARTIALLY_DISPATCHED"
    | "DISPATCHED"
    | "OUT_OF_STOCK"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "CLOSED"
    | "CANCELLED";
  totalAmountPaise: number;
  supplierNotes?: string;
  dispatchDate?: string;
  expectedNextDeliveryDate?: string;
  outletId?: string;
  outlet?: { id: string; name: string };
  supplier?: { id: string; name: string };
  createdAt?: string;
  actualSupplier?: SupplierApi;
  items: PurchaseOrderItemApi[];
}

export const procurementApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<SupplierApi[], void>({
      query: () => "/purchase-orders/suppliers",
      providesTags: ["Supplier"],
      transformResponse: (response: any) => response?.data ?? response ?? [],
    }),
    createSupplier: builder.mutation<SupplierApi, Omit<SupplierApi, "id" | "createdAt">>({
      query: (data) => ({
        url: "/purchase-orders/suppliers",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Supplier"],
      transformResponse: (response: any) => response?.data ?? response,
    }),
    deleteSupplier: builder.mutation<void, string>({
      query: (id) => ({
        url: `/purchase-orders/suppliers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Supplier"],
    }),
    updateSupplier: builder.mutation<SupplierApi, { id: string; data: Partial<SupplierApi> }>({
      query: ({ id, data }) => ({
        url: `/purchase-orders/suppliers/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Supplier"],
    }),
    getPurchaseOrders: builder.query<PurchaseOrderApi[], void>({
      query: () => "/purchase-orders",
      providesTags: ["PurchaseOrder"],
      transformResponse: (response: any) => response?.data ?? response ?? [],
    }),
    createPurchaseOrder: builder.mutation<
      PurchaseOrderApi,
      { supplierId: string; items: { itemId: string; orderedQuantity: number; unitCostPaise: number }[] }
    >({
      query: (data) => ({
        url: "/purchase-orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),
    receivePOItem: builder.mutation<
      PurchaseOrderApi,
      {
        id: string;
        items: {
          itemId: string;
          receivedQuantity: number;
          batchNumber: string;
          expiryDate: string;
        }[];
      }
    >({
      query: ({ id, items }) => ({
        url: `/purchase-orders/${id}/receive`,
        method: "PATCH",
        body: { items },
      }),
      invalidatesTags: ["PurchaseOrder", "Inventory"],
    }),

    // --- Supplier Portal RTK Queries ---
    getSupplierPortalOrders: builder.query<PurchaseOrderApi[], void>({
      query: () => "/purchase-orders/portal/orders",
      providesTags: ["PurchaseOrder"],
      transformResponse: (response: any) => response?.data ?? response ?? [],
    }),
    updateSupplierPOStatus: builder.mutation<
      PurchaseOrderApi,
      {
        id: string;
        status: "PACKING" | "OUT_OF_STOCK" | "PARTIALLY_DISPATCHED" | "DISPATCHED";
        supplierNotes?: string;
        expectedNextDeliveryDate?: string;
        items?: { itemId: string; dispatchedQuantity: number }[];
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/purchase-orders/portal/orders/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["PurchaseOrder"],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useReceivePOItemMutation,
  useGetSupplierPortalOrdersQuery,
  useUpdateSupplierPOStatusMutation,
} = procurementApiSlice;
