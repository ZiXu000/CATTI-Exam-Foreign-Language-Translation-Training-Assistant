# DevLog

## [Dev Spec] 2026-05-03: Interpretation Automatic Exam Generator MVP

### 1. Pydantic Models Structure (The JSON Contract)
To ensure strong typing and predictable JSON output from the LLMs, we will define the following nested Pydantic models in `catti_grader/app/schemas/interpreter_schema.py`:

```python
from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TrueFalseQuestion(BaseModel):
    id: str
    statement: str
    answer: Literal["True", "False"]
    distractor_logic: str = Field(..., description="Explain the trap used (e.g., phonetic confusion, subject swap).")
    timestamp_ref: Optional[str] = None

class MultipleChoiceQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: str
    distractor_logic: str = Field(..., description="Explain the trap used for wrong options.")

class SummaryRubric(BaseModel):
    source_word_count: int
    required_word_count_target: int = 200
    key_scoring_points: List[str]

class ComprehensiveExamData(BaseModel):
    true_or_false: List[TrueFalseQuestion]
    multiple_choice_short: List[MultipleChoiceQuestion]
    multiple_choice_passage: List[MultipleChoiceQuestion]
    summary_rubric: SummaryRubric

class Chunk(BaseModel):
    id: str
    text: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class PracticeExamData(BaseModel):
    chunks: List[Chunk]

class GenerateExamRequest(BaseModel):
    exam_type: Literal["口译综合能力", "口译实务"]
    transcript: str
    provider: Literal["deepseek", "mimo"] = "deepseek"
    api_key: str

class GenerateExamResponse(BaseModel):
    exam_type: str
    audio_meta: dict
    questions: Optional[ComprehensiveExamData] = None
    practice_data: Optional[PracticeExamData] = None
```

### 2. Prompt Core Logic (Reverse Engineering the Exam)
We will create a new service `interpreter_llm_service.py` with distinct prompts based on the `exam_type`.

**Prompt for Mode A (口译综合能力):**
- **Role**: Expert CATTI Interpretation Examiner.
- **Task**: Read the provided transcript and generate a comprehensive exam.
- **Distractor Constraint (CRITICAL)**: "You MUST design highly deceptive incorrect options. Use techniques like: 1. Phonetic similarity (words that sound alike). 2. Temporal inversion (swapping past and future events). 3. Subject displacement (attributing A's action to B). You MUST document this in `distractor_logic`."
- **Summary Rubric**: Extract exactly 5 non-negotiable key scoring points for a 200-word summary.

**Prompt for Mode B (口译实务):**
- **Role**: Expert CATTI Interpretation Examiner.
- **Task**: Perform intelligent semantic chunking (意群切分) on the provided transcript to simulate a Consecutive Interpretation test.
- **Chunking Logic**: "Do NOT summarize. Break the original text into chunks where an interpreter would naturally pause to translate. Each chunk should contain enough information to challenge memory (approx 1-3 minutes of speaking time or logical paragraphs). Return the array of chunks."

### 3. Execution Plan
1. Create schemas in `app/schemas/interpreter_schema.py`.
2. Create LLM logic in `app/services/interpreter_llm_service.py`.
3. Create API endpoint `POST /api/generate_exam` in `app/api/endpoints/interpreter.py`.
4. Write `test_interpreter_generator.py` with a 500-word mock transcript and use pytest to verify the full pipeline and JSON structure parsing.
## [Delivery Doc] 2026-05-03: Interpretation Exam Generator Execution
- Created interpreter_schema.py with strict Pydantic definitions for Comprehensive and Practice modes.
- Created interpreter_llm_service.py with Mode A and Mode B prompts emphasizing distractor logic and semantic chunking.
- Created interpreter.py endpoint POST /generate_exam and wired it into router.py.
- Fixed an aggressive regex sanitization bug in both llm_service.py and interpreter_llm_service.py that was corrupting valid JSON keys.
- Executed pytest test_interpreter_generator.py successfully using AsyncMock.

