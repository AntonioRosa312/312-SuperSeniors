
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
import os
from django.conf import settings
from django.http import FileResponse, Http404


# Token model (make sure this is in your models.py and migrated)
from .models import AuthToken


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


class RegisterView(APIView):
    def post(self, request):
        data = request.data
        username = data.get('username')
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
        AuthToken.objects.filter(user=user).delete()
        AuthToken.objects.create(user=user, token_hash=hashed_token, created_at=now())

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


class Avatar(APIView):
    def get(self, request):
        auth_token = request.COOKIES.get('auth_token')
        if auth_token != None:
            hashed_token = hash_token(auth_token)
            query_obj = AuthToken.objects.get(token_hash=hashed_token)
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
                raise Http404("Profile image not found")
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
            save_path = os.path.join(settings.BASE_DIR, 'backend/core/profile_pics', filename)

            # Save file manually to disk
            with open(save_path, 'wb+') as destination:
                for chunk in avatar_file.chunks():
                    destination.write(chunk)

            # Save the filename in the model
            query_obj.profile_image = filename
            query_obj.save()
            return FileResponse(open(save_path, 'rb'), status=200)
        else:
            return HttpResponse("You are not signed in!", status=404)