from django.core.cache import cache
from django.utils import timezone

def store_verified_citizen(citizenship_number, full_name):
    """Store verified citizen data temporarily"""
    token = str(citizenship_number)
    cache.set(token, {
        'citizenship_number': citizenship_number,
        'full_name': full_name,
        'timestamp': timezone.now().isoformat()
    }, timeout=300)  # 5 minutes
    print(f"DEBUG: Stored token: {token}")  # Debug
    return token

def get_verified_citizen(token):
    """Retrieve verified citizen data"""
    data = cache.get(token)
    print(f"DEBUG: Retrieving token {token}: {data}")  # Debug
    return data

def clear_verified_citizen(token):
    """Clear verified citizen data"""
    cache.delete(token)
