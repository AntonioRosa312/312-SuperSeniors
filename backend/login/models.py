from django.db import models

# Create your models here.
class Users(models.Model): #user database
    username = models.CharField(max_length=150, unique=True)
    auth_token = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username}"