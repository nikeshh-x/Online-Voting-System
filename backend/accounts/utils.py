from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid


def generate_email_verification_token():
    """Generate a unique email verification token"""
    return str(uuid.uuid4())


def send_verification_email(user, request):
    """Send verification email to user"""
    # Generate token if not exists
    if not user.email_verification_token:
        user.email_verification_token = generate_email_verification_token()
        user.save()
    
    # Build verification URL
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verification_url = f"{frontend_url}/verify-email/{user.email_verification_token}/"
    
    # Email context
    context = {
        'user': user,
        'verification_url': verification_url,
        'expiry_hours': 24,
    }
    
    # Render HTML email
    html_message = render_to_string('emails/verification_email.html', context)
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject='Verify Your Email - Online Voting System',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_welcome_email(user):
    """Send welcome email after verification"""
    context = {
        'user': user,
    }
    
    html_message = render_to_string('emails/welcome_email.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject='Welcome to Online Voting System!',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )