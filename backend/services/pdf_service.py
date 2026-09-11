from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io
from datetime import datetime


NAVY = colors.HexColor("#1e3a5f")
BLUE = colors.HexColor("#2563eb")
GREEN = colors.HexColor("#16a34a")
RED = colors.HexColor("#dc2626")
LIGHT_GRAY = colors.HexColor("#f8fafc")
MID_GRAY = colors.HexColor("#e2e8f0")
TEXT_GRAY = colors.HexColor("#64748b")


def generate_certificate_pdf(cert_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Normal"],
        fontSize=22,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=12,
        fontName="Helvetica",
        textColor=BLUE,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Helvetica",
        textColor=TEXT_GRAY,
    )
    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=NAVY,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=6,
    )
    result_style = ParagraphStyle(
        "Result",
        parent=styles["Normal"],
        fontSize=18,
        fontName="Helvetica-Bold",
        textColor=GREEN if cert_data.get("result") == "PASS" else RED,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        fontName="Helvetica",
        textColor=TEXT_GRAY,
        alignment=TA_CENTER,
    )

    story = []

    # Header
    story.append(Paragraph("GOVERNMENT OF INDIA", ParagraphStyle(
        "GovHeader", parent=styles["Normal"], fontSize=10, fontName="Helvetica",
        textColor=TEXT_GRAY, alignment=TA_CENTER
    )))
    story.append(Paragraph("Ministry of Consumer Affairs, Food & Public Distribution", ParagraphStyle(
        "GovSub", parent=styles["Normal"], fontSize=9, fontName="Helvetica",
        textColor=TEXT_GRAY, alignment=TA_CENTER, spaceAfter=8
    )))
    story.append(HRFlowable(width="100%", thickness=2, color=NAVY))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("LEGAL METROLOGY", title_style))
    story.append(Paragraph("VERIFICATION CERTIFICATE", title_style))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("Maharashtra State Legal Metrology Department", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=MID_GRAY))
    story.append(Spacer(1, 0.3 * cm))

    # Certificate ID
    cert_id_style = ParagraphStyle(
        "CertID", parent=styles["Normal"], fontSize=11, fontName="Helvetica-Bold",
        textColor=BLUE, alignment=TA_CENTER
    )
    story.append(Paragraph(f"Certificate ID: {cert_data['certificate_id']}", cert_id_style))
    story.append(Spacer(1, 0.5 * cm))

    # Result Banner
    result_text = "✓ VERIFIED — PASS" if cert_data.get("result") == "PASS" else "✗ FAILED"
    story.append(Paragraph(result_text, result_style))
    story.append(Spacer(1, 0.4 * cm))

    # Instrument Details
    story.append(Paragraph("INSTRUMENT DETAILS", section_style))

    instrument_data = [
        ["Instrument Type", cert_data.get("instrument_type", ""), "Instrument ID", cert_data.get("instrument_ref", "")],
        ["Manufacturer", cert_data.get("manufacturer", ""), "Model", cert_data.get("model", "")],
        ["Serial Number", cert_data.get("serial_number", ""), "Capacity", f"{cert_data.get('capacity', '')} {cert_data.get('unit', '')}"],
    ]

    instrument_table = Table(instrument_data, colWidths=[3.5 * cm, 6 * cm, 3.5 * cm, 6 * cm])
    instrument_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_GRAY),
        ("TEXTCOLOR", (2, 0), (2, -1), TEXT_GRAY),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("TEXTCOLOR", (3, 0), (3, -1), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTNAME", (3, 0), (3, -1), "Helvetica"),
    ]))
    story.append(instrument_table)
    story.append(Spacer(1, 0.3 * cm))

    # Owner Details
    story.append(Paragraph("OWNER / BUSINESS DETAILS", section_style))
    owner_data = [
        ["Owner Name", cert_data.get("owner_name", ""), "Business", cert_data.get("business_name", "")],
        ["Address", cert_data.get("address", ""), "", ""],
    ]
    owner_table = Table(owner_data, colWidths=[3.5 * cm, 6 * cm, 3.5 * cm, 6 * cm])
    owner_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_GRAY),
        ("TEXTCOLOR", (2, 0), (2, -1), TEXT_GRAY),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("TEXTCOLOR", (3, 0), (3, -1), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(owner_table)
    story.append(Spacer(1, 0.3 * cm))

    # Verification Details
    story.append(Paragraph("STATUTORY VERIFICATION & STAMPING PARTICULARS", section_style))
    auth_label = "Govt Approved Test Centre (GATC)" if cert_data.get("allocated_to_type") == "GATC" else "State Legal Metrology Officer (LMO)"
    verify_data = [
        ["Verification Date", cert_data.get("verification_date", ""), "Valid Until", cert_data.get("valid_until", "")],
        ["Inspecting Officer / Lab", cert_data.get("officer", ""), "Test Centre", cert_data.get("test_centre", "")],
        ["Stamping Seal No.", cert_data.get("stamping_seal_no", "MH-26-SEAL-PENDING"), "Authority Type", auth_label],
        ["Verification Scope", cert_data.get("verification_type", "VERIFICATION"), "Jurisdiction / District", cert_data.get("district", "Maharashtra State")],
    ]
    verify_table = Table(verify_data, colWidths=[3.5 * cm, 6 * cm, 3.5 * cm, 6 * cm])
    verify_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_GRAY),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_GRAY),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (0, -1), TEXT_GRAY),
        ("TEXTCOLOR", (2, 0), (2, -1), TEXT_GRAY),
        ("TEXTCOLOR", (1, 0), (1, -1), NAVY),
        ("TEXTCOLOR", (3, 0), (3, -1), NAVY),
        ("GRID", (0, 0), (-1, -1), 0.5, MID_GRAY),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(verify_table)
    story.append(Spacer(1, 0.4 * cm))

    # Footer
    story.append(HRFlowable(width="100%", thickness=1, color=MID_GRAY))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(
        "This is a prototype certificate generated by MetroVerify for demonstration purposes only.",
        footer_style
    ))
    story.append(Paragraph(
        f"Generated on: {datetime.utcnow().strftime('%d %B %Y at %H:%M UTC')}",
        footer_style
    ))
    story.append(Paragraph(
        "Verify authenticity at: metroverify.gov.in/verify/" + cert_data.get("certificate_id", ""),
        ParagraphStyle("FooterLink", parent=styles["Normal"], fontSize=8, textColor=BLUE, alignment=TA_CENTER)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
