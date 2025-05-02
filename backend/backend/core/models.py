from django.db import models
from django.contrib.auth.models import User

class AuthToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True, null=True)  # SHA-256 is 64 characters
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AuthToken for {self.user.username}"

class Message(models.Model):
    sender = models.CharField(max_length=100)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.content[:25]}"

class PlayerStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    holes_played = models.PositiveIntegerField(default=0)
    shots_taken  = models.PositiveIntegerField(default=0)

    @property
    def avg_strokes_per_hole(self) -> float:
        if self.holes_played == 0:
            return 0.0
        return self.shots_taken / self.holes_played

    @property
    def handicap(self) -> float:
        # Simple “handicap” = (avg strokes per hole − par) × scale
        par_per_hole = 4
        scale_factor = 113.0 / 120.0
        diff = self.avg_strokes_per_hole - par_per_hole
        return round(diff * scale_factor, 1)

    def __str__(self):
        return (
            f"{self.user.username} – "
            f"Holes: {self.holes_played}, "
            f"Shots: {self.shots_taken}, "
            f"Handicap: {self.handicap}"
        )