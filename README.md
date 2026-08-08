<div align="center">

# 🧠 EvalAI Pro — Enterprise Proctored Assessment Platform

**Next-Generation AI-Powered Recruitment Assessment, Multi-Language Code Judge Sandbox & Ethical Proctoring Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Async-003B57.svg?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://python.org)

</div>

---

## 🌟 Key Highlights & Capabilities

### 1. 🛡️ Real-Time Proctoring Sentinel
- **Face Presence & Direction Tracking**: Real-time verification of candidate focus within the test window.
- **Full-Screen Enforcement**: Instant warnings and violation telemetry upon window exit or dev-tool opening.
- **Tab Switch & Activity Detection**: Zero-trust blur and visibility listeners logging every navigation attempt.
- **Configurable Risk Thresholds**: Automated session suspension after reaching maximum warning limits with recruiter reattempt workflows.

### 2. ⚡ Multi-Language Code Judge Sandbox
- **Supported Languages**: Python 3, JavaScript (Node.js), TypeScript, C++, C, Java, Go, Rust.
- **Isolated Execution**: Subprocess sandboxing with wall-clock time limit, CPU limit, and memory quotas.
- **Test Case Engine**: Evaluates both public sample test cases and hidden evaluation suites with points weighting.

### 3. 🤖 AI Assessment Studio
- **Automated Generation**: Generate structured multi-tier questions across Quantitative Aptitude, Logical Reasoning, Verbal, Domain MCQs, and Coding problems.
- **AI Validator**: Verifies question correctness, solution code, test case inputs, and expected outputs before publishing.

### 4. 👥 3-Tier Granular RBAC Architecture
- **Portal Admin**: Platform governance, recruiter team provisioning, external platform adapters (LeetCode, HackerRank, Codeforces), and immutable audit logs.
- **Test Creator (Recruiter)**: Exam blueprint builder, question banks, AI generators, and live proctoring surveillance.
- **Candidate (Attender)**: Proctored assessment suite, Monaco code editor, test case runner, and comprehensive post-exam scorecard.

---

## 🏗️ Architecture & Tech Stack

```
assessment-portal/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Modular API routers (auth, admin, assessments, coding, proctoring, etc.)
│   │   ├── core/            # Config, async database session, JWT auth & security
│   │   ├── models/          # SQLAlchemy async ORM models (RBAC, Exams, Violations, Scorecards)
│   │   ├── schemas/         # Pydantic validation & response schemas
│   │   ├── services/        # Code judge sandbox, proctoring engine, scoring, AI generator
│   │   └── main.py          # FastAPI application entry point & CORS
│   ├── tests/               # Pytest async test suite (Auth, Code Judge, Proctoring)
│   ├── seed_data.py         # Database seeding script with realistic demo records
│   └── requirements.txt     # Python backend dependencies
└── frontend/
    ├── src/
    │   ├── components/      # Reusable UI (MonacoCodeEditor, ProctoringSentinel, Navbar, Sidebar)
    │   ├── context/         # AuthContext with token refresh and role routing
    │   ├── pages/           # Admin Center, Recruiter Studio, Candidate Room, Assessment Builder
    │   ├── services/        # Axios/Fetch API client abstractions
    │   └── types.ts         # Central TypeScript interfaces
    ├── index.html           # HTML5 Entry
    ├── tailwind.config.js   # Custom dark theme & glassmorphic design system
    ├── tsconfig.json        # Strict TypeScript configuration
    └── vite.config.ts       # Vite bundler & API proxy configuration
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+
- **npm** or **yarn**

### 1. Backend Setup & Startup
```bash
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* API Documentation: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
* Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
* Web Portal: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Portal Admin** | `admin@assessmentportal.io` | `Admin@12345` |
| **Test Creator (Recruiter)** | `recruiter@techcorp.com` | `Creator@12345` |
| **Candidate (Attender)** | `candidate@example.com` | `Candidate@12345` |

---

## 🧪 Running Automated Tests

```bash
cd backend
pytest
```

---

## 📄 License
This project is licensed under the MIT License.
