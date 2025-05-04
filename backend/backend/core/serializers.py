# backend/core/serializers.py
from rest_framework import serializers
from .models import PlayerStats

class PlayerStatsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    handicap = serializers.FloatField(read_only=True)

    class Meta:
        model = PlayerStats
        fields = ("username", "holes_played", "shots_taken", "handicap")
