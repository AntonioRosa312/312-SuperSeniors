import json
import secrets
import hashlib

from django.contrib.auth import authenticate
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now

from .models import AuthToken


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


class RegisterView(APIView):
    def post(self, request):
        from django.contrib.auth.models import User  # ✅ defer import

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
        from django.contrib.auth.models import User  # ✅ just in case of circular import

        data = request.data
        username = data.get('username')
        password = data.get('password')

        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'message': 'Invalid credentials'}, status=401)

        raw_token = secrets.token_urlsafe(32)
        hashed_token = hash_token(raw_token)

        AuthToken.objects.filter(user=user).delete()
        AuthToken.objects.create(user=user, token_hash=hashed_token, created_at=now())

        response = Response({'message': 'Login successful'})
        response.set_cookie(
            key='auth_token',
            value=raw_token,
            max_age=3600,
            httponly=True,
            samesite='Lax',
            secure=True  # set to False locally if not using HTTPS
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response


class CheckCookie(APIView):
    def get(self, request):
        from django.http import JsonResponse  # ✅ defer import to avoid conflict
        auth_token = request.COOKIES.get('auth_token')
        if auth_token:
            hashed_token = hash_token(auth_token)
            if AuthToken.objects.filter(token_hash=hashed_token).exists():
                return JsonResponse({'authenticated': True})
        return JsonResponse({'authenticated': False})


class Logout(APIView):
    def get(self, request):
        auth_token = request.COOKIES.get('auth_token')
        if auth_token:
            hashed_token = hash_token(auth_token)
            AuthToken.objects.filter(token_hash=hashed_token).delete()

            response = HttpResponse("You have been logged out!", status=200)
            response.delete_cookie('auth_token', samesite='Lax')
            return response
        return HttpResponse("Something went wrong, were you even logged in?", status=200)
