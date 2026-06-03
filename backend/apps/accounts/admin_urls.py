from django.urls import path
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdminUser
from .models import User
from .serializers import UserSerializer


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        total_admins = User.objects.filter(is_admin=True).count()
        recent_users = User.objects.order_by('-date_joined')[:5]
        return Response({
            'total_users': total_users,
            'total_admins': total_admins,
            'recent_users': UserSerializer(recent_users, many=True).data,
        })


class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('users/', AdminUserListView.as_view(), name='admin_users'),
]
