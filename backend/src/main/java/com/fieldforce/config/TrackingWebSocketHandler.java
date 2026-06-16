package com.fieldforce.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fieldforce.model.AttendanceShift;
import com.fieldforce.model.User;
import com.fieldforce.model.UserLocationHistory;
import com.fieldforce.repository.AttendanceShiftRepository;
import com.fieldforce.repository.UserLocationHistoryRepository;
import com.fieldforce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class TrackingWebSocketHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
            .configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

    @Autowired
    private AttendanceShiftRepository shiftRepository;

    @Autowired
    private UserLocationHistoryRepository locationHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("New WebSocket tracking connection established: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("WebSocket tracking connection closed: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println("Received telemetry message: " + payload);

        try {
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String type = (String) data.getOrDefault("type", "location_update");
            String userId = (String) data.get("userId");

            if (userId == null || userId.isEmpty()) {
                return;
            }

            if ("location_update".equalsIgnoreCase(type)) {
                Double lat = null;
                Double lng = null;

                if (data.get("lat") != null) {
                    lat = Double.parseDouble(data.get("lat").toString());
                }
                if (data.get("lng") != null) {
                    lng = Double.parseDouble(data.get("lng").toString());
                }

                String shiftStatus = (String) data.get("status");

                if (lat != null && lng != null) {
                    // 1. Update AttendanceShift (Current Location)
                    Optional<AttendanceShift> shiftOpt = shiftRepository.findById(userId);
                    AttendanceShift shift;

                    if (shiftOpt.isPresent()) {
                        shift = shiftOpt.get();
                    } else {
                        // Create shift record if not found
                        shift = new AttendanceShift();
                        shift.setUserId(userId);
                        Optional<User> userOpt = userRepository.findById(userId);
                        if (userOpt.isPresent()) {
                            User u = userOpt.get();
                            shift.setName(u.getName());
                            shift.setTeam(u.getTeam());
                            shift.setZone(u.getZone());
                        } else {
                            shift.setName("Technician " + userId);
                            shift.setTeam("Field Operations");
                            shift.setZone("Goa");
                        }
                        shift.setTotalBreakMs(0L);
                    }

                    shift.setGpsLat(lat);
                    shift.setGpsLng(lng);
                    shift.setGpsAddress("Live tracked coordinate");
                    shift.setOnline(true);

                    if (shiftStatus != null && !shiftStatus.isEmpty()) {
                        shift.setShiftStatus(shiftStatus);
                        if ("off_shift".equalsIgnoreCase(shiftStatus)) {
                            shift.setOnline(false);
                        } else if ("on_shift".equalsIgnoreCase(shiftStatus) && shift.getPunchInAt() == null) {
                            shift.setPunchInAt(Instant.now());
                        }
                    } else if ("off_shift".equalsIgnoreCase(shift.getShiftStatus())) {
                        shift.setShiftStatus("on_shift");
                        shift.setPunchInAt(Instant.now());
                    }

                    shiftRepository.save(shift);

                    // 2. Save location entry in UserLocationHistory (History)
                    UserLocationHistory historyEntry = new UserLocationHistory(userId, lat, lng, Instant.now());
                    locationHistoryRepository.save(historyEntry);

                    // 3. Prune history to enforce last 50 points rule
                    locationHistoryRepository.pruneOldLocations(userId);

                    // 4. Retrieve historical route list
                    List<UserLocationHistory> routeHistory = locationHistoryRepository.findByUserIdOrderByTimestampAsc(userId);

                    // 5. Broadcast updated user telemetry and route path to all connected admins
                    java.util.Map<String, Object> broadcastData = new java.util.HashMap<>();
                    broadcastData.put("type", "location_broadcast");
                    broadcastData.put("userId", userId);
                    broadcastData.put("name", shift.getName());
                    broadcastData.put("team", shift.getTeam());
                    broadcastData.put("zone", shift.getZone());
                    broadcastData.put("shiftStatus", shift.getShiftStatus());
                    broadcastData.put("online", shift.getOnline());
                    broadcastData.put("lat", lat);
                    broadcastData.put("lng", lng);
                    broadcastData.put("address", shift.getGpsAddress());
                    broadcastData.put("history", routeHistory);

                    String broadcastMsg = objectMapper.writeValueAsString(broadcastData);
                    broadcast(broadcastMsg);
                }
            } else if ("request_history".equalsIgnoreCase(type)) {
                // Return historical trail directly to requester
                List<UserLocationHistory> routeHistory = locationHistoryRepository.findByUserIdOrderByTimestampAsc(userId);
                Map<String, Object> responseData = Map.of(
                        "type", "history_response",
                        "userId", userId,
                        "history", routeHistory
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(responseData)));
            }

        } catch (Exception e) {
            System.err.println("Error processing WebSocket tracking message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void broadcast(String message) {
        TextMessage textMessage = new TextMessage(message);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    System.err.println("Failed to send message to session " + session.getId() + ": " + e.getMessage());
                }
            }
        }
    }
}
