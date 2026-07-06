// ─── Quiz Data Store (localStorage-based) ───────────────────────────────────
// Keys used in localStorage:
//   fieldforce_quizzes        → array of Quiz objects
//   fieldforce_quiz_results   → array of QuizResult objects

const QUIZZES_KEY = "fieldforce_quizzes";
const RESULTS_KEY = "fieldforce_quiz_results";

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_QUIZZES = [
  {
    id: "quiz-standalone-1",
    trainingMaterialId: null, // standalone
    title: "Field Safety & PPE Compliance",
    description:
      "Test your knowledge of personal protective equipment, site safety protocols, and hazard identification procedures.",
    targetedRole: "Field Technician",
    difficulty: "Medium",
    questions: [
      {
        id: "q1",
        text: "Which of the following is mandatory PPE when working on energized electrical panels?",
        options: [
          "Standard work gloves and safety glasses",
          "Insulated rubber gloves rated for the voltage level",
          "Cotton gloves and a hard hat",
          "Chemical-resistant gloves only",
        ],
        correctIndex: 1,
        explanation:
          "Insulated rubber gloves rated for the specific voltage level are mandatory when working on or near energized electrical panels to prevent electric shock.",
      },
      {
        id: "q2",
        text: "Before entering a confined space, what is the FIRST action a technician must take?",
        options: [
          "Put on the harness and enter quickly",
          "Test the atmosphere for oxygen levels and toxic gases",
          "Inform a colleague verbally",
          "Switch off the nearest electrical breaker",
        ],
        correctIndex: 1,
        explanation:
          "Atmospheric testing is the first and most critical step before confined space entry to detect oxygen deficiency or the presence of hazardous gases.",
      },
      {
        id: "q3",
        text: "What does the LOTO procedure stand for?",
        options: [
          "Locate, Operate, Test, Observe",
          "Lock Out, Tag Out",
          "List, Order, Track, Oversee",
          "Level, Output, Temperature, Offset",
        ],
        correctIndex: 1,
        explanation:
          "LOTO stands for Lock Out, Tag Out — a safety procedure to ensure hazardous energy sources are isolated and cannot be re-energized while maintenance is being performed.",
      },
      {
        id: "q4",
        text: "A near-miss incident should be reported:",
        options: [
          "Only if it caused minor injuries",
          "Only if it caused equipment damage",
          "Immediately, even if no injury or damage occurred",
          "At the end of the shift in a daily log",
        ],
        correctIndex: 2,
        explanation:
          "Near-miss incidents must be reported immediately even without injury, as they indicate hazards that could lead to serious accidents in the future.",
      },
      {
        id: "q5",
        text: "The correct way to lift a heavy object (over 20 kg) is:",
        options: [
          "Bend at the waist and use your back muscles",
          "Lift quickly to minimize strain duration",
          "Keep your back straight, bend your knees, and lift with leg muscles",
          "Ask someone to push from behind while you pull from the front",
        ],
        correctIndex: 2,
        explanation:
          "Proper manual lifting technique requires a straight back, bent knees, and using leg muscles — this minimizes spinal load and prevents back injuries.",
      },
    ],
  },
  {
    id: "quiz-standalone-2",
    trainingMaterialId: null, // standalone
    title: "Inventory Management Fundamentals",
    description:
      "Assess your understanding of stock control, requisition workflows, and warehouse best practices.",
    targetedRole: "Warehouse Manager",
    difficulty: "Easy",
    questions: [
      {
        id: "q1",
        text: "What does FIFO stand for in inventory management?",
        options: [
          "Fixed Input, Fixed Output",
          "First In, First Out",
          "Fast Inventory, Fast Operations",
          "Final Item, Final Order",
        ],
        correctIndex: 1,
        explanation:
          "FIFO (First In, First Out) is an inventory valuation and management method where the oldest stock is sold or used before newer stock.",
      },
      {
        id: "q2",
        text: "Which metric measures how quickly inventory is sold and replaced over a period?",
        options: [
          "Gross Margin",
          "Stock Turnover Ratio",
          "Reorder Point",
          "Economic Order Quantity",
        ],
        correctIndex: 1,
        explanation:
          "Stock Turnover Ratio (or Inventory Turnover) measures how many times inventory is sold and replaced in a given period. Higher values generally indicate efficient inventory management.",
      },
      {
        id: "q3",
        text: "A 'dead stock' item refers to:",
        options: [
          "Stock that has been recently received",
          "High-demand items kept in reserve",
          "Items that have not been sold or used for an extended period",
          "Items marked for urgent procurement",
        ],
        correctIndex: 2,
        explanation:
          "Dead stock refers to inventory that has not been sold or used for a long time and may never be sold, tying up capital and storage space.",
      },
      {
        id: "q4",
        text: "When should a Purchase Requisition (PR) be raised?",
        options: [
          "When stock levels reach the minimum reorder point",
          "At the end of each financial year only",
          "When the warehouse is completely empty",
          "Only when the manager approves proactively",
        ],
        correctIndex: 0,
        explanation:
          "A Purchase Requisition should be raised when stock levels reach the predefined minimum reorder point to ensure replenishment before stockout occurs.",
      },
    ],
  },
  {
    id: "quiz-standalone-3",
    trainingMaterialId: null, // standalone
    title: "SLA & Ticket Escalation Procedures",
    description:
      "Evaluate your knowledge of service level agreements, escalation triggers, and resolution protocols.",
    targetedRole: "Operational Manager",
    difficulty: "Hard",
    questions: [
      {
        id: "q1",
        text: "An SLA breach occurs when:",
        options: [
          "A technician calls in sick",
          "A ticket is resolved within the agreed time",
          "The resolution time exceeds the agreed service level deadline",
          "A customer raises a complaint verbally",
        ],
        correctIndex: 2,
        explanation:
          "An SLA breach occurs when a ticket is not resolved within the contractually agreed timeframe, which can trigger penalties and escalation procedures.",
      },
      {
        id: "q2",
        text: "A Priority 1 (P1) critical ticket should typically be responded to within:",
        options: [
          "8 business hours",
          "24 hours",
          "15–30 minutes",
          "2 business days",
        ],
        correctIndex: 2,
        explanation:
          "P1 critical incidents have the shortest response time SLA, typically 15–30 minutes, as they represent complete service outages or critical system failures.",
      },
      {
        id: "q3",
        text: "Ticket escalation to Level 2 support should happen when:",
        options: [
          "The technician has worked on the ticket for more than 2 hours",
          "The issue cannot be resolved at the current support tier within the SLA window",
          "The customer sends a follow-up email",
          "The ticket is marked as low priority",
        ],
        correctIndex: 1,
        explanation:
          "Escalation to Level 2 is triggered when L1 cannot resolve the issue within the agreed SLA window, ensuring specialized resources are engaged before a breach occurs.",
      },
      {
        id: "q4",
        text: "Which of the following is a valid reason to put a ticket on 'Customer Hold' status?",
        options: [
          "The technician is occupied with another task",
          "Waiting for additional information or access from the customer",
          "The SLA timer has already breached",
          "The manager has not been informed yet",
        ],
        correctIndex: 1,
        explanation:
          "Customer Hold status is valid when resolution is blocked pending information or access from the customer. This typically pauses SLA timers based on the contract terms.",
      },
      {
        id: "q5",
        text: "Root Cause Analysis (RCA) is typically required for:",
        options: [
          "All P3 and P4 tickets",
          "Only tickets that were escalated",
          "P1 and P2 tickets after resolution",
          "Tickets older than 7 days regardless of priority",
        ],
        correctIndex: 2,
        explanation:
          "RCA is typically mandatory for P1 and P2 (critical and high priority) incidents after resolution to identify the root cause and prevent recurrence.",
      },
    ],
  },
  {
    id: "quiz-standalone-4",
    trainingMaterialId: null, // standalone
    title: "General Compliance & Code of Conduct",
    description:
      "Test your knowledge of workplace ethics, data privacy, anti-harassment policies, and regulatory compliance.",
    targetedRole: "ALL",
    difficulty: "Easy",
    questions: [
      {
        id: "q1",
        text: "Which regulation governs the protection of personal data in India?",
        options: [
          "Information Technology Act, 2000 and DPDP Act, 2023",
          "Companies Act, 2013",
          "The Indian Contract Act, 1872",
          "Foreign Exchange Management Act (FEMA)",
        ],
        correctIndex: 0,
        explanation:
          "The IT Act, 2000 (specifically Section 43A and 72A) and the Digital Personal Data Protection (DPDP) Act, 2023 govern personal data protection in India.",
      },
      {
        id: "q2",
        text: "If you observe a colleague behaving unethically, you should:",
        options: [
          "Ignore it to avoid conflict",
          "Report it to the appropriate authority via the defined whistleblower channel",
          "Confront the colleague aggressively in public",
          "Share it on social media",
        ],
        correctIndex: 1,
        explanation:
          "Unethical behavior should be reported through official whistleblower or grievance channels to ensure proper investigation without personal risk.",
      },
      {
        id: "q3",
        text: "Sharing confidential company data on personal devices is:",
        options: [
          "Acceptable if done for work purposes",
          "Only acceptable with verbal manager approval",
          "Prohibited unless explicitly allowed by company policy",
          "Fine as long as the device has a password",
        ],
        correctIndex: 2,
        explanation:
          "Sharing confidential data on personal devices is generally prohibited unless specifically authorized by company data security policy to prevent data leaks.",
      },
    ],
  },
  {
    id: "quiz-standalone-5",
    trainingMaterialId: null, // standalone
    title: "Device Troubleshooting & Diagnostics",
    description:
      "Test your understanding of field device diagnostics, fault codes, and remote monitoring procedures.",
    targetedRole: "Field Technician",
    difficulty: "Hard",
    questions: [
      {
        id: "q1",
        text: "When a device shows a 'Communication Timeout' fault code, the FIRST diagnostic step is:",
        options: [
          "Replace the device immediately",
          "Check network connectivity and signal strength at the device location",
          "Escalate to Level 2 without any checks",
          "Power cycle the central server",
        ],
        correctIndex: 1,
        explanation:
          "Communication Timeout errors are most commonly caused by network issues. Verifying connectivity and signal strength at the device location is always the first diagnostic step.",
      },
      {
        id: "q2",
        text: "A device reporting negative sensor readings consistently indicates:",
        options: [
          "Normal operation during cold weather",
          "Possible sensor calibration error or wiring polarity reversal",
          "The device firmware needs a minor update",
          "User interface display glitch only",
        ],
        correctIndex: 1,
        explanation:
          "Consistent negative readings typically indicate sensor calibration drift or reversed polarity in sensor wiring, both of which require physical inspection and correction.",
      },
      {
        id: "q3",
        text: "Which tool is used to verify correct cable termination at a junction box?",
        options: [
          "Oscilloscope",
          "Multimeter in voltage mode only",
          "Continuity tester or multimeter in continuity/resistance mode",
          "Network packet analyzer",
        ],
        correctIndex: 2,
        explanation:
          "A continuity tester or multimeter set to continuity/resistance mode is the appropriate tool to verify cable termination integrity at junction boxes.",
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadQuizzes() {
  try {
    const raw = localStorage.getItem(QUIZZES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading quizzes:", e);
  }
  // Seed and return defaults
  localStorage.setItem(QUIZZES_KEY, JSON.stringify(SEED_QUIZZES));
  return SEED_QUIZZES;
}

function saveQuizzesToStorage(quizzes) {
  try {
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  } catch (e) {
    console.error("Error saving quizzes:", e);
  }
}

function loadResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading quiz results:", e);
  }
  return [];
}

function saveResultsToStorage(results) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (e) {
    console.error("Error saving quiz results:", e);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Returns all quizzes */
export function getQuizzes() {
  return loadQuizzes();
}

/** Returns all standalone quizzes (no trainingMaterialId) */
export function getStandaloneQuizzes() {
  return loadQuizzes().filter((q) => !q.trainingMaterialId);
}

/** Returns the quiz linked to a specific training material ID, or null */
export function getQuizByMaterialId(materialId) {
  if (!materialId) return null;
  return loadQuizzes().find((q) => q.trainingMaterialId === materialId) || null;
}

/** Saves (create or update) a quiz */
export function saveQuiz(quiz) {
  const quizzes = loadQuizzes();
  const idx = quizzes.findIndex((q) => q.id === quiz.id);
  if (idx >= 0) {
    quizzes[idx] = quiz;
  } else {
    quizzes.push(quiz);
  }
  saveQuizzesToStorage(quizzes);
  return quiz;
}

/** Deletes a quiz by id */
export function deleteQuiz(id) {
  const quizzes = loadQuizzes().filter((q) => q.id !== id);
  saveQuizzesToStorage(quizzes);
}

/** Returns the most recent quiz result for a specific quiz and user */
export function getQuizResult(quizId, userId) {
  const results = loadResults();
  return (
    results
      .filter((r) => r.quizId === quizId && r.userId === userId)
      .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))[0] ||
    null
  );
}

/** Saves a quiz result */
export function saveQuizResult(result) {
  const results = loadResults();
  results.push(result);
  saveResultsToStorage(results);
  return result;
}

/** Returns all quiz results */
export function getAllQuizResults() {
  return loadResults();
}

/** Generates a unique quiz ID */
export function generateQuizId() {
  return `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Generates a unique question ID */
export function generateQuestionId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}
