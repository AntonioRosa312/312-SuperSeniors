from django.db import models

from django.db import models
from django.contrib.auth.models import User

class LobbyStatus(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_ready = models.BooleanField(default=False)
    color = models.CharField(max_length=20, default='blue')

    current_hole = models.IntegerField(default=1)
    score = models.IntegerField(default=0)
    score_by_hole = models.JSONField(default=dict)  # e.g., {1: 4, 2: 3}

    last_updated = models.DateTimeField(auto_now=True)
    connected = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - Hole {self.current_hole} - {self.color} - Score {self.score}"
