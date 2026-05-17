# CATTI考试/外语翻译培训助手 (CATTI Exam/Foreign Language Translation Training Assistant)

[中文版](README.md) | [English](README_en.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

CATTI考试/外语翻译培训助手是一款专为全国翻译专业资格（水平）考试（CATTI）备考者与翻译行业从业者打造的智能全栈 Web 应用。借助前沿的 LLM（大语言模型）与 TTS（文本转语音）技术，它完美解决了翻译备考与学习中**人工批改昂贵**和**口译全真模拟缺失**的两大核心痛点。

## ✨ 核心功能

### 1. 📝 笔译智能批改 (Written Translation Mode)
- **沉浸式双栏输入**：支持原文与译文的对照输入，内置专注倒计时沙漏。
- **AI 深度判卷**：提交后，AI 将自动比对原文与你的译文，生成细致到“词汇”和“句法”级别的评分与改进建议。

### 2. 📝 笔译综合能力 (Written Comprehensive Mode)
将任意三段中英文文本，瞬间转化为对应的笔译综合考卷。
- **词汇与语法**：根据提供的原文生成 60 道单项选择题，支持点击交互作答，交卷后高亮展示正确答案并提供详细解析。
- **阅读理解**：根据提供的原文生成阅读理解题（含多篇文章及问题），支持点击作答，自动判卷。
- **完形填空**：根据提供的原文生成完形填空题，挖空并提供 4 个选项，支持交互答题。
- **防作弊与自测**：考试时原文自动收起隐藏，交卷后自动计算总分并呈现错题解析。

### 3. 🎧 口译全真模拟 (Interpretation Mode)
将任意段落中英文文本，瞬间转化为带有语音的口译实战考卷。
- **口译综合能力 (Comprehensive Ability)**：
  - 支持分别输入判断题、选择题、听力综述的听力原文。
  - 自动生成极具迷惑性的判断题、选择题（利用语音混淆、时空倒置等技巧）。
  - 自动提取摘要题的 5 大关键得分点。
  - **交互式判卷与分段听力**：点击选项作答，交卷后直观展示红绿对错高亮反馈，并附带详尽解析。每个题型标题栏配备独立的语音播放按钮，可分别播放对应部分的听力音频。
- **口译实务 (Practice Ability)**：
  - 智能意群切分（Semantic Chunking）：AI 根据专业译员的停顿习惯，将长文自动切分为适合记忆的音频段落。
  - 隐藏式防作弊设计：答题时原文自动收起隐藏，屏幕仅居中悬浮语音播放按钮，杜绝“视译”作弊。
  - **自测比对**：可在每个意群下方直接输入你的翻译，交卷后上下对照原文，实现高效复盘。

### 4. 💾 智能历史归档 (History Archive)
- **记录不丢失**：所有的考试记录、用户填写的译文、交互作答选项被完整落库保存（SQLite）。
- **零延迟复盘**：独创 TTS 语音缓存机制，历史生成的录音会以 Base64 形式伴随考卷一同保存，再次查看时直接本地播放，无需重复消耗 API 额度和等待时间。

## 🛠 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS + Vite + Lucide Icons
- **后端**：FastAPI + SQLAlchemy + SQLite
- **AI 引擎对接**：
  - 文本处理与出题：支持 DeepSeek 等大语言模型接口。
  - 语音合成：接入 Xiaomi MiMo TTS，并通过底层 Python `wave` 模块实现了超长文本的无缝切片与音频帧拼接。

## 🚀 快速开始

### 前置要求
- Node.js (v18+)
- Python (3.10+)

### 1. 克隆项目
```bash
git clone https://github.com/ZiXu000/CATTI-Exam-Foreign-Language-Translation-Training-Assistant .git
cd CATTI-Exam-Foreign-Language-Translation-Training-Assistant
```

### 2. 后端服务启动
进入 `catti_grader` 目录，安装依赖并启动 FastAPI 服务：
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
*后端服务将默认运行在 `http://localhost:8000`*

### 3. 前端服务启动
另开一个终端，进入 `catti_frontend` 目录，安装依赖并启动 Vite 服务：
```bash
cd catti_frontend
npm install
npm run dev
```
*前端服务通常运行在 `http://localhost:5173`*

### 4. 一键启动 (仅 Windows)
如果你在 Windows 环境下，可以直接双击根目录下的 `start.bat` 文件，它将自动为你安装依赖并同时启动前后端服务。

## ⚙️ 配置说明

在首次使用笔译或口译生成功能时，你需要点击页面右上角的**设置图标**：
1. 选择你偏好的模型提供商（如 DeepSeek 或 MiMo）。
2. 输入对应的 API Key。
*(API Key 会安全地保存在你浏览器的 LocalStorage 中，不会上传至任何第三方服务器)*

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。欢迎任何人 Fork、修改或用于学习交流。

---
Developed with 💖 by ZiXu 子旭 