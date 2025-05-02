
import json
import secrets
import hashlib

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from django.db import models
from backend.lobby.models import LobbyStatus
import html
import os
from django.conf import settings
from django.http import FileResponse, Http404
from PIL import Image

# Token model (make sure this is in your models.py and migrated)
from .models import AuthToken


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()

def crop(image_path, size=(100, 100)):
    """Crop the image to a square and resize to the target size."""
    with Image.open(image_path) as img:
        width, height = img.size
        min_dim = min(width, height)

        left = (width - min_dim) // 2
        top = (height - min_dim) // 2
        right = (width + min_dim) // 2
        bottom = (height + min_dim) // 2

        img_cropped = img.crop((left, top, right, bottom)).resize(size)
        img_cropped.save(image_path)
class RegisterView(APIView):
    def post(self, request):
        data = request.data
        username = html.escape(data.get('username'))
        password = data.get('password')

        if not username or not password:
            return Response({'message': 'Username and password required'}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({'message': 'Username already exists'}, status=400)

        User.objects.create_user(username=username, password=password)
        return Response({'message': 'User registered successfully'}, status=201)


class LoginView(APIView):
    def post(self, request):
        data = request.data
        username = data.get('username')
        password = data.get('password')

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'message': 'Invalid credentials'}, status=401)

        # Generate and hash token
        raw_token = secrets.token_urlsafe(32)
        hashed_token = hash_token(raw_token)

        # Store the hashed token
        existing_token = AuthToken.objects.filter(user=user).first()
        AuthToken.objects.filter(user=user).delete()

        #preserves old profile pic if there was one
        AuthToken.objects.create(user=user, token_hash=hashed_token, created_at=now(), profile_image=existing_token.profile_image if existing_token else None, ball_image=existing_token.ball_image if existing_token else None )

        # Set cookie and return response
        response = Response({'message': 'Login successful'})
        response.set_cookie(
            key='auth_token',
            value=raw_token,
            max_age=3600,
            httponly=True,
            samesite='Lax',
            secure=False  # Set to True if you're using HTTPS
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

class CheckCookie(APIView):
    from django.http import JsonResponse
    from django.contrib.auth.models import User
    def get(self, request):
        auth_token = request.COOKIES.get('auth_token')
        if auth_token:
            hashed_token = hash_token(auth_token)
            AuthToken.objects.filter(token_hash=hashed_token).exists()
            if AuthToken.objects.filter(token_hash=hashed_token).exists():
                return JsonResponse({'authenticated': True})

        return JsonResponse({'authenticated': False})

class Logout(APIView):
    def get(self, request):
        auth_token = request.COOKIES.get('auth_token')
        if auth_token != None:
            hashed_token = hash_token(auth_token)
            query_obj = AuthToken.objects.get(token_hash=hashed_token)
            query_obj.token_hash = None
            query_obj.save()
            response = HttpResponse("You have been logged out!", status=200)
            response.delete_cookie('auth_token', samesite='Lax')
            return response
        else:
            return HttpResponse("Something went wrong, were you even logged in?", status=200)


class Leaderboard(APIView):
    def post(self, request):

        all_lobby_statuses = LobbyStatus.objects.select_related('user').all()

        body = json.loads(request.body)
        username = body.get("username")
        total_shots = body.get("totalShots")
        # Loop through all and find the matching one
        matching_status = None
        for status in all_lobby_statuses:
            if status.user.username == username:
                matching_status = status
                break

        if matching_status:
            # Now you can update the best score
            if (matching_status.best_score == 0) or (matching_status.best_score > total_shots):
                matching_status.best_score = total_shots
                matching_status.save()
                return HttpResponse("Best score updated", status=200)
            else:
                return HttpResponse("That wasn't their best score", status=201)
        else:
            return HttpResponse("Player not found", status=404)


class Avatar(APIView):
    def get(self, request):
        auth_token = request.COOKIES.get('auth_token')
        if auth_token != None:
            hashed_token = hash_token(auth_token)
            query_obj = AuthToken.objects.get(token_hash=hashed_token)
            query_obj.refresh_from_db()
            filename = query_obj.profile_image
            if filename != None:
                file_path = os.path.join(settings.BASE_DIR, 'backend/core/profile_pics', filename)
                # Check if file exists
                if os.path.exists(file_path):
                    # Return the image file as a response
                    return FileResponse(open(file_path, 'rb'), status=200)
                else:
                    # Return a 404 error if the image doesn't exist
                    raise Http404("Profile image not found")
            else:
                # Return a 404 error if the image doesn't exist
                raise Http404("Profile filename not found")
        else:
            return HttpResponse("You are not signed in!", status=404)

    def post(self, request):

        auth_token = request.COOKIES.get('auth_token')
        if auth_token != None:
            hashed_token = hash_token(auth_token)
            query_obj = AuthToken.objects.get(token_hash=hashed_token)
            avatar_file = request.FILES.get('avatar')
            if not avatar_file:
                return HttpResponse("No file uploaded", status=400)
            filename = f"{query_obj.user.username}_avatar_{avatar_file.name}"
            player_ball_filename = f"{query_obj.user.username}_ball_{avatar_file.name}"
            save_path = os.path.join(settings.BASE_DIR, 'backend/core/profile_pics', filename)
            save_ball_path = os.path.join(settings.BASE_DIR, 'backend/core/ball_pics', player_ball_filename)
            # Save files manually to disk
            with open(save_path, 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)

            with open(save_ball_path, 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)

            # Save the filename in the model
            query_obj.profile_image = filename
            query_obj.ball_image = player_ball_filename
            query_obj.save()

            # Crop and resize the image
            try:
                crop(save_ball_path)
            except Exception as e:
                return HttpResponse(f"Image processing failed: {e}", status=500)


            return FileResponse(open(save_path, 'rb'), status=200)
        else:
            return HttpResponse("You are not signed in!", status=404)