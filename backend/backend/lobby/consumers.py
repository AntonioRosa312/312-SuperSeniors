import json
import hashlib
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

@database_sync_to_async
def get_username(auth_token):
    from backend.core.models import AuthToken
    user = AuthToken.objects.get(token_hash=auth_token)
    return user.user.username

@database_sync_to_async
def get_or_create_lobby_status(username):
    from django.contrib.auth.models import User
    from .models import LobbyStatus
    user = User.objects.get(username=username)
    lobby_status, _ = LobbyStatus.objects.get_or_create(user=user)
    return lobby_status

@database_sync_to_async
def update_color(username, new_color):
    from django.contrib.auth.models import User
    from .models import LobbyStatus
    user = User.objects.get(username=username)
    lobby_status, _ = LobbyStatus.objects.get_or_create(user=user)
    lobby_status.color = new_color
    lobby_status.save()

@database_sync_to_async
def toggle_ready(username):
    from django.contrib.auth.models import User
    from .models import LobbyStatus
    user = User.objects.get(username=username)
    lobby_status, _ = LobbyStatus.objects.get_or_create(user=user)
    lobby_status.is_ready = not lobby_status.is_ready
    lobby_status.save()
    return lobby_status.is_ready

@database_sync_to_async
def mark_user_connected(username, connected=True):
    from django.contrib.auth.models import User
    from .models import LobbyStatus
    user = User.objects.get(username=username)
    lobby_status, _ = LobbyStatus.objects.get_or_create(user=user)
    lobby_status.connected = connected
    lobby_status.save()

@database_sync_to_async
def get_all_players():
    from .models import LobbyStatus
    players = LobbyStatus.objects.filter(connected=True)
    return [
        {
            "username": p.user.username,
            "color": p.color,
            "is_ready": p.is_ready,
            "hole": p.current_hole,
            "score": p.score,
            "best_score": p.best_score,
        }
        for p in players
    ]

class LobbyConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_group_name = "lobby_group"

        auth_token = hashlib.sha256(
            self.scope["cookies"].get("auth_token").encode()
        ).hexdigest()
        self.username = await get_username(auth_token)

        await get_or_create_lobby_status(self.username)
        await mark_user_connected(self.username, True)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        await self.broadcast_lobby_state()
        print(f"[WebSocket] Connected: {self.username}")
        await self.send(text_data=json.dumps({
            'type': 'username',
            'username': self.username
        }))

    async def disconnect(self, close_code):
        await mark_user_connected(self.username, False)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.broadcast_lobby_state()

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'set_color':
            await update_color(self.username, data.get("color"))
            await self.broadcast_lobby_state()

        elif message_type == 'toggle_ready':
            await toggle_ready(self.username)
            await self.broadcast_lobby_state()

        elif message_type == 'request_players':
            await self.send_lobby_state()

    async def send_lobby_state(self):
        players = await get_all_players()
        await self.send(text_data=json.dumps({
            'type': 'players_list',
            'players': players
        }))

    async def broadcast_lobby_state(self):
        players = await get_all_players()
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_players_list',
                'players': players
            }
        )

    async def send_players_list(self, event):
        await self.send(text_data=json.dumps({
            'type': 'players_list',
            'players': event['players']
        }))
