"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

application = ProtocolTypeRouter({
    # Route HTTP requests through Django
    "http": get_asgi_application(),

    # Route WebSocket connections through Django Channels
    "websocket": AuthMiddlewareStack(
        URLRouter(
            backend.lobby.routing.websocket_urlpatterns
        )
    ),
})