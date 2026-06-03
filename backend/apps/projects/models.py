from django.db import models
from django.conf import settings
from common.models import TimestampedModel


class Project(TimestampedModel):
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('locked', '已锁定'),
        ('archived', '已归档'),
    ]

    name = models.CharField(max_length=255, verbose_name='项目名称')
    client_name = models.CharField(max_length=255, verbose_name='客户名称')
    fiscal_year_end = models.DateField(verbose_name='会计年度结束日')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects',
        verbose_name='创建人'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='projects',
        blank=True,
        verbose_name='项目成员'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='状态'
    )

    class Meta:
        db_table = 'projects_project'
        verbose_name = '项目'
        verbose_name_plural = '项目'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.client_name})"
