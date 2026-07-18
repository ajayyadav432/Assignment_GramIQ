# Reflection

## 1. What was the hardest engineering challenge and how did I approach it?

The **AI provider abstraction** was the hardest challenge — not because of the abstraction itself, but because of the tension between making it genuinely useful and keeping it simple enough for a 72-hour deadline.

The temptation was to define a minimal interface (`analyze(image) -> dict`) and call it done. Instead, I invested time in designing a proper `PredictionResult` Pydantic model as the return type. This forced both the `GeminiProvider` and `MockProvider` to return identically structured data, which meant:
- The service layer never needs to handle provider-specific response formats
- The database insertion logic is provider-agnostic
- Tests can reliably assert on the same fields regardless of which provider ran

The approach was to write the interface first (top-down), then implement `MockProvider` to validate the contract, and only then build `GeminiProvider`. This ensured the interface was designed from the consumer's perspective, not shaped by a specific SDK's response format.

## 2. What was the biggest trade-off and why?

**Local image storage vs. cloud blob storage (S3/GCS).**

I chose local filesystem storage because:
- It eliminates AWS/GCP credential management in a Docker-first deployment
- It removes a network dependency (faster uploads during development)
- The evaluation runs on a local machine, not in the cloud

However, this means uploaded images are stored inside the Docker volume. If the volume is deleted, images are lost. The `StorageProvider` interface I designed makes migrating to S3 a contained, minimal change — implement `save()` with `boto3.put_object()` and `get_url()` with presigned URLs. But I chose not to do it now because the added complexity wouldn't improve the evaluator's experience.

## 3. What was my biggest learning?

**The power of dependency injection in FastAPI.** I had used DI in Spring Boot (Java) and .NET, but FastAPI's `Depends()` system is remarkably elegant for a Python framework. Being able to override entire subsystems (database, AI provider, storage) in test fixtures with 3 lines of code made testing almost effortless.

This also taught me why "thin route handlers" matter practically, not just theoretically. When all logic lives in the service layer, the route handler becomes trivially testable — you're really testing the HTTP parsing, not the business logic. And the business logic can be tested independently by constructing a `PredictionService` with mocked dependencies.

The lesson I'll carry forward: **invest early in your dependency injection setup, even if it feels like over-engineering for a small project.** It pays off exponentially when you need to test, debug, or extend.
