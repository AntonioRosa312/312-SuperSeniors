
import json
import secrets
import hashlib

from rest_framework.decorators import api_view
from .serializers import PlayerStatsSerializer

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
from ..core.models import PlayerStats



import os
from django.views.decorators.http import require_GET
from django.utils.decorators import method_decorator
# Token model (make sure this is in your models.py and migrated)
from .models import AuthToken

@api_view(["GET"])
def player_stats(request, username):
    """
    GET /api/player-stats/<username>/
    """
    try:
        stats = PlayerStats.objects.get(user__username=username)
    except PlayerStats.DoesNotExist:
        return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = PlayerStatsSerializer(stats)
    return Response(serializer.data, status=status.HTTP_200_OK)


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

        # 🔽 Add the new user to achievements.json
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            json_path = os.path.join(base_dir, 'achievements', 'achievements.json')

            with open(json_path, 'r') as f:
                data = json.load(f)

            if 'users' not in data:
                data['users'] = {}

            if username not in data['users']:
                data['users'][username] = []

            with open(json_path, 'w') as f:
                json.dump(data, f, indent=2)

        except Exception as e:
            print("⚠️ Failed to update achievements.json:", e)

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
    def get(self, request):
        auth_token = request.COOKIES.get('auth_token')
        if auth_token:
            hashed_token = hash_token(auth_token)
            token = AuthToken.objects.filter(token_hash=hashed_token).first()
            if token:
                return JsonResponse({
                    'authenticated': True,
                    'username': token.user.username  # ✅ include username
                })

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
        total_holes = body.get("totalHoles")



        # Loop through all and find the matching one
        matching_status = None
        for status in all_lobby_statuses:
            if status.user.username == username:
                matching_status = status
                break

        if matching_status:
            # Now you can update the best score
            # ─── NEW: bump the cumulative counters ───
            stats, _ = PlayerStats.objects.get_or_create(user=matching_status.user)
            stats.shots_taken += int(total_shots)
            stats.holes_played += int(total_holes)
            stats.save()
            # ─────────────────────────────────────────

            if (matching_status.best_score == 0) or (matching_status.best_score > total_shots):
                matching_status.best_score = total_shots
                matching_status.save()


                return HttpResponse("Best score updated", status=200)
            else:
                return HttpResponse("That wasn't their best score", status=201)
        else:
            return HttpResponse("Player not found", status=404)


class AchievementsView(APIView):
    def get(self, request):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_path = os.path.join(base_dir, 'achievements', 'achievements.json')

        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            return Response(data)
        except FileNotFoundError:
            return Response({'error': 'Achievements file not found'}, status=404)
        except json.JSONDecodeError:
            return Response({'error': 'Invalid achievements JSON format'}, status=500)
        
    def post(self, request):
        try:
            payload = json.loads(request.body)
            username = payload.get('username')
            achievement_key = payload.get('achievement_key')
            print("👀 POST payload:", payload)

            if not username or not achievement_key:
                return JsonResponse({'error': 'Missing username or achievement_key'}, status=400)

            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            json_path = os.path.join(base_dir, 'achievements', 'achievements.json')

            with open(json_path, 'r') as f:
                data = json.load(f)

            if achievement_key not in [a['key'] for a in data['achievements']]:
                return JsonResponse({'error': 'Invalid achievement key'}, status=400)

            if username not in data['users']:
                data['users'][username] = []

            if achievement_key not in data['users'][username]:
                data['users'][username].append(achievement_key)

            with open(json_path, 'w') as f:
                json.dump(data, f, indent=2)

            return JsonResponse({'status': 'achievement unlocked'})

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except FileNotFoundError:
            return JsonResponse({'error': 'Achievements file not found'}, status=404)          


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

               

class Avatar_ball(APIView):
    def get(self, request):
        username = request.GET.get('username')
        if not username:
            return HttpResponse("Username is required", status=400)

        try:
            token_obj = AuthToken.objects.select_related('user').get(user__username=username)
            filename = token_obj.ball_image
            if not filename:
                raise Http404("No profile image set")

            file_path = os.path.join(settings.BASE_DIR, 'backend/core/ball_pics', filename)
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'), status=200)
                response['Cache-Control'] = 'no-store, no-cache, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                return response
            else:
                raise Http404("Profile image file not found")
        except AuthToken.DoesNotExist:
            raise Http404("User profile not found")
