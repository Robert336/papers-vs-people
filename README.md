# Papers vs People

Compare what clinical studies say about a medication to what real people actually experience, side by side.

Enter a medication name and the app pulls academic sources and social/lived-experience sources via Exa, runs them through an LLM (via OpenRouter) to produce a per-aspect comparison matrix with alignment scores, citations, and an optional per-aspect deep dive.

## Stack

- **Backend:** FastAPI, SQLAlchemy (async) + SQLite, httpx
- **Frontend:** React 18 + Vite + TypeScript + Tailwind
- **External APIs:** OpenRouter (LLM), Exa (search)

## Run

Set keys in `backend/.env` (see `backend/.env.example`):

```
OPENROUTER_API_KEY=...
EXA_API_KEY=...
```

Then:

```
docker compose up --build
```

Frontend: <http://localhost:3000> · Backend health: `/api/health`

## Disclaimer

Informational only. Not medical advice.
