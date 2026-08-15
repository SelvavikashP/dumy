import sqlite3
conn = sqlite3.connect('assessment_portal.db')
c = conn.cursor()
c.execute("SELECT otp_code FROM email_verification_tokens WHERE email='finaltest@example.com' ORDER BY created_at DESC LIMIT 1")
row = c.fetchone()
print(row[0] if row else "not found")
conn.close()
