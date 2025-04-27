import logging
from datetime import datetime

logger = logging.getLogger("request_logger")

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip = self.get_client_ip(request)
        method = request.method
        path = request.get_full_path()
        timestamp = datetime.utcnow().isoformat()

        logger.info(f"{timestamp} | IP: {ip} | Method: {method} | Path: {path}")
    
        return self.get_response(request)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
