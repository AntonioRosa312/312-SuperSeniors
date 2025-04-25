from django.db import models
from django.contrib.auth.models import User

class AuthToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, unique=True, null=True)  # SHA-256 is 64 characters
    created_at = models.DateTimeField(auto_now_add=True)
    profile_image = models.CharField(max_length=64, unique=True, null=True)  # SHA-256 is 64 characters


    def __str__(self):
        return f"AuthToken for {self.user.username}"

class Message(models.Model):
    sender = models.CharField(max_length=100)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.content[:25]}"
