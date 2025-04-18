import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import hashlib




class LeaderboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "leaderboard"
        self.room_group_name = "lobby_group"
        pass

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        pass