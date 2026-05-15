# CATTI Exam / Foreign Language Translation Training Assistant

[中文版](README.md) | [English](README_en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

The CATTI Exam / Foreign Language Translation Training Assistant is a smart full-stack Web application specifically designed for candidates of the China Accreditation Test for Translators and Interpreters (CATTI) and professionals in the translation industry. Leveraging cutting-edge LLM (Large Language Model) and TTS (Text-to-Speech) technologies, it perfectly addresses two core pain points in translation preparation and learning: **expensive manual grading** and the **lack of realistic interpretation simulations**.

## ✨ Core Features

### 1. 📝 Written Translation Smart Grading
- **Immersive Dual-Column Input**: Supports side-by-side input of source text and translation, featuring a built-in focus countdown hourglass.
- **AI In-depth Grading**: After submission, the AI automatically compares the source text with your translation, generating detailed scoring and improvement suggestions at the "vocabulary" and "syntax" levels.
- **Custom Models**: Supports configuring and integrating various large language models (such as DeepSeek) as the smart grading engine.

### 2. 🎧 Interpretation Realistic Simulation
Instantly converts any piece of Chinese/English text into a practical interpretation exam paper with audio.
- **Comprehensive Ability**:
  - Automatically generates highly deceptive true/false and multiple-choice questions (using techniques like phonetic confusion, time/space inversion, etc.).
  - Automatically extracts 5 key scoring points for summary questions.
  - **Interactive Grading**: Click options to answer. After submission, it visually displays red/green right/wrong highlight feedback, along with detailed explanations.
- **Practice Ability**:
  - **Intelligent Semantic Chunking**: The AI automatically chunks long texts into audio paragraphs suitable for memory, based on the pausing habits of professional interpreters.
  - **Hidden Anti-cheating Design**: The source text is automatically folded and hidden during the exam. Only a play button is suspended in the center of the screen, eliminating "sight translation" cheating.
  - **Self-test Comparison**: You can directly input your translation under each chunk, and compare it with the source text up and down after submission for an efficient review.

### 3. 💾 Smart History Archive
- **No Records Lost**: All exam records, user-filled translations, and interactive answer options are fully saved in the database (SQLite).
- **Zero-latency Review**: Features an original TTS voice caching mechanism. Historically generated recordings are saved along with the exam paper in Base64 format. When viewing again, they can be played directly locally without repeatedly consuming API quotas or waiting time.

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite + Lucide Icons
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **AI Engine Integration**:
  - Text Processing & Question Generation: Supports DeepSeek and other LLM APIs.
  - Speech Synthesis: Integrates Xiaomi MiMo TTS, utilizing the underlying Python `wave` module to achieve seamless slicing and audio frame concatenation for ultra-long texts.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Clone the Project
```bash
git clone https://github.com/ZiXu000/CATTI-Exam-Foreign-Language-Translation-Training-Assistant.git
cd CATTI-Exam-Foreign-Language-Translation-Training-Assistant
```

### 2. Start the Backend Service
Navigate to the `catti_grader` directory, install dependencies, and start the FastAPI service:
```bash
cd catti_grader
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt
python main.py
```
*The backend service will run on `http://localhost:8000` by default.*

### 3. Start the Frontend Service
Open another terminal, navigate to the `catti_frontend` directory, install dependencies, and start the Vite service:
```bash
cd catti_frontend
npm install
npm run dev
```
*The frontend service usually runs on `http://localhost:5173`.*

### 4. One-Click Start (Windows Only)
If you are using Windows, you can directly double-click the `start.bat` file in the root directory. It will automatically install dependencies and start both frontend and backend services for you.

## ⚙️ Configuration Guide

When using the translation or interpretation generation features for the first time, you need to click the **Settings icon** in the top right corner of the page:
1. Select your preferred model provider (e.g., DeepSeek or MiMo).
2. Enter the corresponding API Key.
*(The API Key is securely saved in your browser's LocalStorage and will not be uploaded to any third-party servers.)*

## 📄 License

This project is open-sourced under the [MIT License](LICENSE). Anyone is welcome to Fork, modify, or use it for learning and communication.

---
Developed with 💖 by ZiXu 子旭 
