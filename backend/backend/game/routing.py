from django.urls import re_path
from . import consumer

websocket_urlpatterns = [
    re_path(r"ws/game/hole/(?P<hole_id>\d+)/$", consumer.GameConsumer.as_asgi()),
    re_path(r"ws/game/$", consumer.GameConsumer.as_asgi()),
]
