from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
import pymongo
import json
import bcrypt
import uuid
import hashlib
from .models import Users

def register(request):
    response = HttpResponse()

    body = json.loads(request.body)
    username = body.get("username")
    password = body.get("password")

    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)

    #generate auth token
    auth_token = str(uuid.uuid4())
    auth_token += str(uuid.uuid4())

    #hashed auth token #TODO store within database - brandon
    hash_auth_token = hashlib.sha256(auth_token.encode()).hexdigest()

    #hashed and salted password #TODO store within database - brandon
    salt = bcrypt.gensalt()
    hashed_salted_password = bcrypt.hashpw(password,salt)

    new_user = Users(username=username, auth_token=hash_auth_token, password=hashed_salted_password)
    new_user.save()  # Save the user to the database

    response.set_cookie("auth_token", auth_token, max_age=3600, httponly=True)
    response.content = "you have been registered!"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers['Content-Type'] = "text/plain"
    return response

def login(request):
    response = HttpResponse()
    body = request.body

    body = json.loads(request.body)
    username = body.get("username")
    password = body.get("password")

    # this is a check for if the username and password are not given
    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)

    try:
        # Retrieve user from the database based on the username
        user = Users.objects.get(username=username)
    except Users.DoesNotExist:
        return JsonResponse({"error": "Invalid username or password"}, status=400)

        # Check if the password matches
    if bcrypt.checkpw(password.encode(), user.password.encode()):
        # Generate a new auth token
        auth_token = str(uuid.uuid4())
        auth_token += str(uuid.uuid4())
        hash_auth_token = hashlib.sha256(auth_token.encode()).hexdigest()

        # Update the user's auth token
        user.auth_token = hash_auth_token
        user.save()

        return JsonResponse({"auth_token": auth_token})

    return JsonResponse({"error": "Invalid username or password"}, status=400)