## [Dev Spec] 2026-05-03: Frontend Interpretation Module Integration
### 1. Update Types (src/types/index.ts)
Add interfaces for GenerateExamRequest and nested models.
### 2. Update API Client (src/api/index.ts)
Export generateExam.
### 3. Extend i18n (src/i18n.ts)
Add UI strings.
### 4. Create InterpretationSection Component
Create src/components/InterpretationSection.tsx to render exam inputs and results.
### 5. Integrate into App.tsx
Replace placeholder with <InterpretationSection />.

## [Delivery Doc] 2026-05-03: Frontend Interpretation Module Integration Execution
- Updated src/types/index.ts with comprehensive interpretation data models.
- Exported generateExam API call in src/api/index.ts.
- Extended src/i18n.ts with English and Chinese keys for the new module.
- Implemented src/components/InterpretationSection.tsx which renders inputs, handles API states, and displays dynamically generated True/False, Multiple Choice, Summary Rubrics, and Semantic Chunks.
- Replaced the dummy placeholder in App.tsx with <InterpretationSection />.

## [Dev Spec] 2026-05-04: Advanced Features & TTS Integration
### 1. Data Persistence & Exam Management
- Backend: Introduce SQLite with SQLAlchemy for ExamRecord.
- API Endpoints: CRUD operations for exams.
- Frontend: Create a History/Archive page with search, categorization, tagging, and favoriting capabilities.
### 2. Interpretation Module Workflow
- Refactor frontend state: Input -> Taking Exam (hide answers) -> Results (show grading).
### 3. Chinese Localization for Explanations
- Update prompts in interpreter_llm_service.py to enforce Chinese output.
### 4. Xiaomi MiMo TTS Integration
- Backend: Add POST /api/v1/tts to call Xiaomi mimo-v2.5-tts API and return audio.
- Frontend: Add a Play Audio button in the Interpretation module.

## [Delivery Doc] 2026-05-04: Advanced Features & TTS Integration Execution
- Created SQLite database via SQLAlchemy (db.py, models.py, history_schema.py) to persist ExamRecords.
- Added History API endpoints (history.py) for CRUD operations and linked them to router.py.
- Developed HistorySection.tsx in frontend for viewing, filtering, and favoriting past exams.
- Refactored InterpretationSection.tsx to support 'Input -> Taking Exam -> Results' workflow.
- Added Xiaomi MiMo TTS API integration (tts_service.py, tts.py) and added 'Play Audio' buttons to frontend.
- Enforced Chinese outputs for 'distractor_logic' in the Interpretation LLM prompts.

## [Delivery Doc] 2026-05-04: Bugfix - SQLAlchemy missing
- Installed sqlalchemy into the virtual environment.
- Restarted the backend server successfully.

## [Dev Spec] 2026-05-04: Home Page Recent History Integration
### 1. Fetch Recent Records
- In App.tsx, fetch the latest exam records using getExamRecords() when the user is on the home page.
### 2. UI Update
- Add a 'Recent Exams' (�����ʷ����) section below the main mode selection buttons on the home page.
- Display the top 3-5 recent records as small cards with their type, date, and a preview snippet.
### 3. Interaction
- Clicking a recent record card will trigger the onLoadRecord flow or navigate directly to the History view for detailed referencing.

## [Delivery Doc] 2026-05-04: Home Page Recent History Integration Execution
- Modified App.tsx to fetch the top 3 recent records from /api/v1/history/ on load.
- Added a '�����ʷ����' section to the bottom of the home page.
- Rendered records dynamically with type badges, dates, and snippet previews.
- Added click interaction to route users straight to the History Archive page.

## [Dev Spec] 2026-05-04: History Page i18n Localization
### 1. Translation Keys
- Add historyArchiveTitle, historySearchPlaceholder, historyFilterAll, etc. to i18n.ts for both en and zh locales.
### 2. Update Components
- Replace hardcoded English strings in HistorySection.tsx and App.tsx (for the home page recent history section) with corresponding 	.xxxx translations.

