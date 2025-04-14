import logging
from datetime import datetime

logger = logging.getLogger("request_logger")

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = request.META.get('REMOTE_ADDR', 'unknown')
        method = request.method
        path = request.get_full_path()
        timestamp = datetime.utcnow().isoformat()

        logger.info(f"{timestamp} | IP: {ip} | Method: {method} | Path: {path}")
        return self.get_response(request)
