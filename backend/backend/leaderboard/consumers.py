# leaderboard/consumers.py
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

class LeaderboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "leaderboard"
        # Join leaderboard group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave leaderboard group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        if message_type == "request_leaderboard":
            await self.send_leaderboard_data()

    async def send_leaderboard_data(self):
        leaders = await get_leaderboard_data()
        await self.send(text_data=json.dumps({
            "type": "leaderboard",
            "leaders": leaders,
        }))
    async def leaderboard_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "leaderboard",
            "leaders": event["leaders"]
        }))

@database_sync_to_async
def get_leaderboard_data():
    from backend.lobby.models import LobbyStatus
    leaders = LobbyStatus.objects.filter(best_score__gt=0).order_by('best_score')
    payload = [
        {"player": entry.player_name, "score": entry.best_score}
        for entry in leaders
    ]
    return payload