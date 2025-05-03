"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from backend.core.views import LoginView, RegisterView, CheckCookie, Logout, Leaderboard, AchievementsView 

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/login', LoginView.as_view()),
    path('', TemplateView.as_view(template_name="index.html")),
    path("api/register", RegisterView.as_view()),
    path("api/check_cookie", CheckCookie.as_view()),
    path("api/logout", Logout.as_view()),
    path("api/leaderboard", Leaderboard.as_view()),
    path("lobby/", include("backend.lobby.urls")),
    path('achievements/', AchievementsView.as_view()),
    path('api/achievements/', AchievementsView.as_view()),
]

