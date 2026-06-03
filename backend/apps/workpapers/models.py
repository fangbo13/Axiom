from django.db import models
from django.conf import settings
from common.models import TimestampedModel


class Workpaper(TimestampedModel):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('review', '复核中'),
        ('finalised', '已审定'),
    ]

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='workpapers',
        verbose_name='项目'
    )
    wp_number = models.CharField(max_length=50, verbose_name='底稿编号')
    title = models.CharField(max_length=255, verbose_name='标题')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='状态'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_workpapers',
        verbose_name='负责人'
    )
    due_date = models.DateField(null=True, blank=True, verbose_name='截止日期')
    content = models.JSONField(default=dict, verbose_name='内容')

    class Meta:
        db_table = 'workpapers_workpaper'
        verbose_name = '审计底稿'
        verbose_name_plural = '审计底稿'
        ordering = ['wp_number']

    def __str__(self):
        return f"{self.wp_number} - {self.title}"
