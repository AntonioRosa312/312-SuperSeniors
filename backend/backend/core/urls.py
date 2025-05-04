from django.urls import path
from .views import player_stats

urlpatterns = [
    # matches GET /api/player-stats/<username>/
    path('player-stats/<str:username>/', player_stats, name='player-stats'),
]
