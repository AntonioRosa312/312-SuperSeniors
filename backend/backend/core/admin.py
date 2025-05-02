from django.contrib import admin
from .models import AuthToken, Message, PlayerStats

@admin.register(AuthToken)
class AuthTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at")
    search_fields = ("user__username",)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "timestamp", "short_content")

    def short_content(self, obj):
        return obj.content[:40]
    short_content.short_description = "Content …"

@admin.register(PlayerStats)
class PlayerStatsAdmin(admin.ModelAdmin):
    list_display    = ("user", "holes_played", "shots_taken", "handicap")
    readonly_fields = ("handicap",)
    search_fields   = ("user__username",)
