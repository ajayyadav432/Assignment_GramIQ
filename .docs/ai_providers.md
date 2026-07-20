# 🧠 AI Provider Integration & Abstraction

This document outlines how swappable AI providers, multimodal structured outputs, Retrieval-Augmented Generation (RAG), and offline deep learning inference work in **Krishi Clinic Lite**.

---

## 1. Provider Abstraction (ABC)

To avoid vendor lock-in, the API routes and services layer interact solely with the abstract contract `AIProvider` (`backend/app/ai/base.py`).

```python
class AIProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def analyze(
        self, image_bytes: bytes, crop_type: str, farmer_notes: str | None = None
    ) -> PredictionResult:
        pass
```

All concrete implementations return a structured `PredictionResult` Pydantic model:
```python
class PredictionResult(BaseModel):
    predicted_disease: str
    confidence: float
    severity: str
    recommendation: str
    possible_reasons: str
```

---

## 2. swappable Provider Implementations

The project contains 5 swappable AI providers:

1.  **MockProvider** (`mock`): Returns deterministic responses based on predefined crop rules. Requires no API keys; ideal for local development and CI testing.
2.  **GeminiProvider** (`gemini`): Connects to the **Google Generative AI SDK** using `gemini-1.5-flash` or `gemini-2.0-flash`. Sends a multimodal payload with structured JSON schema responses.
3.  **GroqProvider** (`groq`): Connects to the Groq REST API using the `llama3-70b-8192` model.
4.  **OpenAIProvider** (`openai`): Connects to the OpenAI SDK using `gpt-4o-mini` with structured JSON mode.
5.  **LocalPyTorchProvider** (`local`): CPU-only PyTorch model running offline edge inference on an **EfficientNetV2-S** model. Model weights are cached automatically from the Hugging Face Hub.

---

## 3. Resilience: `FallbackAIProvider`

To prevent API outages (such as rate limits, credential issues, or network failures) from crashing the server, the system loads a **Fallback AI Provider** wrapper by default:

-   It tries to run the configured primary provider (e.g., `gemini` or `openai`).
-   If the primary provider fails (throws an exception or is missing its API key), the wrapper automatically catches the error, logs it, and falls back to `MockProvider`.
-   The record in the database is saved with `ai_provider: "gemini (fallback to mock)"` for audit tracing.

---

## 4. Multi-Request Model Selector

The frontend features an **AI Model** selector dropdown inside the Upload panel. This binds the optional `ai_provider_name` field in the multipart form data request, prompting the backend to override the default environment model and dynamically route the query to a specific model engine.

---

## 5. RAG (Retrieval-Augmented Generation) Workflow

To improve AI advice, the backend uses **RAG** prior to querying LLMs:
1.  When a query is uploaded, the service layer converts the `crop_type` and `farmer_notes` into a text embedding vector (using a sentence-transformer model).
2.  The service queries the database for historically **reviewed and verified agronomist cases** of the same crop type.
3.  It computes the cosine similarity between the current query's embedding and the candidate cases' embeddings.
4.  The top 2 matching verified cases (notes, verified disease, and expert advisory review notes) are injected directly into the LLM system prompt:
    ```
    === BIOBANK HISTORICAL CASES (Agronomist Verified) ===
    Case 1 (Similarity: 0.89):
    - Farmer Observations: Yellow leaf margins...
    - Verified Diagnosis: Potassium Deficiency
    - Verified Treatment: Apply potash-rich fertilizer.
    ```
5.  The LLM leverages this contextual background to construct a highly localized and precise crop disease diagnostic response.
