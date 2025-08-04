from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser with predefined credentials'

    def handle(self, *args, **options):
        try:
            with transaction.atomic():
                # Check if superuser already exists
                if User.objects.filter(is_superuser=True).exists():
                    self.stdout.write(
                        self.style.WARNING('Superuser already exists. Skipping creation.')
                    )
                    return

                # Create superuser
                user = User.objects.create_superuser(
                    email='admin@eshtarek.com',
                    password='admin123',
                    first_name='Admin',
                    last_name='User'
                )
                
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created superuser: {user.email}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            ) 