"""
Database seed script — populates the predictions table with 20+ realistic records.

Uses SQLAlchemy Core bulk insert for efficiency.
Records span diverse crops, diseases, severity levels, and date ranges
to produce meaningful analytics dashboard visualizations on first launch.
"""

import asyncio
import uuid
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import insert, select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.config import get_settings
from app.core.database import Base
from app.models.prediction import Prediction

logger = logging.getLogger(__name__)

# 25 diverse seed records covering multiple crops, diseases, and time ranges
SEED_DATA = [
    {
        "id": uuid.uuid4(),
        "crop_type": "Wheat",
        "image_filename": "seed_wheat_01.jpg",
        "farmer_notes": "Yellow streaks appearing on lower leaves, spreading upward.",
        "predicted_disease": "Yellow Rust",
        "confidence": 0.92,
        "severity": "Medium",
        "recommendation": "Apply propiconazole fungicide at 0.1% concentration. Monitor field edges.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=0, hours=2),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Wheat",
        "image_filename": "seed_wheat_02.jpg",
        "farmer_notes": "Brown patches on leaf tips after recent rain.",
        "predicted_disease": "Leaf Blight",
        "confidence": 0.87,
        "severity": "High",
        "recommendation": "Remove infected debris. Apply mancozeb 75% WP at 2.5g/L.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=5),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Rice",
        "image_filename": "seed_rice_01.jpg",
        "farmer_notes": "Diamond-shaped lesions on leaves with grey centers.",
        "predicted_disease": "Blast",
        "confidence": 0.94,
        "severity": "High",
        "recommendation": "Apply tricyclazole 75% WP at 0.6g/L. Reduce nitrogen fertilization.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=0, hours=8),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Rice",
        "image_filename": "seed_rice_02.jpg",
        "farmer_notes": "Circular brown spots scattered across leaves.",
        "predicted_disease": "Brown Spot",
        "confidence": 0.85,
        "severity": "Medium",
        "recommendation": "Treat seeds with carbendazim. Apply potassium fertilizer.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2, hours=3),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Rice",
        "image_filename": "seed_rice_03.jpg",
        "farmer_notes": "Leaves turning yellow from the tips.",
        "predicted_disease": "Bacterial Leaf Blight",
        "confidence": 0.89,
        "severity": "High",
        "recommendation": "Use resistant varieties. Apply streptocycline at 500ppm.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=3, hours=1),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Tomato",
        "image_filename": "seed_tomato_01.jpg",
        "farmer_notes": "Dark concentric rings on lower leaves.",
        "predicted_disease": "Early Blight",
        "confidence": 0.91,
        "severity": "Medium",
        "recommendation": "Apply chlorothalonil fungicide. Ensure proper plant spacing.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=12),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Tomato",
        "image_filename": "seed_tomato_02.jpg",
        "farmer_notes": "Water-soaked lesions appearing rapidly after rain.",
        "predicted_disease": "Late Blight",
        "confidence": 0.89,
        "severity": "High",
        "recommendation": "Remove affected plants immediately. Apply metalaxyl + mancozeb spray.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=0, hours=6),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Tomato",
        "image_filename": "seed_tomato_03.jpg",
        "farmer_notes": "White powdery coating on leaves.",
        "predicted_disease": "Powdery Mildew",
        "confidence": 0.86,
        "severity": "Low",
        "recommendation": "Apply sulfur-based fungicide. Improve air circulation.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=4, hours=9),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Corn",
        "image_filename": "seed_corn_01.jpg",
        "farmer_notes": "Long grey-green lesions on leaves.",
        "predicted_disease": "Northern Leaf Blight",
        "confidence": 0.88,
        "severity": "Medium",
        "recommendation": "Plant resistant hybrids. Apply strobilurin fungicide.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2, hours=7),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Corn",
        "image_filename": "seed_corn_02.jpg",
        "farmer_notes": "Rectangular grey spots between leaf veins.",
        "predicted_disease": "Gray Leaf Spot",
        "confidence": 0.83,
        "severity": "Low",
        "recommendation": "Practice crop rotation. Reduce tillage to minimize spore dispersal.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5, hours=4),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Potato",
        "image_filename": "seed_potato_01.jpg",
        "farmer_notes": "Dark water-soaked areas on leaves, spreading fast.",
        "predicted_disease": "Late Blight",
        "confidence": 0.93,
        "severity": "High",
        "recommendation": "Apply mancozeb preventively. Destroy infected tubers.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=3),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Potato",
        "image_filename": "seed_potato_02.jpg",
        "farmer_notes": "Rough, corky patches on tuber skin.",
        "predicted_disease": "Common Scab",
        "confidence": 0.81,
        "severity": "Low",
        "recommendation": "Maintain soil pH below 5.5. Use certified disease-free seed potatoes.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=6, hours=2),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Cotton",
        "image_filename": "seed_cotton_01.jpg",
        "farmer_notes": "Angular water-soaked spots on leaves.",
        "predicted_disease": "Bacterial Blight",
        "confidence": 0.90,
        "severity": "High",
        "recommendation": "Use acid-delinted treated seeds. Apply streptomycin sulfate spray.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=3, hours=8),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Cotton",
        "image_filename": "seed_cotton_02.jpg",
        "farmer_notes": "Leaves curling upward with whitefly infestation.",
        "predicted_disease": "Cotton Leaf Curl Virus",
        "confidence": 0.87,
        "severity": "High",
        "recommendation": "Control whitefly population with imidacloprid. Remove infected plants.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=0, hours=4),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Sugarcane",
        "image_filename": "seed_sugarcane_01.jpg",
        "farmer_notes": "Red discoloration inside the cane when split.",
        "predicted_disease": "Red Rot",
        "confidence": 0.88,
        "severity": "High",
        "recommendation": "Use disease-free setts. Treat with carbendazim 0.1% for 15 minutes.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=4, hours=6),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Soybean",
        "image_filename": "seed_soybean_01.jpg",
        "farmer_notes": "Small rusty pustules on undersides of leaves.",
        "predicted_disease": "Rust",
        "confidence": 0.91,
        "severity": "Medium",
        "recommendation": "Apply triazole fungicide at first signs. Scout during flowering.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2, hours=11),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Soybean",
        "image_filename": "seed_soybean_02.jpg",
        "farmer_notes": "Leaves appear healthy but yellowing at edges.",
        "predicted_disease": "Cercospora Leaf Blight",
        "confidence": 0.79,
        "severity": "Low",
        "recommendation": "Apply copper-based fungicide. Ensure adequate drainage.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5, hours=10),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Wheat",
        "image_filename": "seed_wheat_03.jpg",
        "farmer_notes": "Orange-brown powdery spots on stems and leaves.",
        "predicted_disease": "Stem Rust",
        "confidence": 0.95,
        "severity": "High",
        "recommendation": "Plant rust-resistant varieties. Apply tebuconazole at onset.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=9),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Rice",
        "image_filename": "seed_rice_04.jpg",
        "farmer_notes": "Plants looking healthy after treatment.",
        "predicted_disease": "Healthy",
        "confidence": 0.96,
        "severity": "Low",
        "recommendation": "Continue current agricultural practices. Monitor regularly.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=0, hours=1),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Tomato",
        "image_filename": "seed_tomato_04.jpg",
        "farmer_notes": "Leaves wilting despite adequate watering.",
        "predicted_disease": "Fusarium Wilt",
        "confidence": 0.84,
        "severity": "High",
        "recommendation": "Remove infected plants. Solarize soil before next planting.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=3, hours=5),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Corn",
        "image_filename": "seed_corn_03.jpg",
        "farmer_notes": "Small reddish-brown pustules on leaf surfaces.",
        "predicted_disease": "Common Rust",
        "confidence": 0.86,
        "severity": "Medium",
        "recommendation": "Apply mancozeb or triazole fungicide. Plant resistant varieties.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=1, hours=7),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Potato",
        "image_filename": "seed_potato_03.jpg",
        "farmer_notes": "Dark sunken spots on tubers at harvest.",
        "predicted_disease": "Black Scurf",
        "confidence": 0.82,
        "severity": "Medium",
        "recommendation": "Treat seed tubers with pencycuron. Practice crop rotation.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=6, hours=5),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Wheat",
        "image_filename": "seed_wheat_04.jpg",
        "farmer_notes": "White powdery growth on upper leaf surfaces.",
        "predicted_disease": "Powdery Mildew",
        "confidence": 0.90,
        "severity": "Medium",
        "recommendation": "Apply sulfur-based fungicide at 3g/L. Avoid dense planting.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=4, hours=3),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Cotton",
        "image_filename": "seed_cotton_03.jpg",
        "farmer_notes": "Small brown spots with yellow halos.",
        "predicted_disease": "Alternaria Leaf Spot",
        "confidence": 0.83,
        "severity": "Low",
        "recommendation": "Apply mancozeb spray. Remove lower infected leaves.",
        "ai_provider": "mock",
        "created_at": datetime.now(timezone.utc) - timedelta(days=2, hours=6),
    },
    {
        "id": uuid.uuid4(),
        "crop_type": "Sugarcane",
        "image_filename": "seed_sugarcane_02.jpg",
        "farmer_notes": "White pencil-line streaks along leaf blade.",
        "predicted_disease": "Smut",
        "confidence": 0.88,
        "severity": "Medium",
        "recommendation": "Rogue out infected clumps. Use disease-free seed material.",
        "ai_provider": "gemini",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5, hours=2),
    },
]


