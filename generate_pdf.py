import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

def make_flowchart_drawing():
    d = Drawing(520, 80)
    
    # 5 Boxes
    boxes = [
        {"x": 5,   "w": 80, "bg": "#e2eafc", "border": "#3a86c8", "text": ["Farmer", "Uploads Query"]},
        {"x": 110, "w": 85, "bg": "#d8f3dc", "border": "#52b788", "text": ["AI & RAG", "Analysis"]},
        {"x": 220, "w": 80, "bg": "#fef3c7", "border": "#f59e0b", "text": ["Pending", "Review"]},
        {"x": 325, "w": 90, "bg": "#d8f3dc", "border": "#52b788", "text": ["Agronomist", "Verification"]},
        {"x": 440, "w": 75, "bg": "#b7e4c7", "border": "#1b4332", "text": ["Verified", "Advisory"]}
    ]
    
    for box in boxes:
        # Draw background rectangle
        r = Rect(
            box["x"], 10, box["w"], 50,
            fillColor=colors.HexColor(box["bg"]),
            strokeColor=colors.HexColor(box["border"]),
            strokeWidth=1.5,
            rx=5, ry=5 # Round corners
        )
        d.add(r)
        
        # Draw text lines centered inside the box
        center_x = box["x"] + box["w"] / 2
        s1 = String(
            center_x, 38, box["text"][0],
            fontName="Helvetica-Bold", fontSize=8,
            textAnchor="middle", fillColor=colors.HexColor("#2b2d42")
        )
        s2 = String(
            center_x, 26, box["text"][1],
            fontName="Helvetica-Bold", fontSize=8,
            textAnchor="middle", fillColor=colors.HexColor("#2b2d42")
        )
        d.add(s1)
        d.add(s2)
        
    # Draw arrows between boxes
    arrows = [
        (85, 110),
        (195, 220),
        (300, 325),
        (415, 440)
    ]
    
    for x1, x2 in arrows:
        y = 35
        # Shaft
        line = Line(
            x1, y, x2, y,
            strokeColor=colors.HexColor("#95d5b2"),
            strokeWidth=2
        )
        d.add(line)
        # Arrowhead
        poly = Polygon(
            points=[x2, y, x2-5, y-3, x2-5, y+3],
            fillColor=colors.HexColor("#95d5b2"),
            strokeColor=colors.HexColor("#95d5b2")
        )
        d.add(poly)
        
    return d

