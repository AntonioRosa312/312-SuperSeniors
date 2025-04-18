from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import LobbyStatus

@admin.register(LobbyStatus)
class LobbyStatusAdmin(admin.ModelAdmin):
    list_display = ("user", "is_ready", "color", "current_hole", "score", "last_updated")
    search_fields = ("user__username",)
    list_filter = ("is_ready", "color", "current_hole")
