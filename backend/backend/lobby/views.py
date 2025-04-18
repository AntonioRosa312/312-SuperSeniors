from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .models import LobbyStatus

def get_lobby_players(request):
    players = LobbyStatus.objects.all()
    data = [
        {
            "username": player.user.username,
            "color": player.color,
            "is_ready": player.is_ready,
            "hole": player.current_hole,
            "score": player.score
        }
        for player in players
    ]
    return JsonResponse({"players": data})
