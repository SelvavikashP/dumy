import requests
import sqlite3

print('Registering user...')
reg_payload = {
    'full_name': 'Test User',
    'email': 'testuser2026@example.com',
    'password': 'Password123'
}
res_reg = requests.post('http://127.0.0.1:8000/api/v1/auth/register', json=reg_payload)
print('Registration status:', res_reg.status_code)
if res_reg.status_code != 200:
    print(res_reg.text)

print('\nFetching OTP from DB...')
conn = sqlite3.connect('assessment_portal.db')
c = conn.cursor()
c.execute("SELECT otp_code, expires_at FROM email_verification_tokens WHERE email = 'testuser2026@example.com' ORDER BY created_at DESC LIMIT 1")
row = c.fetchone()
if not row:
    print('No OTP found in DB!')
    exit(1)
otp_code, expires_at = row
print('Found OTP:', otp_code)
print('Expires at:', expires_at)
conn.close()

print('\nVerifying OTP...')
verify_payload = {
    'email': 'testuser2026@example.com',
    'otp_code': otp_code
}
res_verify = requests.post('http://127.0.0.1:8000/api/v1/auth/verify-email-otp', json=verify_payload)
print('Verification status:', res_verify.status_code)
print('Response:', res_verify.json())
