import json
from channels.generic.websocket import AsyncWebsocketConsumer
import hashlib
from backend.core.models import AuthToken
from channels.db import database_sync_to_async

@database_sync_to_async
def get_username(auth_token):
    token_hash = hashlib.sha256(auth_token.encode()).hexdigest()
    return AuthToken.objects.get(token_hash=token_hash).user.username

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "game_hole1"

        auth_token = self.scope['cookies'].get('auth_token')
        self.username = await get_username(auth_token)

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'player_joined',
            'username': self.username
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'player_left',
            'username': self.username
        })

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'move':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'player_update',
                'username': self.username,
                'x': data['x'],
                'y': data['y']
            })

        elif msg_type == 'putt':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'putt',
                'username': self.username,
                'angle': data['angle'],
                'power': data['power']
            })

    async def player_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def putt(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_joined',
            'username': event['username']
        }))

    async def player_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_left',
            'username': event['username']
        }))