def parse_markdown_to_pdf(md_path, pdf_path):
    print(f"Reading markdown from {md_path}...")
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )
    story = []

    # Get sample stylesheet
    styles = getSampleStyleSheet()

    # Custom premium styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1b4332'),  # Dark forest green
        spaceAfter=15,
        alignment=1  # Center alignment
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1b4332'),
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#2d6a4f'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#2b2d42'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1d3557'),
        spaceAfter=4
    )

    def clean_text(text):
        # Convert markdown bold **text** to reportlab HTML-like tags <b>text</b>
        text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
        # Convert markdown italic *text* to <i>text</i>
        text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
        # Convert inline code `code` to monospaced font
        text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', text)
        # Clean up stray XML symbols
        text = text.replace('&', '&amp;').replace('< ', '&lt; ').replace(' >', ' &gt;')
        # Restore HTML tag structures after replacements
        text = text.replace('&amp;lt;', '&lt;').replace('&amp;gt;', '&gt;')
        return text.strip()

    in_code_block = False
    code_block_lines = []
    
    in_table = False
    table_rows = []

    for line in lines:
        stripped = line.strip()

        # Handle Code Blocks
        if stripped.startswith('```'):
            if in_code_block:
                # End of code block
                in_code_block = False
                code_content = '\n'.join(code_block_lines)
                # Render code block in a single column table with grey background
                p_code = Paragraph(f"<pre>{code_content}</pre>", code_style)
                t = Table([[p_code]], colWidths=[520])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f9fa')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e9ecef')),
                    ('TOPPADDING', (0,0), (-1,-1), 8),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                    ('LEFTPADDING', (0,0), (-1,-1), 10),
                    ('RIGHTPADDING', (0,0), (-1,-1), 10),
                ]))
                story.append(t)
                story.append(Spacer(1, 8))
                code_block_lines = []
            else:
                # Start of code block
                in_code_block = True
            continue

        if in_code_block:
            # Escape HTML characters inside code blocks
            escaped = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            code_block_lines.append(escaped.rstrip('\n'))
            continue

        # Handle Tables
        if stripped.startswith('|'):
            in_table = True
            # Ignore markdown table separator lines like |---|---|
            if '---' in stripped:
                continue
            cells = [clean_text(c) for c in stripped.split('|')[1:-1]]
            table_rows.append(cells)
            continue
        elif in_table:
            # End of table, render it
            in_table = False
            if table_rows:
                formatted_rows = []
                # Wrap each cell in a Paragraph to allow formatting and auto-wrapping
                col_count = len(table_rows[0])
                col_width = 520 / col_count
                for r_idx, r in enumerate(table_rows):
                    row_cells = []
                    for c in r:
                        c_style = body_style
                        if r_idx == 0:
                            c_style = ParagraphStyle('TH', parent=body_style, fontName='Helvetica-Bold')
                        row_cells.append(Paragraph(c, c_style))
                    formatted_rows.append(row_cells)

                t = Table(formatted_rows, colWidths=[col_width] * col_count)
                t.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e9ecef')),
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2eafc')),
                    ('TOPPADDING', (0,0), (-1,-1), 6),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ]))
                story.append(t)
                story.append(Spacer(1, 10))
                table_rows = []

        # Handle Empty Lines
        if not stripped:
            story.append(Spacer(1, 4))
            continue

        # Intercept and replace ASCII workflow with graphical flowchart
        if '[ Farmer Upload ]' in stripped:
            story.append(make_flowchart_drawing())
            story.append(Spacer(1, 10))
            continue

        # Handle Headings
        if stripped.startswith('# '):
            text = clean_text(stripped[2:])
            story.append(Paragraph(text, title_style))
            story.append(Spacer(1, 10))
        elif stripped.startswith('## '):
            text = clean_text(stripped[3:])
            story.append(Paragraph(text, h1_style))
        elif stripped.startswith('### '):
            text = clean_text(stripped[4:])
            story.append(Paragraph(text, h2_style))

        # Handle Horizontal Rules
        elif stripped == '---':
            # Horizontal line separator
            t_hr = Table([['']], colWidths=[520])
            t_hr.setStyle(TableStyle([
                ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#e9ecef')),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ]))
            story.append(t_hr)
            story.append(Spacer(1, 10))

        # Handle Bullet Lists
        elif stripped.startswith('- ') or stripped.startswith('* '):
            text = clean_text(stripped[2:])
            story.append(Paragraph(f"&bull; {text}", bullet_style))
        elif stripped.startswith('1. ') or stripped.startswith('2. ') or stripped.startswith('3. ') or stripped.startswith('4. ') or stripped.startswith('5. '):
            # Numbered list
            prefix, text = stripped.split('. ', 1)
            text = clean_text(text)
            story.append(Paragraph(f"{prefix}. {text}", bullet_style))

        # Handle Normal Paragraphs
        else:
            text = clean_text(stripped)
            story.append(Paragraph(text, body_style))

    print(f"Building PDF document at {pdf_path}...")
    doc.build(story)
    print("PDF build successful!")

if __name__ == "__main__":
    md_file = "/home/ajay/Documents/Assignment_GramIQ/documentation.docs"
    pdf_file = "/home/ajay/Documents/Assignment_GramIQ/documentation.pdf"
    parse_markdown_to_pdf(md_file, pdf_file)
