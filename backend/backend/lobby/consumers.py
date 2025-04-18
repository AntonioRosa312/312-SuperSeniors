import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import hashlib

@database_sync_to_async
def get_user(auth_token):
    from backend.core.models import AuthToken
    user = AuthToken.objects.get(token_hash=auth_token)
    return user.user.username

players_list = []
class LobbyConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_name = "lobby"
        self.room_group_name = "lobby_group"

        # Grab the username from the authenticated user (if they are logged in)
        auth_token = hashlib.sha256(self.scope["cookies"].get("auth_token").encode()).hexdigest()
        username = await get_user(auth_token)
        self.username = username
        #add them to current waiting user list
        players_list.append(self.username)

        # Join the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Broadcast the updated players list to the group (other websockets)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_players_list',
                'players': players_list
            }
        )
        # Send a message back with the user's username
        await self.send(text_data=json.dumps({
            'type': 'username',
            'username': self.username
        }))

    async def disconnect(self, close_code):
        if self.username in players_list:
            players_list.remove(self.username)

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        # Broadcast the updated players list to the group (other websockets)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_players_list',
                'players': players_list
            }
        )



    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'request_players':
            await self.send(text_data=json.dumps({
                'type': 'players_list',
                'players': players_list
            }))

    async def send_players_list(self, event):
        players = event['players']
        await self.send(text_data=json.dumps({
            'type': 'players_list',
            'players': players
        }))