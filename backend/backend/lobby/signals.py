
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from backend.leaderboard.consumers import get_leaderboard_data  # Your async leaderboard fetcher
from .models import LobbyStatus

@receiver(post_save, sender=LobbyStatus)
def leaderboard_update_signal(sender, instance, **kwargs):
    print(f"[DEBUG] leaderboard_update_signal fired for user={instance.user.username} best_score={instance.best_score}")
    # Only trigger if there's a valid best_score (e.g., not 0)
    if instance.best_score > 0:
        channel_layer = get_channel_layer()
        leaderboard_data = async_to_sync(get_leaderboard_data)()
        # Call the async leaderboard fetcher to get the updated data
        async_to_sync(channel_layer.group_send)(
            "leaderboard",
            {
                "type": "leaderboard_update",  # Custom event
                "leaders": leaderboard_data  # Get leaderboard data asynchronously
            }
        )