## [Delivery Doc] 2026-05-04: History Page i18n Localization Execution
- Updated i18n.ts with new translation keys for History features in both English and Chinese.
- Modified HistorySection.tsx and App.tsx to use the dynamic t.* translation variables instead of hardcoded strings.

## [Delivery Doc] 2026-05-04: Bugfix - History Page Crash Execution
- Restored the t prop in HistorySection.tsx component definition, which was causing a 't is undefined' crash when accessing i18n variables.

## [Dev Spec] 2026-05-06: Fix History Module, TTS Transcript, and Audio Player
### 1. Fully Enable History Module
- In `App.tsx`, update the `onLoadRecord` callback to parse the record. For written exams, set `sourceText`, `userTranslation`, and `result` and navigate to `written`. For interpretation exams, set a new `interpRecordToLoad` state and navigate to `interpretation`.
- In `InterpretationSection.tsx`, accept `initialRecord` as a prop and use `useEffect` to populate `transcript`, `result`, `examType`, and `examState`.
- Update `handleSaveToHistory` to save both `transcript` and `result` in JSON.

### 2. Comprehensive Ability TTS for Transcript
- In `InterpretationSection.tsx`, add a "Play Audio" button in the result header when `exam_type` is '口译综合能力'. This button calls `handlePlayTTS('full-transcript', transcript)` so users can listen to the original provided text.

### 3. Fix Audio Player Controls and Lifecycle
- In `InterpretationSection.tsx`, replace the native `new Audio().play()` calls with a state-driven `<audio controls autoPlay src={audioSrc}>` element rendered at the bottom of the result panel.
- This gives users full playback control (pause, progress bar) and ensures audio stops automatically when the component unmounts (exiting interpretation mode).

## [Delivery Doc] 2026-05-06: Fix History Module, TTS Transcript, and Audio Player Execution
- Updated `App.tsx` and `InterpretationSection.tsx` to handle loading and rendering previously saved interpretation and written exams.
- Added a "Play Audio" button to the header of the interpretation result panel for '口译综合能力', allowing the user to listen to the complete original transcript.
- Refactored the TTS player in `InterpretationSection.tsx` to use an embedded sticky `<audio>` tag with `controls`. This gives the user pause and progress capabilities and automatically halts playback when navigating away.

## [Dev Spec] 2026-05-06: Preserve User Text and TTS Cache
### 1. Show User Text in History Preview
- In `App.tsx` and `HistorySection.tsx`, update the history preview logic for "Written" exams to prioritize showing `user_translation` instead of just `source_text`, allowing users to see their provided translation.

### 2. Cache TTS Conversions
- In `InterpretationSection.tsx`, introduce a `ttsCache` dictionary to map string IDs to their base64 audio data.
- Update `handlePlayTTS` to check the cache before calling the API. If cached, use it immediately; otherwise, fetch and update the cache.
- Update `handleSaveToHistory` to include the `ttsCache` in the saved `content` payload.
- Update `App.tsx` (where `onLoadRecord` parses the JSON) and `InterpretationSection.tsx`'s `useEffect` to restore the `ttsCache` from `initialRecord` when a history record is loaded, completely eliminating redundant API requests.

## [Delivery Doc] 2026-05-06: Preserve User Text and TTS Cache Execution
- Refactored the preview snippets in `App.tsx` and `HistorySection.tsx` to prioritize displaying `user_translation` for Written records, preserving the user's provided text in the UI history.
- Introduced `ttsCache` in `InterpretationSection.tsx` to map generated text IDs to their base64 audio payload.
- Ensured `ttsCache` state bypasses the API call if the audio already exists.
- Packaged `ttsCache` with the history payload during `saveExamRecord` and parsed it correctly upon `onLoadRecord` in `App.tsx` to persist TTS audio completely locally per exam.

