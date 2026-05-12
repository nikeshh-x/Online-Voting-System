import csv
import os
import re
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from accounts.models import Citizen

class Command(BaseCommand):
    help = 'Import citizens from a CSV file'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')
        parser.add_argument('--dry-run', action='store_true', help='Validate without inserting')
        parser.add_argument('--overwrite', action='store_true', help='Update existing citizens')
        parser.add_argument('--error-log', type=str, help='Path to save error log file')
    
    def validate_citizenship_format(self, number):
        """Validate Nepal citizenship number format"""
        cleaned = number.replace('-', '').replace(' ', '')
        if not cleaned.isdigit():
            return False
        if len(cleaned) < 8 or len(cleaned) > 15:
            return False
        return True
    
    def validate_date_format(self, date_string):
        """Validate date format YYYY-MM-DD"""
        try:
            return datetime.strptime(date_string, '%Y-%m-%d')
        except ValueError:
            return None
    
    def validate_gender(self, gender):
        return gender.upper() in ['M', 'F', 'O']
    
    def validate_ward_number(self, ward_str):
        try:
            ward = int(ward_str)
            if 1 <= ward <= 32:
                return ward
        except (ValueError, TypeError):
            pass
        return None
    
    def clean_text(self, text):
        if not text:
            return ''
        return ' '.join(text.split()).strip().title()
    
    def normalize_district(self, district):
        district_map = {
            'kathmandu': 'Kathmandu', 'ktm': 'Kathmandu',
            'lalitpur': 'Lalitpur', 'patan': 'Lalitpur',
            'bhaktapur': 'Bhaktapur',
        }
        return district_map.get(district.lower().strip(), district.title())
    
    def calculate_age(self, date_of_birth):
        today = datetime.now().date()
        age = today.year - date_of_birth.year
        if today.month < date_of_birth.month or (today.month == date_of_birth.month and today.day < date_of_birth.day):
            age -= 1
        return age
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']
        overwrite = options['overwrite']
        error_log_path = options.get('error_log')
        
        if not os.path.exists(csv_file):
            raise CommandError(f'File "{csv_file}" does not exist')
        
        self.stdout.write(f"📂 File: {csv_file}")
        self.stdout.write(f"🔍 Dry run: {'Yes' if dry_run else 'No'}")
        self.stdout.write("-" * 50)
        
        total = 0
        imported = 0
        updated = 0
        skipped = 0
        errors = []
        
        expected_headers = ['citizenship_number', 'full_name', 'date_of_birth', 'district',
                            'municipality', 'ward_number', 'father_name', 'mother_name', 'gender']
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            # Validate headers
            if not reader.fieldnames:
                raise CommandError("CSV has no headers")
            
            missing = set(expected_headers) - set(reader.fieldnames)
            if missing:
                raise CommandError(f"Missing headers: {missing}")
            
            for row_num, row in enumerate(reader, start=2):
                total += 1
                row_errors = []
                
                # Validate citizenship
                citizenship = self.clean_text(row.get('citizenship_number', ''))
                if not citizenship:
                    row_errors.append("Citizenship number required")
                elif not self.validate_citizenship_format(citizenship):
                    row_errors.append(f"Invalid format: {citizenship}")
                
                # Validate name
                full_name = self.clean_text(row.get('full_name', ''))
                if not full_name:
                    row_errors.append("Full name required")
                
                # Validate DOB and age
                dob_str = row.get('date_of_birth', '')
                dob = self.validate_date_format(dob_str)
                if not dob:
                    row_errors.append(f"Invalid date: {dob_str}")
                else:
                    age = self.calculate_age(dob)
                    if age < 18:
                        row_errors.append(f"Age {age} < 18 - not eligible")
                
                # Validate district
                district = self.normalize_district(row.get('district', ''))
                if not district:
                    row_errors.append("District required")
                
                # Validate gender
                gender = row.get('gender', '').upper()
                if not self.validate_gender(gender):
                    row_errors.append(f"Invalid gender: {gender}")
                
                # Validate ward
                ward = self.validate_ward_number(row.get('ward_number', ''))
                if row.get('ward_number') and ward is None:
                    row_errors.append(f"Invalid ward: {row.get('ward_number')}")
                
                if row_errors:
                    error_msg = f"Row {row_num}: {'; '.join(row_errors)}"
                    errors.append(error_msg)
                    self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                    skipped += 1
                    continue
                
                # Check existing
                existing = Citizen.objects.filter(citizenship_number=citizenship).first()
                if existing and not overwrite:
                    error_msg = f"Row {row_num}: {citizenship} already exists (use --overwrite)"
                    errors.append(error_msg)
                    self.stdout.write(self.style.WARNING(f"⚠️ {error_msg}"))
                    skipped += 1
                    continue
                
                if not dry_run:
                    try:
                        if existing and overwrite:
                            existing.full_name = full_name
                            existing.date_of_birth = dob
                            existing.district = district
                            existing.gender = gender
                            existing.save()
                            updated += 1
                            self.stdout.write(self.style.SUCCESS(f"🔄 Updated: {citizenship}"))
                        else:
                            Citizen.objects.create(
                                citizenship_number=citizenship,
                                full_name=full_name,
                                date_of_birth=dob,
                                district=district,
                                municipality=self.clean_text(row.get('municipality', '')),
                                ward_number=ward or 0,
                                father_name=self.clean_text(row.get('father_name', '')),
                                mother_name=self.clean_text(row.get('mother_name', '')),
                                gender=gender,
                                is_eligible=age >= 18,
                                is_registered=False
                            )
                            imported += 1
                            self.stdout.write(self.style.SUCCESS(f"✅ Imported: {citizenship}"))
                    except Exception as e:
                        error_msg = f"Row {row_num}: DB error - {str(e)}"
                        errors.append(error_msg)
                        self.stdout.write(self.style.ERROR(f"❌ {error_msg}"))
                        skipped += 1
                else:
                    self.stdout.write(f"🔍 Would import: {citizenship} - {full_name}")
                    imported += 1
        
        # Summary
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write(self.style.SUCCESS("📊 IMPORT SUMMARY"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"📄 Total rows: {total}")
        self.stdout.write(f"✅ Imported: {imported}")
        self.stdout.write(f"🔄 Updated: {updated}")
        self.stdout.write(f"⚠️ Skipped: {skipped}")
        
        if errors and error_log_path:
            with open(error_log_path, 'w') as log:
                log.write("\n".join(errors))
            self.stdout.write(f"📝 Error log: {error_log_path}")
        
        if dry_run:
            self.stdout.write("\n💡 Run without --dry-run to import")
