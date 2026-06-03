from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Extended user model for audit professionals."""
    email = models.EmailField(unique=True, verbose_name='邮箱')
    firm_name = models.CharField(max_length=255, blank=True, verbose_name='事务所名称')
    phone = models.CharField(max_length=30, blank=True, verbose_name='电话')
    is_admin = models.BooleanField(default=False, verbose_name='管理员')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.email
