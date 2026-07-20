#!/usr/bin/env python3
"""
train.py — Crop Disease Model Training Script
==============================================
Trains or fine-tunes an EfficientNetV2-S model on a crop disease dataset from Hugging Face.
Saves the trained model weights and metadata for use by LocalPyTorchProvider.

Usage:
    python backend/app/ai/train.py --epochs 5 --batch-size 16 --lr 1e-4
"""

import os
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Train custom EfficientNetV2-S crop disease classifier.")
    parser.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--dataset", type=str, default="harshv777/mh-soyahealthvision-nonuav", help="HuggingFace dataset ID")
    parser.add_argument("--output-dir", type=str, default="weights_trained", help="Directory to save model weights")
    args = parser.parse_args()

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim
        from torch.utils.data import DataLoader
        from torchvision import transforms
        import timm
        from huggingface_hub import HfApi
    except ImportError as e:
        logger.error("Missing required dependencies for training.", exc_info=True)
        print("Please install: pip install torch torchvision timm datasets huggingface_hub")
        return

    # Check for datasets library
    try:
        from datasets import load_dataset
    except ImportError:
        logger.info("Installing 'datasets' library for HuggingFace dataset loading...")
        os.system("pip install datasets")
        from datasets import load_dataset

    # Resolve device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device for training: {device}")

    # 1. Load HuggingFace dataset
    logger.info(f"Loading dataset from HuggingFace Hub: {args.dataset}")
    try:
        dataset = load_dataset(args.dataset)
    except Exception as e:
        logger.error(f"Failed to load dataset: {e}", exc_info=True)
        return

    # 2. Extract class labels
    # Verify dataset splits
    if "train" not in dataset:
        logger.error("Dataset does not contain a 'train' split.")
        return
    
    # Extract class labels from features
    features = dataset["train"].features
    if "label" in features and hasattr(features["label"], "names"):
        class_names = features["label"].names
    else:
        # Fallback: find unique labels
        logger.warning("Class names not found in dataset features. Inferring from labels...")
        unique_labels = set(dataset["train"]["label"])
        class_names = [f"class_{i}" for i in sorted(list(unique_labels))]

    num_classes = len(class_names)
    logger.info(f"Dataset has {num_classes} classes: {class_names}")

    # 3. Create dataset transform pipeline
    transform_train = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    transform_val = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Custom torch Dataset wrapper for HF dataset
    class HFImageDataset(torch.utils.data.Dataset):
        def __init__(self, hf_data, transform=None):
            self.hf_data = hf_data
            self.transform = transform

        def __len__(self):
            return len(self.hf_data)

        def __getitem__(self, idx):
            item = self.hf_data[idx]
            # Convert image to RGB PIL Image
            image = item["image"].convert("RGB")
            label = item["label"]
            if self.transform:
                image = self.transform(image)
            return image, label

    # 4. Prepare data loaders
    train_dataset = HFImageDataset(dataset["train"], transform=transform_train)
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=0)

    val_loader = None
    if "validation" in dataset:
        val_dataset = HFImageDataset(dataset["validation"], transform=transform_val)
        val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)
    elif "test" in dataset:
        val_dataset = HFImageDataset(dataset["test"], transform=transform_val)
        val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # 5. Create Model
    logger.info("Instantiating model: tf_efficientnetv2_s...")
    model = timm.create_model("tf_efficientnetv2_s", pretrained=True, num_classes=num_classes)
    model.to(device)

    # 6. Optimizer, Criterion, Scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    
    # 7. Training Loop
    logger.info(f"Starting training on {len(train_dataset)} images for {args.epochs} epochs...")
    best_accuracy = 0.0

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = correct / total
        logger.info(f"Epoch [{epoch}/{args.epochs}] - Train Loss: {epoch_loss:.4f}, Train Acc: {epoch_acc*100:.2f}%")

        # Evaluate if validation loader exists
        if val_loader:
            model.eval()
            val_correct = 0
            val_total = 0
            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device)
                    outputs = model(images)
                    _, predicted = outputs.max(1)
                    val_total += labels.size(0)
                    val_correct += predicted.eq(labels).sum().item()
            
            val_acc = val_correct / val_total
            logger.info(f"Epoch [{epoch}/{args.epochs}] - Val Acc: {val_acc*100:.2f}%")
            if val_acc > best_accuracy:
                best_accuracy = val_acc
                # Save best model
                torch.save(model.state_dict(), output_dir / "model.pt")
                logger.info(f"Saved new best model checkpoint (Val Acc: {val_acc*100:.2f}%)")
        else:
            # If no validation set, save model from last epoch
            torch.save(model.state_dict(), output_dir / "model.pt")

    # 8. Save final metadata.json
    metadata = {
        "version": f"v1.0-custom-{datetime.now().strftime('%Y%m%d-%H%M')}",
        "change": f"Custom fine-tuned EfficientNetV2-S model trained on dataset {args.dataset}",
        "parent": "v0.1-baseline",
        "dataset": args.dataset,
        "model_arch": "tf_efficientnetv2_s",
        "num_classes": num_classes,
        "class_names": class_names,
        "class_to_idx": {name: i for i, name in enumerate(class_names)},
        "image_size": 224,
        "best_epoch": args.epochs,
        "best_val_f1": best_accuracy,
        "test_accuracy": best_accuracy if val_loader else epoch_acc,
        "config": {
            "model_name": "tf_efficientnetv2_s",
            "pretrained": True,
            "image_size": 224,
            "batch_size": args.batch_size,
            "lr": args.lr,
            "epochs": args.epochs,
            "loss": "cross_entropy"
        },
        "platform": "Local System GPU/CPU",
        "framework": "PyTorch + timm"
    }

    with open(output_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Training complete! Model and metadata saved to: {output_dir}")


if __name__ == "__main__":
    main()
