# DevLog

## 2026-05-19
### [Dev Spec] PDF Export & DevOps Planning
**Impact:**
- **PDF Export**: Allows users to export exams (Interpretation, Written Comp, and Translation results) to PDF format using native browser printing capabilities styled with Tailwind `print:` classes.
- **DevOps**: Establishes a CI/CD pipeline foundation to automate testing, build, and deployment processes, ensuring code quality and rapid iteration.

**Steps Completed:**
1. Added `print:` classes across `App.tsx`, `InterpretationSection.tsx`, `WrittenCompSection.tsx`, and `ResultSection.tsx` to optimize layout for printing (e.g., hiding sidebars, expanding content widths).
2. Inserted a "Print to PDF" button with Lucide `Printer` icon in exam headers.
3. Updated `i18n.ts` to include translation strings for "Export PDF".

**Steps Planned (DevOps):**
1. Set up GitHub Actions workflows for automated testing (pytest for backend, vitest/jest for frontend).
2. Automate dependency vulnerability scanning (e.g., Dependabot).
3. Containerize the application (Docker) to ensure environment consistency.
4. Establish staging and production deployment pipelines (e.g., Vercel for frontend, Render/Railway for backend).

### [Delivery Doc] Fix Blank Screen in Written Comp Mode
**Impact:**
- Resolved an issue where "Written Comprehensive" mode would display a blank screen (white screen) when LLM returns slightly malformed JSON, and prevents frontend crashes if missing partial sections.

**Steps Completed:**
1. Added `json-repair` library to `requirements.txt` to robustly parse JSON from LLMs, replacing strict `json.loads` in `written_comp_llm_service.py`, `interpreter_llm_service.py`, and `llm_service.py`.
2. Added safe navigation operators (`?.`) and fallback values to React components (`WrittenCompSection.tsx`, `InterpretationSection.tsx`) to prevent uncaught exceptions.
3. Enforced a 500 error in the backend if all exam sections fail to generate, so the frontend correctly renders a "Generation Failed" error boundary instead of a blank exam.