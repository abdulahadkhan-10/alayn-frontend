import ReduxProvider from "@/redux/store/provider";
import { BranchProvider } from "@/lib/BranchContext";
import GlobalToastContainer from "@/components/toast/GlobalToastContainer";

// The signed-in app (and the auth pages that redirect into it) share the Redux
// store, outlet context and toasts. They live here rather than in the root
// layout so the public marketing and legal pages don't ship this code; a route
// group doesn't change any URL.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <BranchProvider>
        {children}
        <GlobalToastContainer />
      </BranchProvider>
    </ReduxProvider>
  );
}
