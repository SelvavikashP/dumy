from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import (
    auth, admin, assessments, questions, coding,
    ai, platforms, attenders, attempts, proctoring,
    monitoring, results, reattempts
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    await init_db()
    try:
        from seed_data import seed
        await seed()
    except Exception as e:
        print(f"[!] Auto-seed check: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)
app.include_router(assessments.router, prefix=api_v1)
app.include_router(questions.router, prefix=api_v1)
app.include_router(coding.router, prefix=api_v1)
app.include_router(ai.router, prefix=api_v1)
app.include_router(platforms.router, prefix=api_v1)
app.include_router(attenders.router, prefix=api_v1)
app.include_router(attempts.router, prefix=api_v1)
app.include_router(proctoring.router, prefix=api_v1)
app.include_router(monitoring.router, prefix=api_v1)
app.include_router(results.router, prefix=api_v1)
app.include_router(reattempts.router, prefix=api_v1)

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
