"""
Translation endpoint — enables multilingual UI by translating dynamic text.
"""

import logging
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

class TranslationRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    target_language: str = Field(..., description="ISO 639-1 language code (e.g., hi, te, es)")

class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str

# Local fallback dictionary for offline/error scenarios (English to Hindi, Telugu, Marathi, Spanish)
FALLBACK_DICT = {
    "hi": {
        "Early Blight": "अगेती झुलसा (Early Blight)",
        "Late Blight": "पछेती झुलसा (Late Blight)",
        "Yellow Rust": "पीला रतुआ (Yellow Rust)",
        "Blast": "झोंका रोग (Blast)",
        "Brown Spot": "भूरा धब्बा (Brown Spot)",
        "Bacterial Leaf Blight": "जीवाणु झुलसा (Bacterial Leaf Blight)",
        "Powdery Mildew": "चूर्णिल आसिता (Powdery Mildew)",
        "Northern Leaf Blight": "उत्तरी पत्ता झुलसा (Northern Leaf Blight)",
        "Gray Leaf Spot": "सलेटी पत्ता धब्बा (Gray Leaf Spot)",
        "Common Scab": "सामान्य पपड़ी (Common Scab)",
        "Bacterial Blight": "जीवाणु जनित झुलसा (Bacterial Blight)",
        "Cotton Leaf Curl Virus": "कपास पर्ण कुंचन विषाणु (Cotton Leaf Curl Virus)",
        "Red Rot": "लाल सड़न रोग (Red Rot)",
        "Rust": "रतुआ रोग (Rust)",
        "Cercospora Leaf Blight": "सर्कोस्पोरा पत्ता झुलसा (Cercospora Leaf Blight)",
        "Stem Rust": "तना रतुआ (Stem Rust)",
        "Healthy": "स्वस्थ (Healthy)",
        "Fusarium Wilt": "फ्यूजेरियम म्लानि (Fusarium Wilt)",
        "Common Rust": "सामान्य रतुआ (Common Rust)",
        "Black Scurf": "काली रूसी (Black Scurf)",
        "Smut": "कंडुआ रोग (Smut)",
        "Pending Agronomist Review": "कृषि विज्ञानी समीक्षा लंबित है",
        "Pending review by our agricultural expert.": "हमारे कृषि विशेषज्ञ द्वारा समीक्षा की प्रतीक्षा की जा रही है।"
    },
    "te": {
        "Early Blight": "ఆకు మచ్చ తెగులు (Early Blight)",
        "Late Blight": "మలిదశ ఆకుమచ్చ తెగులు (Late Blight)",
        "Yellow Rust": "పసుపు కుంకుమ తెగులు (Yellow Rust)",
        "Blast": "అగ్గి తెగులు (Blast)",
        "Brown Spot": "గోధుమ రంగు మచ్చ తెగులు (Brown Spot)",
        "Bacterial Leaf Blight": "బ్యాక్టీరియా ఆకు ఎండు తెగులు (Bacterial Leaf Blight)",
        "Powdery Mildew": "బూడిద తెగులు (Powdery Mildew)",
        "Healthy": "ఆరోగ్యకరమైనది (Healthy)",
        "Pending Agronomist Review": "వ్యవసాయ నిపుణుల సమీక్ష పెండింగ్‌లో ఉంది",
        "Pending review by our agricultural expert.": "మా వ్యవసాయ నిపుణుల సమీక్ష కోసం వేచి ఉంది."
    },
    "mr": {
        "Early Blight": "लवकर येणारा करपा (Early Blight)",
        "Late Blight": "उशिरा येणारा करपा (Late Blight)",
        "Yellow Rust": "तांबेरा रोग (Yellow Rust)",
        "Blast": "करपा रोग (Blast)",
        "Healthy": "निरोगी (Healthy)",
        "Pending Agronomist Review": "कृषी तज्ज्ञांचे पुनरावलोकन प्रलंबित आहे",
        "Pending review by our agricultural expert.": "आमच्या कृषी तज्ज्ञांच्या पुनरावलोकनाची प्रतीक्षा आहे."
    },
    "es": {
        "Early Blight": "Tizón temprano",
        "Late Blight": "Tizón tardío",
        "Yellow Rust": "Roya amarilla",
        "Blast": "Añublo",
        "Brown Spot": "Mancha marrón",
        "Bacterial Leaf Blight": "Tizón bacteriano de la hoja",
        "Powdery Mildew": "Oídio",
        "Healthy": "Saludable",
        "Pending Agronomist Review": "Revisión del agrónomo pendiente",
        "Pending review by our agricultural expert.": "Pendiente de revisión por nuestro experto agrícola."
    }
}

@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Translate Text",
    description="Translate text to target language (e.g. hi, te, mr, es) using Google Translate or offline fallback."
)
async def translate_text(request: TranslationRequest):
    text = request.text.strip()
    target = request.target_language.strip().lower()
    
    if not text:
        return TranslationResponse(translated_text="", source_language="en")
    
    if target == "en":
        return TranslationResponse(translated_text=text, source_language="en")

    settings = get_settings()
    api_key = settings.GOOGLE_TRANSLATE_API_KEY
    
    # Try official API if key is present
    if api_key:
        try:
            url = f"https://translation.googleapis.com/language/translate/v2?key={api_key}"
            payload = {
                "q": [text],
                "target": target
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    translated = data["data"]["translations"][0]["translatedText"]
                    source_lang = data["data"]["translations"][0].get("detectedSourceLanguage", "en")
                    return TranslationResponse(translated_text=translated, source_language=source_lang)
                else:
                    logger.warning(f"Official Google Translate API returned status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error calling official Google Translate API: {e}")

    # Fallback to free public endpoint
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": target,
            "dt": "t",
            "q": text
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                # Free endpoint format: [[["translated_text", "source_text", null, null, 1]], ...]
                translated = ""
                for sentence in data[0]:
                    if sentence and len(sentence) > 0:
                        translated += sentence[0]
                source_lang = data[2] if len(data) > 2 else "auto"
                return TranslationResponse(translated_text=translated, source_language=source_lang)
            else:
                logger.warning(f"Free Google Translate API returned status {resp.status_code}")
    except Exception as e:
        logger.error(f"Error calling free Google Translate API: {e}")

    # Final fallback to local dictionary
    if target in FALLBACK_DICT and text in FALLBACK_DICT[target]:
        logger.info(f"Using local dictionary fallback for '{text}' -> '{target}'")
        return TranslationResponse(
            translated_text=FALLBACK_DICT[target][text],
            source_language="en"
        )

    # Return original text if everything fails
    logger.warning(f"All translation methods failed. Returning original text.")
    return TranslationResponse(translated_text=text, source_language="en")
