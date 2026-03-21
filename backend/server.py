from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(
    title="LexiSense API",
    description="Enterprise AI-powered Contract Lifecycle Management",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import and initialize routes
from routes.auth import router as auth_router, init_db as init_auth_db
from routes.contracts import router as contracts_router, init_db as init_contracts_db
from routes.team import router as team_router, init_db as init_team_db
from routes.dashboard import router as dashboard_router, init_db as init_dashboard_db
from routes.alerts import router as alerts_router, init_db as init_alerts_db

# Initialize database for all route modules
init_auth_db(db)
init_contracts_db(db)
init_team_db(db)
init_dashboard_db(db)
init_alerts_db(db)

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(contracts_router)
api_router.include_router(team_router)
api_router.include_router(dashboard_router)
api_router.include_router(alerts_router)

# Health check endpoint
@api_router.get("/health")
async def health_check():
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "1.0.0"
    }

@api_router.get("/")
async def root():
    return {"message": "LexiSense API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("LexiSense API starting up...")
    # Create indexes for better query performance
    await db.users.create_index("email", unique=True)
    await db.users.create_index("organizationId")
    await db.contracts.create_index("organizationId")
    await db.contracts.create_index([("organizationId", 1), ("createdAt", -1)])
    await db.contracts.create_index([("organizationId", 1), ("expiryDate", 1)])
    await db.invitations.create_index("token", unique=True)
    await db.invitations.create_index([("organizationId", 1), ("email", 1)])
    await db.contract_versions.create_index([("contractId", 1), ("version", -1)])
    await db.expiration_alerts.create_index([("contractId", 1), ("daysBeforeExpiry", 1)])
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
