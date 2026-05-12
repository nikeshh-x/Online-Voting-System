import csv
import random
from datetime import datetime, timedelta

# Sample data pools
first_names = ['Ram', 'Sita', 'Hari', 'Gita', 'Bikram', 'Sunita', 'Krishna', 'Mina', 'Shyam', 'Radha', 
               'Prakash', 'Laxmi', 'Rajesh', 'Sima', 'Mohan', 'Rita', 'Suresh', 'Uma', 'Nabin', 'Sujata']
last_names = ['Sharma', 'Gurung', 'Thapa', 'Karki', 'Manandhar', 'Rai', 'Tamang', 'Adhikari', 'Poudel', 'Bhandari']

districts = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Chitwan', 'Dhading', 'Kaski', 'Morang', 'Sunsari', 'Jhapa']
municipalities = {
    'Kathmandu': ['Kathmandu Metro', 'Kirtipur', 'Chandragiri'],
    'Lalitpur': ['Lalitpur Metro', 'Godawari', 'Mahalaxmi'],
    'Bhaktapur': ['Bhaktapur Municipality', 'Madhyapur Thimi', 'Changunarayan'],
    'Pokhara': ['Pokhara Metro'],
    'Chitwan': ['Bharatpur', 'Ratnanagar', 'Khairhani'],
    'Dhading': ['Dhading Besi', 'Nilkantha', 'Netrawati'],
    'Kaski': ['Pokhara Metro', 'Annapurna'],
    'Morang': ['Biratnagar', 'Sundar Haraicha'],
    'Sunsari': ['Dharan', 'Itahari', 'Inaruwa'],
    'Jhapa': ['Birtamod', 'Damak', 'Mechinagar']
}

def generate_citizenship_number(index):
    return f"{random.randint(10,99)}-{random.randint(10,99)}-{random.randint(10,99)}-{10000 + index}"

def generate_date_of_birth():
    start_date = datetime(1950, 1, 1)
    end_date = datetime(2005, 12, 31)
    random_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
    return random_date.strftime('%Y-%m-%d')

# Generate 50 citizens
citizens = []
for i in range(1, 51):
    first_name = random.choice(first_names)
    last_name = random.choice(last_names)
    district = random.choice(districts)
    municipality = random.choice(municipalities.get(district, ['Unknown Municipality']))
    
    citizen = {
        'citizenship_number': generate_citizenship_number(i),
        'full_name': f"{first_name} {last_name}",
        'date_of_birth': generate_date_of_birth(),
        'district': district,
        'municipality': municipality,
        'ward_number': random.randint(1, 15),
        'father_name': f"{random.choice(first_names)} {last_name}",
        'mother_name': f"{random.choice(['Sita', 'Gita', 'Radha', 'Laxmi', 'Mina', 'Rita'])} {last_name}",
        'gender': random.choice(['M', 'F', 'O'])
    }
    citizens.append(citizen)

# Sort by citizenship number
citizens.sort(key=lambda x: x['citizenship_number'])

# Write to CSV
with open('test_citizens.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['citizenship_number', 'full_name', 'date_of_birth', 'district', 
                  'municipality', 'ward_number', 'father_name', 'mother_name', 'gender']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(citizens)

print("✅ Generated test_citizens.csv with 50 citizens")