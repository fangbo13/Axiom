from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Custom DRF exception handler returning structured error responses."""
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            'code': response.status_code,
            'message': '请求处理失败',
            'details': response.data,
        }
        response.data = error_payload
    else:
        # Unhandled exceptions
        response = Response(
            {
                'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': '服务器内部错误',
                'details': str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
