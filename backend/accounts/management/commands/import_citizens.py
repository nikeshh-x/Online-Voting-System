import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from accounts.models import Citizen

class Command(BaseCommand):
    help = 'Import citizens from a CSV file'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validate without inserting into database',
        )
        parser.add_argument(
            '--overwrite',
            action='store_true',
            help='Update existing citizens',
        )
    
    def validate_date_format(self, date_string):
        """Validate date format YYYY-MM-DD"""
        try:
            datetime.strptime(date_string, '%Y-%m-%d')
            return True
        except ValueError:
            return False
    
    def validate_gender(self, gender):
        """Validate gender value"""
        return gender.upper() in ['M', 'F', 'O']
    
    def calculate_age(self, date_of_birth):
        """Calculate age from date of birth"""
        today = datetime.now().date()
        dob = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
        age = today.year - dob.year
        if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
            age -= 1
        return age
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']
        overwrite = options['overwrite']
        
        # Check if file exists
        if not os.path.exists(csv_file):
            raise CommandError(f'File "{csv_file}" does not exist')
        
        self.stdout.write(f"📂 Reading file: {csv_file}")
        self.stdout.write(f"🔍 Dry run: {'Yes' if dry_run else 'No'}")
        self.stdout.write(f"✏️ Overwrite: {'Yes' if overwrite else 'No'}")
        self.stdout.write("-" * 50)
        
        # Statistics
        total_rows = 0
        imported = 0
        skipped = 0
        errors = []
        
        # Expected CSV headers
        expected_headers = [
            'citizenship_number', 'full_name', 'date_of_birth', 'district',
            'municipality', 'ward_number', 'father_name', 'mother_name', 'gender'
        ]
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                # Validate headers
                headers = reader.fieldnames
                if not headers or set(expected_headers) != set(headers):
                    self.stdout.write(self.style.ERROR(f"Invalid CSV headers!"))
                    self.stdout.write(f"Expected: {expected_headers}")
                    self.stdout.write(f"Found: {headers}")
                    return
                
                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    total_rows += 1
                    self.stdout.write(f"\n📝 Processing row {row_num}...")
                    
                    # Validate required fields
                    required_fields = ['citizenship_number', 'full_name', 'date_of_birth', 'district', 'gender']
                    missing_fields = [f for f in required_fields if not row.get(f)]
                    if missing_fields:
                        error_msg = f"Row {row_num}: Missing required fields: {missing_fields}"
                        errors.append(error_msg)
                        self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                        skipped += 1
                        continue
                    
                    # Validate date format
                    if not self.validate_date_format(row['date_of_birth']):
                        error_msg = f"Row {row_num}: Invalid date format: {row['date_of_birth']}. Use YYYY-MM-DD"
                        errors.append(error_msg)
                        self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                        skipped += 1
                        continue
                    
                    # Validate gender
                    if not self.validate_gender(row['gender']):
                        error_msg = f"Row {row_num}: Invalid gender: {row['gender']}. Use M, F, or O"
                        errors.append(error_msg)
                        self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                        skipped += 1
                        continue
                    
                    # Calculate age and determine eligibility
                    age = self.calculate_age(row['date_of_birth'])
                    is_eligible = age >= 18
                    
                    # Check if citizen already exists
                    existing = Citizen.objects.filter(citizenship_number=row['citizenship_number']).first()
                    
                    if existing and not overwrite:
                        error_msg = f"Row {row_num}: Citizenship number {row['citizenship_number']} already exists (skipped)"
                        errors.append(error_msg)
                        self.stdout.write(self.style.WARNING(f"⚠️ {error_msg}"))
                        skipped += 1
                        continue
                    
                    if not dry_run:
                        try:
                            if existing and overwrite:
                                # Update existing citizen
                                existing.full_name = row['full_name']
                                existing.date_of_birth = row['date_of_birth']
                                existing.district = row['district']
                                existing.municipality = row.get('municipality', '')
                                existing.ward_number = int(row.get('ward_number', 0)) if row.get('ward_number') else 0
                                existing.father_name = row.get('father_name', '')
                                existing.mother_name = row.get('mother_name', '')
                                existing.gender = row['gender'].upper()
                                existing.is_eligible = is_eligible
                                existing.save()
                                self.stdout.write(self.style.SUCCESS(f"✅ Updated: {row['citizenship_number']}"))
                            else:
                                # Create new citizen
                                Citizen.objects.create(
                                    citizenship_number=row['citizenship_number'],
                                    full_name=row['full_name'],
                                    date_of_birth=row['date_of_birth'],
                                    district=row['district'],
                                    municipality=row.get('municipality', ''),
                                    ward_number=int(row.get('ward_number', 0)) if row.get('ward_number') else 0,
                                    father_name=row.get('father_name', ''),
                                    mother_name=row.get('mother_name', ''),
                                    gender=row['gender'].upper(),
                                    is_eligible=is_eligible,
                                    is_registered=False
                                )
                                self.stdout.write(self.style.SUCCESS(f"✅ Imported: {row['citizenship_number']}"))
                            imported += 1
                        except Exception as e:
                            error_msg = f"Row {row_num}: Database error: {str(e)}"
                            errors.append(error_msg)
                            self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                            skipped += 1
                    else:
                        self.stdout.write(self.style.SUCCESS(f"✅ Would import: {row['citizenship_number']}"))
                        imported += 1
                    
        except FileNotFoundError:
            raise CommandError(f'File "{csv_file}" not found')
        except Exception as e:
            raise CommandError(f'Error reading CSV: {str(e)}')
        
        # Print summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("📊 IMPORT SUMMARY"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"📄 Total rows processed: {total_rows}")
        self.stdout.write(f"✅ Successfully imported: {imported}")
        self.stdout.write(f"⚠️ Skipped: {skipped}")
        
        if errors:
            self.stdout.write(f"\n❌ Errors ({len(errors)}):")
            for error in errors[:10]:  # Show first 10 errors
                self.stdout.write(f"  • {error}")
            if len(errors) > 10:
                self.stdout.write(f"  ... and {len(errors) - 10} more errors")
        
        if dry_run:
            self.stdout.write("\n💡 Run without --dry-run to actually import the data")
        
        self.stdout.write("=" * 50)