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


function RouteWrapper() {} // Just keeping line spacing cleaner if needed, but not necessary

function ProtectedRoute({ children }) {
 const { isAuthenticated } = useAuth();
 if (!isAuthenticated) {
 return <Navigate to="/login" replace />;
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
 <Route path="tickets" element={<TicketsPage />} />
 <Route path="activity-logs" element={<ActivityLogsPage />} />
 <Route path="activity-logs/:ticketId" element={<ActivityLogsPage />} />
 
 <Route path="devices" element={<DevicesPage />} />
 <Route path="devices/:deviceId" element={<DeviceDetailPage />} />
 <Route path="map" element={<MapPage />} />
 <Route path="sla" element={<SlaPage />} />
 <Route path="attendance" element={<AttendancePage />} />
 <Route path="teams" element={<TeamsPage key="teams" defaultTab="teams" />} />
 <Route path="users" element={<TeamsPage key="users" defaultTab="users" />} />
 <Route path="rbac" element={<RbacPage />} />
 <Route path="analytics" element={<AnalyticsPage />} />
 <Route path="notifications" element={<NotificationsPage />} />
 <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/component-history/:id" element={<ComponentHistoryPage />} />
 <Route path="training" element={<TrainingPage />} />
 <Route path="training/material/:materialId" element={<TrainingViewerPage />} />
 <Route path="training/quiz/:quizId" element={<QuizPage />} />
 <Route path="unauthorized" element={<UnauthorizedPage />} />
 <Route path="*" element={<Navigate to="/" replace />} />
 </Route>
 </Routes>
 );
}