## [Dev Spec] 2026-05-06: Collapsible Transcript Sidebar for Interpretation
### 1. Collapse Transcript in Exam Mode
- Add `isSidebarOpen` state to `InterpretationSection.tsx`.
- Default to collapsing the left sidebar (`w-24`) when `result` is generated or when a history record is loaded.
- Provide a `ChevronLeft`/`ChevronRight` toggle button to expand/collapse.
- When collapsed, hide the `textarea` and render only a central "Play Full Audio" button (to fulfill the requirement "默认情况下应该向左侧隐藏，只露出tts语音播放按键").
- Ensure the right-side panel expands (`flex-1`) when the left is collapsed.
- Move the "Play Audio" button out of the right panel header and integrate it consistently into both the expanded and collapsed states of the left panel.

## [Dev Spec] 2026-05-06: Fix TTS Transcript Playback and Floating Button Position
### 1. Fix TTS 500 Error for Long Transcripts
- The Xiaomi MiMo TTS API throws a 500 error for large text inputs.
- Refactor `tts_service.py`'s `generate_tts` to segment `request.text` into chunks (max 200 characters), splitting gracefully by punctuation.
- For each chunk, call the TTS API, decode the base64 WAV string, and extract raw audio bytes.
- Concatenate the audio frames using Python's built-in `wave` module, then encode the merged payload back to a single base64 string for the frontend.

### 2. Relocate Collapsed Play Button to Screen Edge
- The user requested the hidden transcript's Play Audio button to always center vertically on the absolute left edge of the screen.
- Update `InterpretationSection.tsx` to use `fixed left-0 top-1/2 -translate-y-1/2 z-50` for the collapsed floating button group, detaching it from the flex container.

## [Dev Spec] 2026-05-06: Interactive Exams and Chunk Grading
### 1. Interactive True/False & Multiple Choice
- Update `renderTrueFalse` and `renderMultipleChoice` to use an `answers` state dictionary.
- In `taking` state, allow users to click options (which updates the `answers` state). Highlight the selected option in blue.
- In `results` state, disable clicking. Highlight the correct answer in green, and if the user's selected answer is incorrect, highlight it in red. Unselected incorrect options become faded.

### 2. Interactive Semantic Chunks (口译实务)
- Update `renderChunks` to display a `<textarea>` below the chunk's play button when `examState === 'taking'`, allowing the user to type their translation.
- When `examState === 'results'`, display both the user's provided translation and the original source text side-by-side (stacked) for self-grading.
- Ensure `answers` dictionary maps chunk IDs to the typed text.
- Since `answers` state is already persisted to `ttsCache` in `saveExamRecord`, history records will perfectly preserve user translations for Interpretation modes as well.

## [Delivery Doc] 2026-05-06: Interactive Exams and Chunk Grading Execution
- Modified `InterpretationSection.tsx` to include `answers` state.
- True/False and Multiple Choice questions are fully interactive during the exam phase and provide visual green/red feedback during the results phase.
- Semantic chunks in Practice mode now feature an input text area. After submission, the user's text and the original chunk text are displayed cleanly together.
- The `answers` payload is saved to the SQLite DB, meaning history records accurately reproduce the interactive selections and text inputs.

## [Delivery Doc] 2026-05-06: TRAE SOLO Challenge Post
- Generated the TRAE IDE SOLO Challenge registration post based on the rules and examples provided.
- Saved the output to `d:\开发\BaiduSyncdisk\开发\catti助考助手\trae挑战赛报名\SOLO挑战赛报名帖.md`.

## [Dev Spec] 2026-05-06: Create Backup and Dev Environments
### 1. Folder Creation & Copy
- Create two new directories in the project root: catti_backup (���ֱ���) and catti_dev (������).
- Use obocopy to mirror the entire current project into both folders, preserving all files and dependencies (excluding the new folders themselves to avoid recursion).
### 2. Git Initialization
- Generate a root .gitignore in both new folders to ignore heavy/ephemeral files (
ode_modules, env, __pycache__, dist, .pytest_cache, .env, catti_history.db).
- Initialize a new git repository (git init) in each folder.
- Stage and commit the copied files with an initial commit message to establish a clean baseline.
