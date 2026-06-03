from django.db import models
from common.models import TimestampedModel


class NoteDraft(TimestampedModel):
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='note_drafts',
        verbose_name='项目'
    )
    note_number = models.CharField(max_length=20, verbose_name='附注编号')
    title = models.CharField(max_length=255, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    linked_workpapers = models.ManyToManyField(
        'workpapers.Workpaper',
        blank=True,
        related_name='linked_notes',
        verbose_name='关联底稿'
    )

    class Meta:
        db_table = 'notes_notedraft'
        verbose_name = '附注草稿'
        verbose_name_plural = '附注草稿'
        ordering = ['note_number']

    def __str__(self):
        return f"{self.note_number} - {self.title}"
