import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../utils/api";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
 const { user } = useAuth();
 const [notifications, setNotifications] = useState([]);
 const [tickets, setTickets] = useState([]);
 const [loading, setLoading] = useState(true);

 const fetchNotifications = async () => {
 try {
 const [notifsData, ticketsData] = await Promise.all([
 api.notifications.getAll(),
 api.tickets.getAll()
 ]);
 setNotifications(notifsData || []);
 setTickets(ticketsData || []);
 } catch (err) {
 console.error("Failed to fetch notifications or tickets:", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchNotifications();
 }, []);

 const getTicketPlace = (t) => {
 if (!t) return "Goa";
 const siteLower = (t.site || "").toLowerCase();
 const customerLower = (t.customer || "").toLowerCase();
 const issueLower = (t.issue || "").toLowerCase();
 
 if (
 siteLower.includes("thimphu") || siteLower.includes("paro") || siteLower.includes("bhutan") ||
 customerLower.includes("thimphu") || customerLower.includes("paro") || customerLower.includes("bhutan") ||
 issueLower.includes("thimphu") || issueLower.includes("paro") || issueLower.includes("bhutan")
 ) {
 return "Bhutan";
 }
 return "Goa";
 };

 const filteredNotifications = useMemo(() => {
 if (!user) return [];

 return notifications.filter((n) => {
 const title = n.title || "";
 const titleLower = title.toLowerCase();

 // 1. Check if it mentions the user's name
 if (user.name && titleLower.includes(user.name.toLowerCase())) {
 return true;
 }

 // 2. Check if it mentions the user's team name
 if (user.team && titleLower.includes(user.team.toLowerCase())) {
 return true;
 }

 // 3. Check if it mentions a ticket ID
 const ticketMatch = title.match(/TK-\d+/);
 if (ticketMatch) {
 const ticketId = ticketMatch[0];
 const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        // If the ticket is assigned to the user
        if (ticket.technician && user.name && ticket.technician.toLowerCase() === user.name.toLowerCase()) {
          return true;
        }
      }
 }

 // 4. Default view for Admins / Operational Manager / Scheme PC (show everything or fall back)
  if (user.role === "Super Admin") {
    return true;
  }

  if (user.role === "Operational Manager" || user.role === "Warehouse Manager") {
    const getNotificationPlace = (n) => {
      if (!n || !n.title) return "Goa";
      const titleLower = n.title.toLowerCase();
      if (titleLower.includes("thimphu") || titleLower.includes("paro") || titleLower.includes("bhutan")) {
        return "Bhutan";
      }
      return "Goa";
    };
    const nPlace = getNotificationPlace(n);
    const uPlace = user.zone && (user.zone.toLowerCase().includes("goa") || ["north goa", "south goa", "central goa", "goa"].includes(user.zone.toLowerCase())) ? "Goa" : "Bhutan";
    return nPlace === uPlace;
  }

 return false;
 });
 }, [notifications, user, tickets]);

 const unreadCount = useMemo(() => {
 return filteredNotifications.filter((n) => n.unread).length;
 }, [filteredNotifications]);

 const markAllRead = async () => {
 try {
 const unreadFiltered = filteredNotifications.filter((n) => n.unread);
 await Promise.all(unreadFiltered.map((n) => api.notifications.markAsRead(n.id)));
 setNotifications((prev) =>
 prev.map((n) => {
 const isFilteredUnread = unreadFiltered.some((uf) => uf.id === n.id);
 return isFilteredUnread ? { ...n, unread: false } : n;
 })
 );
 } catch (err) {
 console.error("Failed to mark all as read:", err);
 }
 };

 const markAsRead = async (id) => {
 try {
 await api.notifications.markAsRead(id);
 setNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
 );
 } catch (err) {
 console.error("Failed to mark notification as read:", err);
 }
 };

 return (
 <NotificationContext.Provider
 value={{
 notifications: filteredNotifications,
 unreadCount,
 loading,
 markAllRead,
 markAsRead,
 refreshNotifications: fetchNotifications,
 }}
 >
 {children}
 </NotificationContext.Provider>
 );
}

export function useNotifications() {
 const context = useContext(NotificationContext);
 if (!context) {
 throw new Error("useNotifications must be used within a NotificationProvider");
 }
 return context;
}
