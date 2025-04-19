"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os

from channels.sessions import SessionMiddlewareStack
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from backend.lobby.consumers import LobbyConsumer
from backend.leaderboard.consumers import LeaderboardConsumer
from backend.game.consumer import GameConsumer
from django.urls import path


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": SessionMiddlewareStack(AuthMiddlewareStack(
        URLRouter([
            path("ws/lobby/", LobbyConsumer.as_asgi()),  # This will route the websocket to the consumer
            path("ws/leaderboard/", LeaderboardConsumer.as_asgi()),  # This will route the websocket to the consumer
            path("ws/game/", GameConsumer.as_asgi()),

        ])
    ),
    )
})