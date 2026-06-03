from rest_framework import permissions


class IsProjectMember(permissions.BasePermission):
    """Allow access only if the user is a member of the project."""

    def has_permission(self, request, view):
        # Allow list/create if project membership is checked at object level
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'project'):
            return request.user in obj.project.members.all() or obj.project.created_by == request.user
        if hasattr(obj, 'members'):
            return request.user in obj.members.all() or obj.created_by == request.user
        return False


class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'is_admin', False)
