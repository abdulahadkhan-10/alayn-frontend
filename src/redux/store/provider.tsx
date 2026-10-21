"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import AuthSync from "@/components/auth/AuthSync";

interface ReduxProviderProps {
    children: React.ReactNode;
}

export default function ReduxProvider({
    children,
}: ReduxProviderProps) {
    return (
        <Provider store={store}>
            <AuthSync />
            {children}
        </Provider>
    );
}