async def seed_database():
    """
    Insert seed records into the predictions table.

    Uses bulk insert for efficiency. Checks if data already exists
    to prevent duplicate seeding on container restarts.
    """
    settings = get_settings()
    db_url = settings.DATABASE_URL
    # Auto-upgrade dialect to asyncpg if standard postgresql is provided
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    connect_args = {}
    if "sslmode=" in db_url:
        if "?" in db_url:
            base_url, query = db_url.split("?", 1)
            params = query.split("&")
            filtered_params = [p for p in params if not p.startswith("sslmode=")]
            if filtered_params:
                db_url = f"{base_url}?{'&'.join(filtered_params)}"
            else:
                db_url = base_url
        connect_args["ssl"] = True

    engine = create_async_engine(db_url, connect_args=connect_args)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        # Check if data already exists
        result = await session.execute(select(func.count(Prediction.id)))
        count = result.scalar() or 0

        if count >= 20:
            logger.info(f"Database already has {count} records. Skipping seed.")
            return

        logger.info(f"Seeding database with {len(SEED_DATA)} records...")

        # Bulk insert using SQLAlchemy Core for efficiency
        await session.execute(insert(Prediction), SEED_DATA)
        await session.commit()

        logger.info(f"Successfully seeded {len(SEED_DATA)} prediction records.")

    await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_database())
