# MongoDB Integration & Interview Report Generation Plan

This plan outlines the steps to integrate MongoDB for storing user interview history and to generate an AI evaluation report at the end of the interview.

## User Review Required

> [!IMPORTANT]
> **Database Choice & Setup:** You requested MongoDB for storing history. To implement this, we'll need a MongoDB connection string.
> - Do you have a MongoDB Atlas cluster ready, or are you running MongoDB locally?
> - *If you don't have MongoDB ready yet*, would you prefer we use a lightweight local alternative (like SQLite) for now, or proceed with MongoDB and you will provide the `MONGO_URI` in your `.env` file?

## Open Questions

> [!WARNING]
> **RAG Clarification:** You mentioned adding "RAG" by taking user history and displaying a report.
> - Typically, RAG (Retrieval-Augmented Generation) implies using *past* data to inform *current* answers.
> - In this context, it sounds like you want to use the *current interview's history* to **generate an evaluation report** at the end. Is this correct? Or do you also want the AI to remember the candidate's previous interview sessions during a new interview?
> - For now, the plan assumes **Session-Based Report Generation** (evaluating the current interview).

## Proposed Changes

### Database Layer
- Install `motor` (async MongoDB driver for Python).
- Create a database configuration and client in `app/core/db.py` to handle connections.

### Backend Updates
#### [MODIFY] `app/api/websocket_endpoint.py`
- Generate a unique `session_id` when a WebSocket connection starts.
- Save each conversational turn (both candidate and recruiter) to MongoDB.

#### [MODIFY] `app/services/llm_service.py`
- Add a new function `generate_interview_report(session_id)` that retrieves the chat history from MongoDB and uses Groq to generate a structured evaluation (e.g., Strengths, Weaknesses, Score out of 10).

#### [NEW] `app/api/report_endpoint.py`
- Create a new REST endpoint (e.g., `GET /api/report/{session_id}`) for the frontend to fetch the generated report when the interview ends.
- Wire this up in `app/main.py`.

### Frontend Updates
#### [MODIFY] `static/index.html` & Frontend Logic
- Update the WebSocket logic to receive the `session_id` upon connection.
- When "End Interview" is clicked, make an HTTP request to fetch the report.
- Add a beautiful, modern UI modal or panel to display the generated report to the user.

## Verification Plan

### Manual Verification
- Start a mock interview and have a short conversation.
- Click "End Interview".
- Verify that a report is dynamically generated, displayed nicely on the screen, and that the history/report are successfully stored in MongoDB.
