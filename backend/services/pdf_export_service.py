import io
import logging
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

logger = logging.getLogger(__name__)

# Custom colors
PRIMARY_COLOR = HexColor('#2563eb')
DARK_COLOR = HexColor('#1a1f26')
GRAY_COLOR = HexColor('#6b7280')
RED_COLOR = HexColor('#ef4444')
YELLOW_COLOR = HexColor('#f59e0b')
GREEN_COLOR = HexColor('#22c55e')


def get_risk_color(risk_level: str) -> HexColor:
    """Get color based on risk level."""
    colors = {
        'high': RED_COLOR,
        'medium': YELLOW_COLOR,
        'low': GREEN_COLOR
    }
    return colors.get(risk_level, GRAY_COLOR)


def generate_contract_pdf(contract: Dict[str, Any]) -> bytes:
    """Generate a PDF report for a contract."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=PRIMARY_COLOR,
        spaceBefore=20,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        alignment=TA_JUSTIFY
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=10,
        textColor=GRAY_COLOR
    )
    
    story = []
    
    # Header
    story.append(Paragraph("LexiSense Contract Report", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR))
    story.append(Spacer(1, 20))
    
    # Contract Title
    story.append(Paragraph(contract.get('title', 'Untitled Contract'), styles['Heading1']))
    story.append(Spacer(1, 10))
    
    # Contract Details Table
    details_data = [
        ['Contract Type:', contract.get('contractType', 'N/A'), 'Status:', contract.get('status', 'N/A').upper()],
        ['Counterparty:', contract.get('counterparty', 'N/A'), 'Risk Level:', (contract.get('riskLevel') or 'N/A').upper()],
        ['Effective Date:', contract.get('effectiveDate', 'N/A'), 'Expiry Date:', contract.get('expiryDate', 'N/A')],
        ['Value:', contract.get('value', 'N/A'), 'Created:', contract.get('createdAt', 'N/A')[:10] if contract.get('createdAt') else 'N/A'],
    ]
    
    details_table = Table(details_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
    details_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), GRAY_COLOR),
        ('TEXTCOLOR', (2, 0), (2, -1), GRAY_COLOR),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 20))
    
    # AI Analysis Section
    analysis = contract.get('aiAnalysis', {})
    
    if analysis:
        story.append(HRFlowable(width="100%", thickness=1, color=GRAY_COLOR))
        story.append(Paragraph("AI Analysis", heading_style))
        
        # Summary
        if analysis.get('summary'):
            story.append(Paragraph("Summary", label_style))
            story.append(Paragraph(analysis['summary'], body_style))
            story.append(Spacer(1, 15))
        
        # Parties
        if analysis.get('parties'):
            story.append(Paragraph("Parties Involved", label_style))
            for party in analysis['parties']:
                story.append(Paragraph(f"• {party}", body_style))
            story.append(Spacer(1, 15))
        
        # Key Terms
        if analysis.get('keyTerms'):
            story.append(Paragraph("Key Terms", label_style))
            for term in analysis['keyTerms']:
                story.append(Paragraph(f"• {term}", body_style))
            story.append(Spacer(1, 15))
        
        # Risks
        if analysis.get('risks'):
            story.append(Paragraph("Identified Risks", label_style))
            for risk in analysis['risks']:
                risk_text = risk.get('risk', 'Unknown risk')
                severity = risk.get('severity', 'unknown')
                recommendation = risk.get('recommendation', '')
                story.append(Paragraph(
                    f"• <b>[{severity.upper()}]</b> {risk_text}",
                    body_style
                ))
                if recommendation:
                    story.append(Paragraph(
                        f"  <i>Recommendation: {recommendation}</i>",
                        body_style
                    ))
            story.append(Spacer(1, 15))
        
        # Recommendations
        if analysis.get('recommendations'):
            story.append(Paragraph("Recommendations", label_style))
            for rec in analysis['recommendations']:
                story.append(Paragraph(f"• {rec}", body_style))
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY_COLOR))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=GRAY_COLOR,
        alignment=TA_CENTER
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"Generated by LexiSense on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        footer_style
    ))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_analytics_pdf(stats: Dict[str, Any], contracts: List[Dict]) -> bytes:
    """Generate a PDF analytics report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=PRIMARY_COLOR,
        spaceAfter=20,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=PRIMARY_COLOR,
        spaceBefore=20,
        spaceAfter=10
    )
    
    story = []
    
    # Header
    story.append(Paragraph("LexiSense Analytics Report", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR))
    story.append(Spacer(1, 20))
    
    # Overview Stats
    story.append(Paragraph("Overview", heading_style))
    overview = stats.get('overview', {})
    
    overview_data = [
        ['Total Contracts', str(overview.get('totalContracts', 0))],
        ['Active Contracts', str(overview.get('activeContracts', 0))],
        ['Expiring Soon (30 days)', str(overview.get('expiringSoon', 0))],
        ['High Risk Contracts', str(overview.get('highRisk', 0))],
        ['Team Members', str(overview.get('teamMembers', 0))],
    ]
    
    overview_table = Table(overview_data, colWidths=[3*inch, 2*inch])
    overview_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
    ]))
    story.append(overview_table)
    
    # By Status
    if stats.get('byStatus'):
        story.append(Paragraph("Contracts by Status", heading_style))
        status_data = [['Status', 'Count']]
        for status, count in stats['byStatus'].items():
            status_data.append([status.capitalize(), str(count)])
        
        status_table = Table(status_data, colWidths=[3*inch, 2*inch])
        status_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
        ]))
        story.append(status_table)
    
    # By Risk
    if stats.get('byRisk'):
        story.append(Paragraph("Contracts by Risk Level", heading_style))
        risk_data = [['Risk Level', 'Count']]
        for risk, count in stats['byRisk'].items():
            risk_data.append([risk.capitalize(), str(count)])
        
        risk_table = Table(risk_data, colWidths=[3*inch, 2*inch])
        risk_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_COLOR),
        ]))
        story.append(risk_table)
    
    # Footer
    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY_COLOR))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=GRAY_COLOR,
        alignment=TA_CENTER
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        f"Generated by LexiSense on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        footer_style
    ))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
