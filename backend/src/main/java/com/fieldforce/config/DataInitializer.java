package com.fieldforce.config;

import com.fieldforce.model.User;
import com.fieldforce.model.Ticket;
import com.fieldforce.model.TechnicianActivityLog;
import com.fieldforce.repository.UserRepository;
import com.fieldforce.repository.TicketRepository;
import com.fieldforce.repository.TechnicianActivityLogRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Configuration
public class DataInitializer {
    @Bean
    public CommandLineRunner seedSuperAdmin(
            UserRepository userRepo,
            TicketRepository ticketRepo,
            TechnicianActivityLogRepository activityRepo) {
        return args -> {
            // Update any existing users with old Scheme Admin/PC roles to Operational Manager
            List<User> allUsers = userRepo.findAll();
            for (User u : allUsers) {
                if ("Scheme Admin".equalsIgnoreCase(u.getRole()) || "Scheme PC".equalsIgnoreCase(u.getRole())) {
                    u.setRole("Operational Manager");
                    userRepo.save(u);
                }
            }

            // Seed Super Admin
            User superAdmin = userRepo.findByEmail("superadmin@fieldforce.io").orElse(new User());
            superAdmin.setId("U-999");
            superAdmin.setName("Ravi Kumar");
            superAdmin.setEmail("superadmin@fieldforce.io");
            superAdmin.setPassword("superadmin123");
            superAdmin.setRole("Super Admin");
            superAdmin.setTeam("Executive");
            superAdmin.setStatus("Active");
            superAdmin.setZone("Global");
            superAdmin.setAvatar("RK");
            userRepo.save(superAdmin);

            // Seed Meera Rao
            User meera = userRepo.findById("U-003").orElse(new User());
            meera.setId("U-003");
            meera.setName("Meera Rao");
            meera.setEmail("meera@fieldforce.io");
            meera.setPassword("password123");
            meera.setRole("Technician");
            meera.setTeam("South Goa Squad");
            meera.setStatus("On Shift");
            meera.setZone("South Goa");
            meera.setAvatar("MR");
            userRepo.save(meera);

            // Seed Sameer Desai
            User sameer = userRepo.findById("U-004").orElse(new User());
            sameer.setId("U-004");
            sameer.setName("Sameer Desai");
            sameer.setEmail("sameer@fieldforce.io");
            sameer.setPassword("password123");
            sameer.setRole("Technician");
            sameer.setTeam("Central Goa Squad");
            sameer.setStatus("On Shift");
            sameer.setZone("Central Goa");
            sameer.setAvatar("SD");
            userRepo.save(sameer);

            // Seed Rohit Kumar
            User rohit = userRepo.findById("U-005").orElse(new User());
            rohit.setId("U-005");
            rohit.setName("Rohit Kumar");
            rohit.setEmail("rohit@fieldforce.io");
            rohit.setPassword("password123");
            rohit.setRole("Technician");
            rohit.setTeam("North Goa Squad");
            rohit.setStatus("On Shift");
            rohit.setZone("North Goa");
            rohit.setAvatar("RK");
            userRepo.save(rohit);

            // Seed Ayesha Patel
            User ayesha = userRepo.findById("U-006").orElse(new User());
            ayesha.setId("U-006");
            ayesha.setName("Ayesha Patel");
            ayesha.setEmail("ayesha@fieldforce.io");
            ayesha.setPassword("password123");
            ayesha.setRole("Technician");
            ayesha.setTeam("Central Goa Squad");
            ayesha.setStatus("On Shift");
            ayesha.setZone("Central Goa");
            ayesha.setAvatar("AP");
            userRepo.save(ayesha);

            // Seed Vikram Singh
            User vikram = userRepo.findById("U-007").orElse(new User());
            vikram.setId("U-007");
            vikram.setName("Vikram Singh");
            vikram.setEmail("vikram@fieldforce.io");
            vikram.setPassword("password123");
            vikram.setRole("Technician");
            vikram.setTeam("South Goa Squad");
            vikram.setStatus("Break");
            vikram.setZone("South Goa");
            vikram.setAvatar("VS");
            userRepo.save(vikram);

            // Seed Priya Nair
            User priya = userRepo.findById("U-001").orElse(new User());
            priya.setId("U-001");
            priya.setName("Priya Nair");
            priya.setEmail("priya@fieldforce.io");
            priya.setPassword("password123");
            priya.setRole("Operational Manager");
            priya.setTeam("Operations Control");
            priya.setStatus("Active");
            priya.setZone("Goa");
            priya.setAvatar("PN");
            userRepo.save(priya);

            // Seed Karma Wangdi (Bhutan Operational Manager)
            User karma = userRepo.findById("U-009").orElse(new User());
            karma.setId("U-009");
            karma.setName("Karma Wangdi");
            karma.setEmail("karma@fieldforce.io");
            karma.setPassword("password123");
            karma.setRole("Operational Manager");
            karma.setTeam("Thimphu Alpha");
            karma.setStatus("Active");
            karma.setZone("Thimphu");
            karma.setAvatar("KW");
            userRepo.save(karma);

            // Seed Pema Choden (Bhutan Technician)
            User pema = userRepo.findById("U-011").orElse(new User());
            pema.setId("U-011");
            pema.setName("Pema Choden");
            pema.setEmail("pema@fieldforce.io");
            pema.setPassword("password123");
            pema.setRole("Technician");
            pema.setTeam("Thimphu Alpha");
            pema.setStatus("On Shift");
            pema.setZone("Thimphu");
            pema.setAvatar("PC");
            userRepo.save(pema);

            // Seed Sonam Tobgay (Bhutan Technician)
            User sonam = userRepo.findById("U-012").orElse(new User());
            sonam.setId("U-012");
            sonam.setName("Sonam Tobgay");
            sonam.setEmail("sonam@fieldforce.io");
            sonam.setPassword("password123");
            sonam.setRole("Technician");
            sonam.setTeam("Paro Beta");
            sonam.setStatus("On Shift");
            sonam.setZone("Paro");
            sonam.setAvatar("ST");
            userRepo.save(sonam);

            // Seed Meera Rao's 4 assigned tickets if not present
            if (ticketRepo.count() <= 1) { // If only seeded database
                // Seed 4 tickets for Meera Rao
                Ticket t1 = new Ticket();
                t1.setId("JOB-2024-005");
                t1.setCustomer("Green Energy Pvt");
                t1.setSite("Ponda Industrial Zone");
                t1.setTechnician("Meera Rao");
                t1.setPriority("HIGH");
                t1.setIssue("Backup battery cell unit 3 overheating during fast charge cycle.");
                t1.setStatus("TRAVELLING");
                t1.setCreatedAt(Instant.now().minus(2, ChronoUnit.HOURS));
                t1.setSentAt(Instant.now().minus(2, ChronoUnit.HOURS));
                t1.setRespondedAt(Instant.now().minus(110, ChronoUnit.MINUTES));
                t1.setJobType("maintenance_inspections");
                t1.setDeviceId("MCH902");
                t1.setDeviceName("Air Quality Node");
                ticketRepo.save(t1);

                Ticket t2 = new Ticket();
                t2.setId("JOB-2024-010");
                t2.setCustomer("Goa Power Corp");
                t2.setSite("Margao Solar Grid");
                t2.setTechnician("Meera Rao");
                t2.setPriority("CRITICAL");
                t2.setIssue("Solar inverter grid sync failure causing local trip.");
                t2.setStatus("ASSIGNED");
                t2.setCreatedAt(Instant.now().minus(1, ChronoUnit.HOURS));
                t2.setSentAt(Instant.now().minus(1, ChronoUnit.HOURS));
                t2.setJobType("critical_repairs");
                t2.setDeviceId("MCH918");
                t2.setDeviceName("Battery Monitor");
                ticketRepo.save(t2);

                Ticket t3 = new Ticket();
                t3.setId("JOB-2024-011");
                t3.setCustomer("Coastal Smart Grid");
                t3.setSite("Vasco Center");
                t3.setTechnician("Meera Rao");
                t3.setPriority("MEDIUM");
                t3.setIssue("Gateway battery backup diagnostics report low charge cycles.");
                t3.setStatus("REVIEW");
                t3.setCreatedAt(Instant.now().minus(3, ChronoUnit.HOURS));
                t3.setSentAt(Instant.now().minus(3, ChronoUnit.HOURS));
                t3.setRespondedAt(Instant.now().minus(170, ChronoUnit.MINUTES));
                t3.setCompletedAt(null);
                t3.setJobType("service_repairs");
                ticketRepo.save(t3);

                Ticket t4 = new Ticket();
                t4.setId("JOB-2024-012");
                t4.setCustomer("NH66 Lighting Authority");
                t4.setSite("Margao Hub");
                t4.setTechnician("Meera Rao");
                t4.setPriority("LOW");
                t4.setIssue("Gateway cellular connectivity antenna replacement.");
                t4.setStatus("COMPLETED");
                t4.setCreatedAt(Instant.now().minus(5, ChronoUnit.HOURS));
                t4.setSentAt(Instant.now().minus(5, ChronoUnit.HOURS));
                t4.setRespondedAt(Instant.now().minus(290, ChronoUnit.MINUTES));
                t4.setCompletedAt(Instant.now().minus(4, ChronoUnit.HOURS));
                t4.setJobType("installation_upgrades");
                ticketRepo.save(t4);

                // Add activity logs for Meera Rao to show historical trace
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-012", "ASSIGNED", "Ticket JOB-2024-012 assigned (Pending).", Instant.now().minus(5, ChronoUnit.HOURS), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-012", "ACCEPTED", "Technician accepted job assignment.", Instant.now().minus(290, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-012", "TRAVELLING", "Technician started travel route to site.", Instant.now().minus(280, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-012", "REVIEW", "Technician arrived on-site (Reached) and began diagnostics review.", Instant.now().minus(260, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-012", "COMPLETED", "Technician marked the job completed successfully.", Instant.now().minus(4, ChronoUnit.HOURS), 15.275, 74.124, "Meera Rao"));

                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-011", "ASSIGNED", "Ticket JOB-2024-011 assigned (Pending).", Instant.now().minus(3, ChronoUnit.HOURS), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-011", "ACCEPTED", "Technician accepted job assignment.", Instant.now().minus(170, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-011", "TRAVELLING", "Technician started travel route to site.", Instant.now().minus(160, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-011", "REVIEW", "Technician arrived on-site (Reached) and began diagnostics review.", Instant.now().minus(140, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));

                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-005", "ASSIGNED", "Ticket JOB-2024-005 assigned (Pending).", Instant.now().minus(2, ChronoUnit.HOURS), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-005", "ACCEPTED", "Technician accepted job assignment.", Instant.now().minus(110, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));
                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-005", "TRAVELLING", "Technician started travel route to site.", Instant.now().minus(100, ChronoUnit.MINUTES), 15.275, 74.124, "Meera Rao"));

                activityRepo.save(new TechnicianActivityLog("U-003", "JOB-2024-010", "ASSIGNED", "Ticket JOB-2024-010 assigned (Pending).", Instant.now().minus(1, ChronoUnit.HOURS), 15.275, 74.124, "Meera Rao"));
            }
        };
    }
}
