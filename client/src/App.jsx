import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TicketsPage from "./pages/TicketsPage";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import ActivityLogsPage from "./pages/ActivityLogsPage";

import MapPage from "./pages/MapPage";
import TeamsPage from "./pages/TeamsPage";
import RbacPage from "./pages/RbacPage";
import SlaPage from "./pages/SlaPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AttendancePage from "./pages/AttendancePage";
import InventoryPage from './pages/InventoryPage';
import ComponentHistoryPage from './pages/ComponentHistoryPage';
import TrainingPage from "./pages/TrainingPage";
import TrainingViewerPage from "./pages/TrainingViewerPage";
import QuizPage from "./pages/QuizPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function ProtectedRoute({ children }) {
 const { isAuthenticated } = useAuth();
 if (!isAuthenticated) {
   return <Navigate to="/login" replace />;
 }
 return children;
}

/**
 * PermissionRoute — renders children only if user has the required permission.
 * Super Admins bypass all checks.
 * Redirects to /unauthorized if the permission is missing.
 */
function PermissionRoute({ children, permission }) {
  const { hasPermission } = useAuth();
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

export default function App() {
 return (
 <Routes>
 <Route path="/login" element={<LoginPage />} />
 <Route
 path="/*"
 element={
 <ProtectedRoute>
 <AdminLayout />
 </ProtectedRoute>
 }
 >
   <Route index element={<DashboardPage />} />

   {/* Tickets */}
   <Route path="tickets" element={
     <PermissionRoute permission="tickets.view"><TicketsPage /></PermissionRoute>
   } />

   {/* Activity Logs */}
   <Route path="activity-logs" element={<ActivityLogsPage />} />
   <Route path="activity-logs/:ticketId" element={<ActivityLogsPage />} />

   {/* Devices */}
   <Route path="devices" element={
     <PermissionRoute permission="devices.view"><DevicesPage /></PermissionRoute>
   } />
   <Route path="devices/:deviceId" element={
     <PermissionRoute permission="devices.view"><DeviceDetailPage /></PermissionRoute>
   } />

   {/* Map - accessible to all authenticated users */}
   <Route path="map" element={<MapPage />} />

   {/* SLA */}
   <Route path="sla" element={
     <PermissionRoute permission="sla.view"><SlaPage /></PermissionRoute>
   } />

   {/* Attendance */}
   <Route path="attendance" element={
     <PermissionRoute permission="attendance.view"><AttendancePage /></PermissionRoute>
   } />

   {/* Teams */}
   <Route path="teams" element={
     <PermissionRoute permission="teams.view"><TeamsPage key="teams" defaultTab="teams" /></PermissionRoute>
   } />

   {/* Users */}
   <Route path="users" element={
     <PermissionRoute permission="users.view"><TeamsPage key="users" defaultTab="users" /></PermissionRoute>
   } />

   {/* RBAC / Settings */}
   <Route path="rbac" element={
     <PermissionRoute permission="rbac.view"><RbacPage /></PermissionRoute>
   } />

   {/* Analytics */}
   <Route path="analytics" element={
     <PermissionRoute permission="analytics.view"><AnalyticsPage /></PermissionRoute>
   } />

   {/* Notifications - accessible to all authenticated users */}
   <Route path="notifications" element={<NotificationsPage />} />

   {/* Inventory */}
   <Route path="inventory" element={
     <PermissionRoute permission="inventory.view"><InventoryPage /></PermissionRoute>
   } />
   <Route path="inventory/component-history/:id" element={
     <PermissionRoute permission="inventory.view"><ComponentHistoryPage /></PermissionRoute>
   } />

   {/* Training */}
   <Route path="training" element={
     <PermissionRoute permission="training.view"><TrainingPage /></PermissionRoute>
   } />
   <Route path="training/material/:materialId" element={
     <PermissionRoute permission="training.view"><TrainingViewerPage /></PermissionRoute>
   } />
   <Route path="training/quiz/:quizId" element={
     <PermissionRoute permission="training.view"><QuizPage /></PermissionRoute>
   } />

   <Route path="unauthorized" element={<UnauthorizedPage />} />
   <Route path="*" element={<Navigate to="/" replace />} />
 </Route>
 </Routes>
 );
}
