import { Middleware, isFulfilled, isRejected } from "@reduxjs/toolkit";
import { showToast } from "@/lib/toast";

// Human-friendly success messages for RTK Query mutations across Alayn platform
const mutationSuccessMessages: Record<string, { title: string; message?: string }> = {
  // Auth
  login: { title: "Welcome back!", message: "Login successful." },
  register: { title: "Registration Successful!", message: "Account created successfully." },
  updateProfile: { title: "Profile Updated", message: "Your profile details have been saved." },
  changePassword: { title: "Password Changed", message: "Your account password has been updated." },
  logout: { title: "Logged Out", message: "You have been logged out securely." },

  // Outlets
  createOutlet: { title: "Outlet Created!", message: "New branch outlet added successfully." },

  // Employees & Workforce
  createEmployee: { title: "Employee Added", message: "New employee profile registered successfully." },
  updateEmployee: { title: "Employee Updated", message: "Employee profile details updated." },
  bulkUploadEmployees: { title: "Bulk Upload Complete", message: "Employee directory records imported." },
  createLeaveRequest: { title: "Leave Requested", message: "Your leave application has been submitted." },
  updateLeaveStatus: { title: "Leave Status Updated", message: "Leave request status updated." },

  // Shifts & Rosters & Attendance
  createShift: { title: "Shift Created", message: "New work shift schedule configured." },
  assignShift: { title: "Shift Assigned", message: "Employee shift assignment recorded." },
  requestSwap: { title: "Shift Swap Requested", message: "Swap request sent to supervisor." },
  updateSwapStatus: { title: "Swap Status Updated", message: "Shift swap request processed." },
  setWeeklyRoster: { title: "Weekly Roster Saved", message: "Staff weekly roster configuration updated." },
  clockIn: { title: "Clock In Recorded", message: "Attendance check-in logged." },
  clockOut: { title: "Clock Out Recorded", message: "Attendance check-out logged." },

  // Menu Management
  createCategory: { title: "Category Created", message: "New menu category added." },
  createMenuItem: { title: "Menu Item Created", message: "New dish added to dining menu." },
  updateMenuItem: { title: "Menu Item Updated", message: "Dish details updated." },
  toggleMenuItemStatus: { title: "Item Status Toggled", message: "Menu availability updated." },

  // Inventory & Procurement
  createItem: { title: "Inventory Item Created", message: "Item added to stock catalog." },
  adjustStock: { title: "Stock Level Adjusted", message: "Inventory stock count updated." },
  logWaste: { title: "Waste Logged", message: "Inventory waste record created." },
  createSupplier: { title: "Supplier Added", message: "Vendor contacts saved." },
  createPurchaseOrder: { title: "Purchase Order Created", message: "PO issued to supplier." },
  receivePOItem: { title: "Items Received", message: "Stock batch updated from PO receipt." },

  // Orders
  createOrder: { title: "Order Created", message: "New customer order registered." },
  updateOrderStatus: { title: "Order Status Updated", message: "Kitchen order status updated." },

  // Holidays
  createHoliday: { title: "Holiday Added", message: "Outlet holiday calendar updated." },
  deleteHoliday: { title: "Holiday Removed", message: "Holiday removed from calendar." },
  updateOperatingDays: { title: "Operating Days Saved", message: "Branch opening schedule saved." },
};

function formatEndpointTitle(endpointName: string): string {
  if (!endpointName) return "Action Completed";
  const result = endpointName.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function extractErrorMessage(action: any): string {
  const payload = action.payload;
  if (!payload) return action.error?.message || "An unexpected error occurred.";

  if (typeof payload === "string") return payload;
  if (typeof payload?.data?.message === "string") return payload.data.message;
  if (typeof payload?.data?.error === "string") return payload.data.error;
  if (typeof payload?.data?.error?.message === "string") return payload.data.error.message;
  if (typeof payload?.error === "string") return payload.error;
  if (typeof payload?.message === "string") return payload.message;

  return action.error?.message || "Operation failed.";
}

export const rtkQueryToastMiddleware: Middleware = () => (next) => (action: any) => {
  const isMutation = action?.meta?.arg?.type === "mutation";
  const endpointName = action?.meta?.arg?.endpointName;

  // Ignore internal/silent background mutations to avoid spamming the user
  const silentEndpoints = ["refreshToken", "markAsRead", "markAllAsRead", "deleteNotification"];
  if (silentEndpoints.includes(endpointName)) {
    return next(action);
  }

  if (isMutation) {
    if (isFulfilled(action)) {
      const customMsg = mutationSuccessMessages[endpointName];
      if (customMsg) {
        showToast.success(customMsg.title, customMsg.message);
      } else {
        const title = `${formatEndpointTitle(endpointName)} Successful`;
        const msg = action.payload?.message || action.payload?.data?.message || "Operation completed successfully.";
        showToast.success(title, msg);
      }
    } else if (isRejected(action)) {
      const title = `${formatEndpointTitle(endpointName)} Failed`;
      const errorMsg = extractErrorMessage(action);
      showToast.error(title, errorMsg);
    }
  }

  return next(action);
};
