"""
Export endpoints — allows downloading prediction history in CSV, JSON, or XML formats,
and generating a beautiful PDF advisory card for farmers.

Supports the Admin portal requirements for auditing and offline analysis.
"""

import csv
import io
import json
import os
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.core.dependencies import get_db, get_current_user
from app.models.prediction import Prediction
from app.models.user import User

router = APIRouter()


@router.get(
    "/predictions/export",
    summary="Export Predictions Database",
    description="Download the entire prediction history (or filtered) in CSV, JSON, or XML formats.",
)
async def export_predictions(
    format: str = Query("csv", description="Export format: csv, json, xml"),
    crop_type: str = Query(None, description="Filter by crop type"),
    disease: str = Query(None, description="Filter by disease name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Stream all predictions in CSV, JSON, or XML format.
    Allows Admins and Agronomists to export the whole database.
    """
    if current_user.role not in ("ADMIN", "AGRONOMIST"):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only Admins or Agronomists can export the database."
        )

    query = select(Prediction).order_by(Prediction.created_at.desc())

    if crop_type:
        query = query.where(Prediction.crop_type.ilike(f"%{crop_type}%"))
    if disease:
        query = query.where(Prediction.predicted_disease.ilike(f"%{disease}%"))

    result = await db.execute(query)
    predictions = result.scalars().all()

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    # CSV Format
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)

        # Header row
        writer.writerow([
            "ID",
            "Date",
            "Crop Type",
            "Disease",
            "Confidence (%)",
            "Severity",
            "Recommendation",
            "Possible Reasons",
            "Location",
            "Language",
            "Farmer Notes",
            "AI Provider",
            "Status",
            "Agronomist Review"
        ])

        # Data rows
        for p in predictions:
            writer.writerow([
                str(p.id),
                p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "",
                p.crop_type,
                p.predicted_disease,
                f"{p.confidence * 100:.1f}",
                p.severity or "",
                p.recommendation or "",
                p.possible_reasons or "",
                p.location or "",
                p.language or "",
                p.farmer_notes or "",
                p.ai_provider,
                p.status,
                p.agronomist_review or "",
            ])

        output.seek(0)
        filename = f"krishi_predictions_{timestamp}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # JSON Format
    elif format.lower() == "json":
        data = []
        for p in predictions:
            data.append({
                "id": str(p.id),
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "crop_type": p.crop_type,
                "predicted_disease": p.predicted_disease,
                "confidence": p.confidence,
                "severity": p.severity,
                "recommendation": p.recommendation,
                "possible_reasons": p.possible_reasons,
                "location": p.location,
                "language": p.language,
                "farmer_notes": p.farmer_notes,
                "ai_provider": p.ai_provider,
                "status": p.status,
                "agronomist_review": p.agronomist_review,
            })

        output_str = json.dumps(data, indent=2)
        filename = f"krishi_predictions_{timestamp}.json"
        return StreamingResponse(
            iter([output_str]),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # XML Format
    elif format.lower() == "xml":
        root = ET.Element("predictions")
        for p in predictions:
            pred_el = ET.SubElement(root, "prediction")
            ET.SubElement(pred_el, "id").text = str(p.id)
            ET.SubElement(pred_el, "created_at").text = p.created_at.isoformat() if p.created_at else ""
            ET.SubElement(pred_el, "crop_type").text = p.crop_type
            ET.SubElement(pred_el, "predicted_disease").text = p.predicted_disease
            ET.SubElement(pred_el, "confidence").text = f"{p.confidence * 100:.1f}%"
            ET.SubElement(pred_el, "severity").text = p.severity or ""
            ET.SubElement(pred_el, "recommendation").text = p.recommendation or ""
            ET.SubElement(pred_el, "possible_reasons").text = p.possible_reasons or ""
            ET.SubElement(pred_el, "location").text = p.location or ""
            ET.SubElement(pred_el, "language").text = p.language or ""
            ET.SubElement(pred_el, "farmer_notes").text = p.farmer_notes or ""
            ET.SubElement(pred_el, "ai_provider").text = p.ai_provider
            ET.SubElement(pred_el, "status").text = p.status
            ET.SubElement(pred_el, "agronomist_review").text = p.agronomist_review or ""

        # Convert to string
        output_str = ET.tostring(root, encoding="utf-8", method="xml").decode("utf-8")
        filename = f"krishi_predictions_{timestamp}.xml"
        return StreamingResponse(
            iter([output_str]),
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: {format}. Supported formats: csv, json, xml"
        )


@router.get(
    "/predictions/{prediction_id}/pdf",
    summary="Export Prediction as PDF",
    description="Download a beautiful PDF advisory report for a specific prediction case.",
)
async def export_prediction_pdf(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate and download a beautifully formatted PDF report for a prediction case.
    Farmers can export their own predictions. Agronomists/Admins can export any.
    """
    # 1. Fetch prediction
    pred_res = await db.execute(select(Prediction).where(Prediction.id == prediction_id))
    p = pred_res.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Authorize
    if current_user.role == "FARMER" and p.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this prediction.")

    # 2. Setup document
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    story = []

    # ReportLab Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1b4332'),  # Premium dark forest green
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#2d6a4f'),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor('#2b2d42'),
        spaceAfter=6
    )

    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#4a4e69'),
    )

    # Document Header / Brand Banner
    story.append(Paragraph("✨ KRISHI CLINIC LITE", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#52b788'))))
    story.append(Paragraph("Agricultural Advisory Report", title_style))
    story.append(Spacer(1, 10))

    # Meta Details (Table)
    date_str = p.created_at.strftime("%B %d, %Y at %I:%M %p UTC") if p.created_at else "N/A"
    
    meta_data = [
        [Paragraph("Report ID:", label_style), Paragraph(str(p.id), body_style)],
        [Paragraph("Date Analyzed:", label_style), Paragraph(date_str, body_style)],
        [Paragraph("Crop Type:", label_style), Paragraph(p.crop_type, body_style)],
        [Paragraph("Location / Region:", label_style), Paragraph(p.location or "Not Specified", body_style)],
        [Paragraph("Preferred Language:", label_style), Paragraph(p.language or "English", body_style)]
    ]
    
    t_meta = Table(meta_data, colWidths=[120, 400])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))

    # Add Crop Image if exists
    if p.image_filename:
        # Resolve image path relative to workspace root
        img_path = os.path.join("uploads", p.image_filename)
        if os.path.exists(img_path):
            try:
                # Add image cleanly
                img = Image(img_path, width=240, height=180)
                img.hAlign = 'LEFT'
                story.append(Paragraph("Captured Crop Image", section_heading))
                story.append(img)
                story.append(Spacer(1, 15))
            except Exception as e:
                logger.error(f"Failed to embed image in PDF: {e}")

    # Farmer's Notes
    story.append(Paragraph("Farmer Observations & Notes", section_heading))
    story.append(Paragraph(p.farmer_notes or "No notes provided.", body_style))
    story.append(Spacer(1, 12))

    # AI Diagnosis Section
    story.append(Paragraph("AI Diagnosis Report", section_heading))
    
    # Check if prediction is reviewed. If reviewed, show reviewed details.
    predicted_disease = p.agronomist_predicted_disease or p.predicted_disease if p.status == "REVIEWED" else p.predicted_disease
    severity = p.agronomist_severity or p.severity if p.status == "REVIEWED" else p.severity
    recommendation = p.agronomist_review or p.recommendation if p.status == "REVIEWED" else p.recommendation
    possible_reasons = p.possible_reasons or "N/A"

    ai_data = [
        [Paragraph("Diagnosis:", label_style), Paragraph(predicted_disease, body_style)],
        [Paragraph("Confidence Score:", label_style), Paragraph(f"{p.confidence * 100:.1f}%", body_style)],
        [Paragraph("Severity Level:", label_style), Paragraph(severity or "Medium", body_style)],
        [Paragraph("Possible Reasons:", label_style), Paragraph(possible_reasons, body_style)],
        [Paragraph("Treatment Advisory:", label_style), Paragraph(recommendation or "No recommendation available.", body_style)]
    ]

    t_ai = Table(ai_data, colWidths=[120, 400])
    t_ai.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#e9ecef')),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_ai)
    story.append(Spacer(1, 20))

    # Agronomist Review (If Reviewed)
    if p.status == "REVIEWED":
        # Fetch Agronomist details
        agron_res = await db.execute(select(User.username).where(User.id == p.agronomist_id))
        agron_name = agron_res.scalar_one_or_none() or "Verified Agronomist"

        story.append(Paragraph("✅ VERIFIED AGRONOMIST REVIEW", section_heading))
        review_box_style = ParagraphStyle(
            'ReviewBox',
            parent=body_style,
            fontName='Helvetica-Oblique',
            fontSize=11,
            leading=16,
            textColor=colors.HexColor('#1b4332')
        )
        
        # Display review
        review_data = [
            [Paragraph(f"Reviewed By: {agron_name} (Expert Agronomist)", label_style)],
            [Paragraph(p.agronomist_review or "Verification complete.", review_box_style)]
        ]
        t_review = Table(review_data, colWidths=[520])
        t_review.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#d8f3dc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#52b788')),
            ('TOPPADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(t_review)

    # Build PDF
    doc.build(story)
    buffer.seek(0)

    filename = f"krishi_advisory_{p.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
