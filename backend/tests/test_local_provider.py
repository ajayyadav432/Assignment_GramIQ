"""Tests for the Local PyTorch AI provider."""

import pytest
from unittest.mock import MagicMock, patch
from app.ai.local_provider import LocalPyTorchProvider
from app.ai.base import PredictionResult


def test_local_provider_name():
    """LocalPyTorchProvider should identify itself as 'local'."""
    provider = LocalPyTorchProvider()
    assert provider.provider_name == "local"


@pytest.mark.asyncio
@patch("huggingface_hub.hf_hub_download")
@patch("timm.create_model")
@patch("torch.load")
async def test_local_provider_initialize_and_predict(mock_torch_load, mock_create_model, mock_hf_download):
    """Test model initialization and inference workflow with mocks."""
    # 1. Mock HuggingFace Hub download
    mock_hf_download.return_value = "/tmp/dummy_path"

    # 2. Mock timm model
    mock_model = MagicMock()
    mock_logits = MagicMock()
    mock_model.return_value = mock_logits
    mock_create_model.return_value = mock_model

    # 3. Mock torch load & metadata load
    mock_torch_load.return_value = {}

    provider = LocalPyTorchProvider()
    provider._class_names = ["bacterial_blight", "healthy", "soybean_rust"]
    provider._weights_dir = MagicMock()

    # Create dummy PIL Image and bytes
    from PIL import Image
    import io
    import torch

    img = Image.new("RGB", (100, 100), color="green")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_bytes = img_byte_arr.getvalue()

    # Mock preprocessing transforms
    provider._transform = MagicMock()
    mock_tensor = MagicMock()
    provider._transform.return_value = mock_tensor

    # Mock device
    provider._device = torch.device("cpu")

    # Mock PyTorch model state and load
    provider._model = mock_model

    # Mock torch.max and torch.softmax
    with patch("torch.softmax") as mock_softmax, patch("torch.max") as mock_max:
        mock_probs = MagicMock()
        mock_softmax.return_value = mock_probs
        
        mock_max_val = MagicMock()
        mock_max_idx = MagicMock()
        mock_max_val.item.return_value = 0.95
        mock_max_idx.item.return_value = 2  # index of soybean_rust
        mock_max.return_value = (mock_max_val, mock_max_idx)

        # Execute analyze
        result = await provider.analyze(img_bytes, "Soybean", "yellow spots")

        # Assertions
        assert isinstance(result, PredictionResult)
        assert result.predicted_disease == "Soybean Rust"
        assert result.confidence == 0.95
        assert result.severity == "High"
        assert "Tebuconazole" in result.recommendation
