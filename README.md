# NoteFlow_edge_pro

Upload meeting transcripts or audio, ask questions about them, and get summaries — powered by Whisper, OpenAI embeddings, and GPT-4.

Built: **March 2025**

## What it does

1. You give it a meeting (text file or audio).
2. Whisper transcribes audio if needed.
3. The text gets split into chunks and stored in PostgreSQL (with pgvector for search).
4. You can chat with your meetings or generate a structured summary.

## What you need installed

- Python 3.10+
- Node.js (for the web UI)
- A PostgreSQL database with [pgvector](https://github.com/pgvector/pgvector) — Neon or Supabase work fine and don't need Docker
- [FFmpeg](https://ffmpeg.org/download.html) (for audio)
- An OpenAI API key

## First-time setup

```bash
cd noteflow-edge-pro-link
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -e .
cp .env.example .env
```

Open `.env` and set:

- `OPENAI_API_KEY` — your OpenAI key
- `DATABASE_URL` — your Postgres connection string

**Getting a database (pick one):**

- **Easiest:** sign up at [Neon](https://neon.tech) or [Supabase](https://supabase.com), create a project, copy the connection string into `DATABASE_URL`.
- **Local:** install Postgres + pgvector yourself, or run `docker compose up -d` if you use Docker.

Then create the tables:

```bash
noteflow db-init
```

Install frontend dependencies once:

```bash
cd frontend
npm install
cd ..
```

## How to run the app

The app has two parts: a **Python backend** (does the AI work) and a **React frontend** (the UI). For day-to-day development, run both in separate terminals.

### Terminal 1 — start the backend

```powershell
cd noteflow-edge-pro-link
.venv\Scripts\activate
noteflow serve --port 8000
```

Leave this running. You should see something like `Uvicorn running on http://0.0.0.0:8000`.

If something's wrong with the database, this is where you'll see the error.

### Terminal 2 — start the frontend

```powershell
cd noteflow-edge-pro-link\frontend
npm run dev
```

Open whatever URL it prints — usually **http://localhost:5173**. (If that port is taken, it'll use 5174, 5175, etc.)

The top-right badge should say **API Online**. If it says **API Offline**, go back to Terminal 1 — the backend probably isn't running, or `DATABASE_URL` in `.env` is incorrect.

**Quick recap:**

| What | Where |
|------|--------|
| Backend | http://localhost:8000 |
| Frontend (use this in the browser) | http://localhost:5173 |

### Alternative: one port only

If you don't need hot reload, build the UI and let the backend serve everything:

```bash
cd frontend && npm run build && cd ..
noteflow serve --port 8000
```

Then just open **http://localhost:8000**.

## Using the web UI

- **Assistant** — chat about your meetings; use the paperclip in the input bar to upload a transcript or audio file
- **Summary** — pick a meeting in the sidebar and generate a GPT-4 summary
- Toggle **All** vs **Selected** to search every meeting or just the one you picked

## Try it from the command line

```bash
# Load sample meetings and run a test query
python backend/run_demo_script.py

# Add a transcript
noteflow ingest backend/product_sync_march_2025_sample.txt

# Add audio
noteflow ingest meeting.mp3 --title "Q1 Planning"

# Ask a question
noteflow ask "What were the key decisions?"

# Generate a summary
noteflow summarize product_sync_march_2025

# See what's in the database
noteflow stats
```

## API (if you're integrating)

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/health` | Is the server up? |
| GET | `/transcripts` | List meetings |
| POST | `/ingest/text` | Add a text transcript |
| POST | `/ingest/audio` | Upload audio |
| POST | `/summarize/{id}` | Generate summary |
| POST | `/query` | Ask a RAG question |

Example:

```bash
curl -X POST http://localhost:8000/ingest/text \
  -H "Content-Type: application/json" \
  -d '{"id": "demo", "title": "Demo", "text": "We decided to ship MVP by May 1."}'

curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "When is the MVP shipping?"}'
```

## Config (.env)

| Variable | What it's for |
|----------|----------------|
| `OPENAI_API_KEY` | OpenAI API access |
| `DATABASE_URL` | Postgres connection string |
| `GPT_MODEL` | Model for chat and summaries (default `gpt-4`) |
| `EMBEDDING_MODEL` | Model for search vectors (default `text-embedding-3-small`) |
| `WHISPER_MODEL` | Local speech-to-text model (default `base`) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | How text is split for search (512 / 64) |

## Old JSON data?

If you used an earlier version that saved files in `./data/transcripts/`:

```bash
python backend/migrate_legacy_data_script.py --reindex
```

## Project layout

Two folders — `backend/` and `frontend/` — each with flat source files (no nested code folders). File suffixes show what each file belongs to.

```
noteflow-edge-pro-link/
├── backend/
│   ├── api_backend.py              # FastAPI REST API
│   ├── cli_backend.py              # CLI entry point
│   ├── pipeline_backend.py         # Main pipeline
│   ├── config_backend.py           # Settings
│   ├── models_backend.py           # Data models
│   ├── store_db.py                 # PostgreSQL + pgvector
│   ├── schema_db.py                # Database schema
│   ├── chunker_chunking.py         # Text chunking
│   ├── service_rag.py              # RAG + GPT-4
│   ├── service_embeddings.py       # Embeddings
│   ├── whisper_transcriber_transcription.py
│   ├── run_demo_script.py
│   ├── migrate_legacy_data_script.py
│   └── *_sample.txt                # Example transcripts
├── frontend/
│   ├── App_frontend.tsx
│   ├── main_frontend.tsx
│   ├── ChatPanel_component.tsx
│   ├── client_api.ts
│   └── ...                         # other flat UI files
├── pyproject.toml
├── requirements.txt
└── docker-compose.yml
```

## License

MIT
