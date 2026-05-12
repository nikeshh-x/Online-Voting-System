from django.core.cache import cache
from django.utils import timezone

def store_verified_citizen(citizenship_number, full_name):
    """Store verified citizen data temporarily"""
    # Use citizenship number as token (in production, use UUID)
    token = str(citizenship_number)
    cache.set(token, {
        'citizenship_number': citizenship_number,
        'full_name': full_name,
        'timestamp': timezone.now().isoformat()
    }, timeout=300)  # 5 minutes
    return token

def get_verified_citizen(token):
    """Retrieve verified citizen data"""
    return cache.get(token)

def clear_verified_citizen(token):
    """Clear verified citizen data"""
    cache.delete(token)