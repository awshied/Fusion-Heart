import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  modalOpen: boolean;
  modalContent: React.ReactNode | null;
  toastMessage: string | null;
  toastType: "success" | "error" | "info" | "warning";
}

const initialState: UIState = {
  theme: "light",
  sidebarOpen: true,
  modalOpen: false,
  modalContent: null,
  toastMessage: null,
  toastType: "info",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        const daisyTheme = state.theme === "light" ? "retro" : "coffee";
        document.documentElement.setAttribute("data-theme", daisyTheme);
      }
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
      if (typeof window !== "undefined") {
        const daisyTheme = action.payload === "light" ? "retro" : "coffee";
        document.documentElement.setAttribute("data-theme", daisyTheme);
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<React.ReactNode>) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = null;
    },
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: UIState["toastType"] }>,
    ) => {
      state.toastMessage = action.payload.message;
      state.toastType = action.payload.type;
    },
    hideToast: (state) => {
      state.toastMessage = null;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  showToast,
  hideToast,
} = uiSlice.actions;
export default uiSlice.reducer;
