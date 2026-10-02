import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.services.qr_service import generate_qr_image_bytes

SLATE_DARK = colors.HexColor("#0f172a")
NAVY_HEADER = colors.HexColor("#1e293b")
ACCENT_BLUE = colors.HexColor("#2563eb")
SUCCESS_GREEN = colors.HexColor("#16a34a")
FAIL_RED = colors.HexColor("#dc2626")
LIGHT_BG = colors.HexColor("#f8fafc")
BORDER_GRAY = colors.HexColor("#cbd5e1")
TEXT_MUTED = colors.HexColor("#64748b")

def generate_certificate_pdf(cert_data: dict, qr_url: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CertTitle",
        parent=styles["Normal"],
        fontSize=16,
        fontName="Helvetica-Bold",
        textColor=SLATE_DARK,
        alignment=TA_CENTER,
        spaceAfter=3,
    )
    subtitle_style = ParagraphStyle(
        "CertSubTitle",
        parent=styles["Normal"],
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=ACCENT_BLUE,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    legal_ref_style = ParagraphStyle(
        "LegalRef",
        parent=styles["Normal"],
        fontSize=8,
        fontName="Helvetica-Oblique",
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
        spaceAfter=6,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Helvetica-Bold",
        textColor=SLATE_DARK,
        spaceBefore=6,
        spaceAfter=3,
    )
    cell_bold = ParagraphStyle(
        "CellBold",
        parent=styles["Normal"],
        fontSize=8,
        fontName="Helvetica-Bold",
        textColor=SLATE_DARK,
    )
    cell_text = ParagraphStyle(
        "CellText",
        parent=styles["Normal"],
        fontSize=8,
        fontName="Helvetica",
        textColor=SLATE_DARK,
    )
    cell_muted = ParagraphStyle(
        "CellMuted",
        parent=styles["Normal"],
        fontSize=7.5,
        fontName="Helvetica",
        textColor=TEXT_MUTED,
    )
    footer_text = ParagraphStyle(
        "FooterText",
        parent=styles["Normal"],
        fontSize=7,
        fontName="Helvetica",
        textColor=TEXT_MUTED,
        alignment=TA_CENTER,
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("DIGITAL LEGAL METROLOGY VERIFICATION RECORD", title_style))
    story.append(Paragraph("SCHEDULE IX — CERTIFICATE OF VERIFICATION RECORD", subtitle_style))
    story.append(Paragraph(
        "Aligned with Legal Metrology Act, 2009 & Maharashtra Legal Metrology (Enforcement) Rules, 2011",
        legal_ref_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SLATE_DARK, spaceAfter=8))

    # 2. Certificate Ref & Status Bar
    cert_id = cert_data.get("certificate_number") or cert_data.get("certificate_id", "LM-CERT-000")
    result_text = "VERIFIED — COMPLIANT (PASS)" if cert_data.get("result") == "PASS" else "NON-COMPLIANT (FAIL)"
    res_color_hex = "#16a34a" if cert_data.get("result") == "PASS" else "#dc2626"
    rule_ver = cert_data.get("ruleset_version", "2026.4")

    header_table_data = [
        [
            Paragraph(f"<b>Certificate Ref:</b> {cert_id}", cell_bold),
            Paragraph(f"<b>Status:</b> <font color='{res_color_hex}'><b>{result_text}</b></font>", cell_bold),
            Paragraph(f"<b>Rule Version:</b> {rule_ver}", cell_muted)
        ]
    ]
    ht = Table(header_table_data, colWidths=[6.5 * cm, 6.0 * cm, 5.5 * cm])
    ht.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(ht)
    story.append(Spacer(1, 0.2 * cm))

    # 3. Instrument Metrological Characteristics
    story.append(Paragraph("1. METROLOGICAL CHARACTERISTICS OF INSTRUMENT", section_heading))
    inst_data = [
        [
            Paragraph("Instrument ID", cell_muted), Paragraph(str(cert_data.get("instrument_id", "")), cell_text),
            Paragraph("Instrument Type", cell_muted), Paragraph(str(cert_data.get("instrument_type", "")), cell_text)
        ],
        [
            Paragraph("Manufacturer", cell_muted), Paragraph(str(cert_data.get("manufacturer", "")), cell_text),
            Paragraph("Model", cell_muted), Paragraph(str(cert_data.get("model", "")), cell_text)
        ],
        [
            Paragraph("Serial Number", cell_muted), Paragraph(str(cert_data.get("serial_number", "")), cell_bold),
            Paragraph("Accuracy Class", cell_muted), Paragraph(str(cert_data.get("accuracy_class", "CLASS_III")), cell_bold)
        ],
        [
            Paragraph("Maximum Capacity (Max)", cell_muted), Paragraph(f"{cert_data.get('max_capacity', '')} {cert_data.get('unit', 'kg')}", cell_text),
            Paragraph("Minimum Capacity (Min)", cell_muted), Paragraph(f"{cert_data.get('min_capacity', '')} {cert_data.get('unit', 'kg')}", cell_text)
        ],
        [
            Paragraph("Verification Interval (e)", cell_muted), Paragraph(f"{cert_data.get('e', '')} {cert_data.get('unit', 'kg')}", cell_text),
            Paragraph("Actual Interval (d)", cell_muted), Paragraph(f"{cert_data.get('d', '')} {cert_data.get('unit', 'kg')}", cell_text)
        ],
    ]
    it = Table(inst_data, colWidths=[4.2 * cm, 4.8 * cm, 4.2 * cm, 4.8 * cm])
    it.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BG),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(it)
    story.append(Spacer(1, 0.2 * cm))

    # 4. User / Owner Details & Premises
    story.append(Paragraph("2. USER / TRADER PREMISES DETAILS", section_heading))
    owner_data = [
        [
            Paragraph("Owner Name", cell_muted), Paragraph(str(cert_data.get("owner_name", "")), cell_text),
            Paragraph("Business Name", cell_muted), Paragraph(str(cert_data.get("business_name", "")), cell_text)
        ],
        [
            Paragraph("Address", cell_muted), Paragraph(str(cert_data.get("address", "")), cell_text),
            Paragraph("Jurisdiction / District", cell_muted), Paragraph(f"{cert_data.get('district', '')}, {cert_data.get('division', 'Maharashtra')}", cell_text)
        ]
    ]
    ot = Table(owner_data, colWidths=[4.2 * cm, 4.8 * cm, 4.2 * cm, 4.8 * cm])
    ot.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BG),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(ot)
    story.append(Spacer(1, 0.2 * cm))

    # 5. Verification Assessment & Validity
    story.append(Paragraph("3. VERIFICATION ASSESSMENT & VALIDITY PERIOD", section_heading))
    vdate_str = cert_data.get("verification_date", "")
    if isinstance(vdate_str, datetime):
        vdate_str = vdate_str.strftime("%d %B %Y")
    due_str = cert_data.get("valid_until", "")
    if isinstance(due_str, datetime):
        due_str = due_str.strftime("%d %B %Y")

    months_val = cert_data.get("interval_months", 12)
    verify_data = [
        [
            Paragraph("Verification Date", cell_muted), Paragraph(str(vdate_str), cell_bold),
            Paragraph("Next Due Date (Validity)", cell_muted), Paragraph(str(due_str), cell_bold)
        ],
        [
            Paragraph("Validity Period", cell_muted), Paragraph(f"{months_val} Months (Statutory Rule)", cell_text),
            Paragraph("Test Location", cell_muted), Paragraph(str(cert_data.get("test_location", "Premises/Laboratory")), cell_text)
        ],
        [
            Paragraph("Inspecting Officer", cell_muted), Paragraph(str(cert_data.get("officer_name", "")), cell_text),
            Paragraph("Issuing Office", cell_muted), Paragraph(str(cert_data.get("office_name", "")), cell_text)
        ],
        [
            Paragraph("Fee / GRAS GRN Ref", cell_muted), Paragraph(str(cert_data.get("fee_reference", "GRAS-MH-VERIFIED")), cell_text),
            Paragraph("Inspection Ref ID", cell_muted), Paragraph(str(cert_data.get("inspection_id", "")), cell_text)
        ]
    ]
    vt = Table(verify_data, colWidths=[4.2 * cm, 4.8 * cm, 4.2 * cm, 4.8 * cm])
    vt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), LIGHT_BG),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(vt)
    story.append(Spacer(1, 0.2 * cm))

    # 6. Cryptographic Hash & QR Verification Box
    story.append(Paragraph("4. INTEGRITY PROOF & PUBLIC VERIFICATION", section_heading))
    qr_img_bytes = generate_qr_image_bytes(qr_url)
    qr_img = RLImage(io.BytesIO(qr_img_bytes), width=2.4 * cm, height=2.4 * cm)

    hash_val = cert_data.get("certificate_hash", "SHA256-PENDING")
    proof_text = [
        [
            qr_img,
            [
                Paragraph("<b>Public Verification Endpoint:</b>", cell_bold),
                Paragraph(qr_url, cell_muted),
                Spacer(1, 0.1 * cm),
                Paragraph("<b>SHA-256 Record Integrity Hash:</b>", cell_bold),
                Paragraph(f"<font face='Courier' size='6.5'>{hash_val}</font>", cell_text),
                Spacer(1, 0.1 * cm),
                Paragraph("<i>Scan QR code to verify this digital record directly against MetroVerify public ledger.</i>", cell_muted)
            ]
        ]
    ]
    pt = Table(proof_text, colWidths=[2.8 * cm, 15.2 * cm])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(pt)
    story.append(Spacer(1, 0.3 * cm))

    # 7. Disclaimer Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_GRAY, spaceAfter=4))
    story.append(Paragraph(
        "<b>LEGAL NOTICE & SYSTEM ATTRIBUTION:</b> This digital verification certificate is generated by MetroVerify v2 as an automated metrological record based on physical test results. Unless separately authorized and integrated with state systems, this digital record operates as a traceable verification report and does not substitute physical government verification stamps.",
        footer_text
    ))
    gen_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    story.append(Paragraph(
        f"Generated on {gen_time} | MetroVerify v2 Production Metrological Engine",
        footer_text
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
