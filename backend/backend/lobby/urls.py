from django.urls import path
from . import views

urlpatterns = [
    path("players/", views.get_lobby_players, name="get_lobby_players"),
]
