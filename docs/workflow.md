# Development Workflow

KAIROS runs a structured 6-phase pipeline for every feature. Each phase is handled by a specialist agent and produces a concrete output before the next phase begins.

---

## Phase 0: Context Extraction

- Developer provides feature request
- System reads agent files
- Orchestrator analyzes scope and routes to the right agents

---

## Phase 1: Requirements Analysis (PM Agent)

- Break down requirements
- Identify edge cases
- Create acceptance criteria
- **Output:** Detailed specification

---

## Phase 2: System Design (Architect Agent)

- Design database schema
- Plan API contracts
- Define error handling patterns
- **Output:** Architecture document

---

## Phase 3: Implementation (Implementer Agent)

- Write tests FIRST (TDD)
- Implement code to pass tests
- Apply team patterns
- **Output:** Code + unit tests

---

## Phase 4: Code Review (Code Reviewer)

- Check code standards
- Verify pattern compliance
- Review architecture alignment
- **Output:** Quality report + feedback

---

## Phase 5: Test Verification (Test Verifier)

- Analyze test quality
- Verify coverage >80%
- Check assertion quality
- **Output:** Coverage report

---

## Phase 6: Deployment Planning (Release Planner)

- Plan deployment steps
- Create rollback procedure
- Identify risks
- **Output:** Deployment checklist

---

::: tip Final Output
Every KAIROS run produces:
- Production-ready code
- Comprehensive test suite (>80% coverage)
- Quality assurance report
- Deployment plan with rollback procedure
:::
