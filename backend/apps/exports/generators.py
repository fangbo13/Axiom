import io
import zipfile
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


def generate_workpaper_pdf(workpaper) -> bytes:
    """Generate a PDF for a single workpaper."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"<b>审计底稿: {workpaper.wp_number}</b>", styles['Title']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"标题: {workpaper.title}", styles['Normal']))
    story.append(Paragraph(f"状态: {workpaper.get_status_display()}", styles['Normal']))
    story.append(Spacer(1, 12))

    # Content placeholder
    content = workpaper.content or {}
    for key, value in content.items():
        story.append(Paragraph(f"<b>{key}:</b> {value}", styles['Normal']))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_trial_balance_pdf(project) -> bytes:
    """Generate a PDF trial balance report."""
    from apps.trial_balance.models import TrialBalanceSnapshot

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"<b>试算平衡表</b>", styles['Title']))
    story.append(Paragraph(f"项目: {project.name}", styles['Normal']))
    story.append(Spacer(1, 12))

    data = [['科目代码', '科目名称', '借方', '贷方']]
    snapshots = TrialBalanceSnapshot.objects.filter(project=project).select_related('account')
    for snap in snapshots:
        data.append([
            snap.account.code,
            snap.account.name,
            str(snap.adjusted_debit),
            str(snap.adjusted_credit),
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    story.append(table)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_export_zip(project) -> io.BytesIO:
    """Generate a ZIP containing all workpapers and TB as PDFs."""
    from apps.workpapers.models import Workpaper

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Workpapers
        for wp in Workpaper.objects.filter(project=project):
            pdf_bytes = generate_workpaper_pdf(wp)
            zf.writestr(f"workpapers/{wp.wp_number}_{wp.title}.pdf", pdf_bytes)

        # Trial Balance
        tb_bytes = generate_trial_balance_pdf(project)
        zf.writestr("trial_balance/trial_balance.pdf", tb_bytes)

    buffer.seek(0)
    return buffer
