import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import { DeviceProvider } from "./context/DeviceContext";
import { NotificationProvider } from "./context/NotificationContext";
import { RegionProvider } from "./context/RegionContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
 <React.StrictMode>
 <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
 <AuthProvider>
 <RegionProvider>
 <AttendanceProvider>
 <DeviceProvider>
 <NotificationProvider>
 <App />
 </NotificationProvider>
 </DeviceProvider>
 </AttendanceProvider>
 </RegionProvider>
 </AuthProvider>
 </BrowserRouter>
 </React.StrictMode>
);
