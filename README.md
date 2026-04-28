# 🎙️ AI Mock Interviewer — Voice Agent

A real-time, low-latency AI voice agent that conducts mock technical phone screen interviews. Alex (the AI recruiter) transcribes your speech, thinks using a Large Language Model (Groq), and responds with a natural-sounding voice.

Built with **FastAPI + WebSockets** for real-time audio streaming, **Faster-Whisper** for Speech-to-Text, **Groq (Llama 3)** for the brain, and **Edge-TTS** for realistic Text-to-Speech.

---

## ✨ Features

- **Real-Time Conversation:** Stream audio both ways using WebSockets.
- **Multilingual Support:** Alex understands and speaks both **English** and **Hindi**.
- **Natural Interruptions:** You can interrupt Alex at any time, just like a real phone call.
- **VAD (Voice Activity Detection):** Automatically detects when you start and stop speaking.
- **High Performance:** Designed to run on standard CPUs using `int8` quantization for Whisper.
- **Free to Run:** Uses free-tier APIs (Groq) and local open-source models.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Backend** | FastAPI + WebSockets |
| **Speech-to-Text** | [Faster-Whisper](https://github.com/SYSTRAN/faster-whisper) (Running locally) |
| **LLM Brain** | [Groq API](https://groq.com/) (Llama 3.1 8B) |
| **Text-to-Speech** | [Edge-TTS](https://github.com/rany2/edge-tts) (Microsoft Neural Voices) |
| **Frontend** | Vanilla HTML / CSS / JavaScript |
| **Deployment** | Docker |

---

## 🚀 Local Quick Start

### 1. Prerequisites
- Python 3.10+
- `ffmpeg` installed on your system.
- A free Groq API key from [console.groq.com](https://console.groq.com).

### 2. Installation
```bash
git clone <your-repo-url>
cd "AI voice agent"
pip install -r requirements.txt
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the App
```bash
uvicorn app.main:app --reload
```
Open [http://13.239.114.191:8000](http://13.239.114.191:8000) in your browser.

---

## ☁️ Deployment (AWS EC2)

This project is Dockerized and ready for cloud deployment.

### 1. Launch EC2
- Use **Ubuntu 22.04 LTS**.
- Recommended size: **`t3.small`** or **`t3.medium`** (requires at least 2GB RAM).
- Open Ports: **22** (SSH) and **8000** (Custom TCP).

### 2. Docker Deployment
Once inside your server:
```bash
# Install Docker
sudo apt-get update && sudo apt-get install -y docker.io

# Build and Run
sudo docker build -t ai-voice-agent .
sudo docker run -d --name voice-agent -p 8000:8000 --env-file .env ai-voice-agent
```

> **Note:** For detailed step-by-step AWS instructions, see [EC2_Deployment_Guide.md](./EC2_Deployment_Guide.md).

---

## 📖 How to Use

1. Click **Start Interview**.
2. Wait for Alex to introduce himself.
3. Simply start speaking. You don't need to click anything while talking.
4. Alex will automatically detect when you finish and respond.
5. If Alex is talking too much, click **Interrupt Alex** to jump in!

---

## 🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

## 📄 License
This project is licensed under the MIT License.
