
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
import html

# Token model (make sure this is in your models.py and migrated)
from .models import AuthToken


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


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