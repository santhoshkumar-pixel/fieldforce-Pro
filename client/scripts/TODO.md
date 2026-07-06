# FieldForce - Training Quiz Feature

## Backend (Spring)
- [ ] Add JPA entities + tables for quizzes and attempts
  - [ ] Quiz (linked to TrainingMaterial)
  - [ ] QuizQuestion
  - [ ] QuizOption
  - [ ] QuizAttempt
  - [ ] QuizAttemptAnswer
- [ ] Add QuizController endpoints
  - [ ] GET /api/quizzes?trainingMaterialId=...
  - [ ] POST /api/quizzes/{quizId}/attempt
  - [ ] GET /api/quizzes (standalone catalog)
- [ ] Add permission/access logic using existing PermissionService
- [ ] Update backend/db/schema.sql with quiz tables
- [ ] Seed sample quiz data (optional but recommended)
  - [ ] Also update `backend/db/data.sql` so the app has at least one working quiz (existing seed flow)


## Frontend (React)
- [ ] Add new route/page for standalone quiz section
  - [ ] src/pages/QuizzesPage.jsx
  - [ ] Add route in src/App.jsx (e.g. /quiz)
  - [ ] Add nav item in src/layouts/AdminLayout.jsx (Learning -> Quiz)
- [ ] Add quiz attempt UI
  - [ ] src/components/training/QuizAttempt.jsx
- [ ] Link related quiz to TrainingPage viewer modal
  - [ ] Update src/pages/TrainingPage.jsx to fetch and show Related Quiz + Start/Resume
- [ ] Extend API client
  - [ ] Update src/utils/api.js with api.quizzes endpoints
- [ ] Update UniversalSearch to include Quiz section/search results

## Verification
- [ ] Login as a role that can view training
- [ ] Open training item -> Related Quiz appears -> attempt works
- [ ] Open standalone Quiz section -> list appears -> attempt works
- [ ] Verify forbidden roles are blocked by backend permission checks

