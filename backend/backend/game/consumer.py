import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import hashlib

@database_sync_to_async
def get_username(auth_token):
    from backend.core.models import AuthToken  # 🔒 Safe model import
    token_hash = hashlib.sha256(auth_token.encode()).hexdigest()
    return AuthToken.objects.get(token_hash=token_hash).user.username


class GameConsumer(AsyncWebsocketConsumer):
    # Dictionary to track players and their current hole
    player_holes = {}

    async def connect(self):
        #self.room_group_name = "game_room"
        self.hole = self.scope["url_route"]["kwargs"]["hole_id"]
        self.room_group_name = f"game_hole_{self.hole}"

        # 🔐 Get username from cookie token
        auth_token = self.scope["cookies"].get("auth_token")
        if auth_token:
            try:
                self.username = await get_username(auth_token)
            except Exception as e:
                await self.close()
                return
        else:
            self.username = "Guest"

        # 📡 Join game group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # ✅ Notify client who they are
        await self.send(text_data=json.dumps({
            'type': 'connection_success',
            'username': self.username
        }))

        # Initialize player's hole (start at Hole 1 by default)
        self.player_holes[self.username] = 1  # Hole 1
        # Notify all players on the same hole about the new player
        #await self.send_to_hole(self.username, 1)

    async def disconnect(self, close_code):
        # Remove player from hole tracking when they disconnect
        self.player_holes.pop(self.username, None)

        # 📣 Notify others that this player left
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_left',
                'username': self.username
            }
        )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'start_game':
            hole = data.get('hole', 1)
            GameConsumer.player_holes[self.username] = hole
            await self.send(text_data=json.dumps({
                'type': 'game_start',
                'hole': hole
            }))

        if message_type == 'move':
            await self.handle_move(data)

        elif message_type == 'putt':
            await self.handle_putt(data)

        elif message_type == 'chat':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'username': self.username,
                    'message': data.get('message')
                }
            )

    async def handle_move(self, data):
        hole = self.player_holes.get(self.username, 1)
        # 🟢 Broadcast player movement
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_moved',
                'username': self.username,
                'x': data.get('x'),
                'y': data.get('y'),
                'hole': hole,
            }
        )

    async def handle_putt(self, data):
        hole = self.player_holes.get(self.username, 1)
        # ⛳ Broadcast putt action
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_putt',
                'username': self.username,
                'angle': data.get('angle'),
                'power': data.get('power'),
                'hole': hole
            }
        )

    # 🧩 Handler: movement
    async def player_moved(self, event):
        hole = event['hole']
        if self.player_holes.get(self.username) == hole:

            await self.send(text_data=json.dumps({
                'type': 'player_moved',
                'username': event['username'],
                'x': event['x'],
                'y': event['y'],
            }))

    # 🧩 Handler: putt
    async def player_putt(self, event):
        hole = event['hole']
        if self.player_holes.get(self.username) == hole:

            await self.send(text_data=json.dumps({
                'type': 'player_putt',
                'username': event['username'],
                'angle': event['angle'],
                'power': event['power']
            }))

    # 🧩 Handler: chat
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'username': event['username'],
            'message': event['message']
        }))

    # 🧩 Handler: player left
    async def player_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_left',
            'username': event['username']
        }))