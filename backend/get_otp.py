import sqlite3
conn = sqlite3.connect('assessment_portal.db')
c = conn.cursor()
c.execute("SELECT otp_code FROM email_verification_tokens WHERE email = 'browser2@example.com' ORDER BY created_at DESC LIMIT 1")
row = c.fetchone()
if row:
    print('OTP is:', row[0])
else:
    print('OTP not found')
conn.close()
