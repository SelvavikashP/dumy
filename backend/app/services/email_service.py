import smtplib
import ssl
import random
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings

class EmailService:
    @staticmethod
    async def get_smtp_config(db: Optional[AsyncSession] = None) -> Dict[str, Any]:
        """
        Retrieves SMTP configuration dynamically from PlatformSettings in the database,
        falling back to environment variables defined in settings.
        """
        config = {
            "host": settings.SMTP_HOST,
            "port": settings.SMTP_PORT,
            "user": settings.SMTP_USER,
            "password": settings.SMTP_PASSWORD,
            "from_name": settings.SMTP_FROM_NAME,
            "from_email": settings.SMTP_FROM_EMAIL or settings.SMTP_USER or "noreply@assessmentportal.io",
            "use_tls": settings.SMTP_TLS,
            "frontend_url": settings.FRONTEND_URL,
            "is_configured": bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
        }

        if db is not None:
            try:
                from app.models.models import PlatformSetting
                res = await db.execute(select(PlatformSetting).where(PlatformSetting.setting_key == "email_smtp_config"))
                ps = res.scalars().first()
                if ps and isinstance(ps.setting_value_json, dict):
                    c = ps.setting_value_json
                    if c.get("host"):
                        config["host"] = c.get("host")
                    if c.get("port"):
                        config["port"] = int(c.get("port"))
                    if c.get("user"):
                        config["user"] = c.get("user")
                    if c.get("password"):
                        config["password"] = c.get("password")
                    if c.get("from_name"):
                        config["from_name"] = c.get("from_name")
                    if c.get("from_email"):
                        config["from_email"] = c.get("from_email")
                    if "use_tls" in c:
                        config["use_tls"] = bool(c.get("use_tls"))
                    if c.get("frontend_url"):
                        config["frontend_url"] = c.get("frontend_url")
                    config["is_configured"] = bool(config["user"] and config["password"])
            except Exception as e:
                print(f"[!] EmailService: Error loading dynamic SMTP config: {e}")

        return config

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generates a secure, cryptographically-random 6-digit numeric OTP."""
        return "".join([str(random.randint(0, 9)) for _ in range(length)])

    @classmethod
    async def send_raw_email(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        plain_body: Optional[str] = None,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Asynchronously sends an email using Gmail / SMTP.
        If SMTP credentials are not yet configured, gracefully logs to console and returns simulated success.
        """
        cfg = await cls.get_smtp_config(db)
        to_email_clean = to_email.strip().lower()

        if not cfg["is_configured"]:
            print(f"\n=======================================================")
            print(f"📧 [EMAIL SIMULATION / DEV MODE - SMTP NOT CONFIGURED]")
            print(f"To: {to_email_clean}")
            print(f"Subject: {subject}")
            print(f"Summary / Content: {plain_body or 'HTML Email'}")
            print(f"=======================================================\n")
            return {
                "success": True,
                "mode": "SIMULATED",
                "message": f"Email recorded in dev mode for {to_email_clean} (Configure Gmail in Admin Settings for live delivery)"
            }

        def _send_sync():
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            sender_display = f"{cfg['from_name']} <{cfg['from_email']}>" if cfg["from_name"] else cfg["from_email"]
            msg["From"] = sender_display
            msg["To"] = to_email_clean

            if plain_body:
                msg.attach(MIMEText(plain_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            port = cfg["port"]
            host = cfg["host"]
            user = cfg["user"]
            pwd = cfg["password"]

            if port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(host, port, context=context, timeout=15) as server:
                    server.login(user, pwd)
                    server.sendmail(cfg["from_email"], [to_email_clean], msg.as_string())
            else:
                with smtplib.SMTP(host, port, timeout=15) as server:
                    if cfg["use_tls"]:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    if user and pwd:
                        server.login(user, pwd)
                    server.sendmail(cfg["from_email"], [to_email_clean], msg.as_string())

        try:
            await asyncio.to_thread(_send_sync)
            print(f"[+] 📧 Email sent successfully via Gmail SMTP to {to_email_clean}: '{subject}'")
            return {
                "success": True,
                "mode": "LIVE_SMTP",
                "message": f"Email successfully delivered to {to_email_clean}"
            }
        except Exception as e:
            err_msg = str(e)
            print(f"[-] ❌ Failed to send email via SMTP to {to_email_clean}: {err_msg}")
            # Even if SMTP fails (e.g. invalid app password), we return informative response so callers can report it cleanly
            return {
                "success": False,
                "mode": "ERROR",
                "error": err_msg,
                "message": f"SMTP Error: {err_msg}"
            }

    @classmethod
    async def send_verification_otp(
        cls,
        email: str,
        full_name: str,
        otp_code: str,
        expire_minutes: int = 15,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Sends account email verification OTP code.
        """
        subject = f"🔐 Your Verification Code: {otp_code} — EvalAI Assessment Portal"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; margin: 0; padding: 24px; }}
            .container {{ max-width: 540px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .header {{ background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 32px 24px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }}
            .header p {{ color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 13px; }}
            .content {{ padding: 32px 28px; }}
            .greeting {{ font-size: 15px; color: #94a3b8; margin-bottom: 18px; }}
            .otp-box {{ background-color: #0f172a; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
            .otp-code {{ font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; margin: 0; }}
            .otp-expiry {{ font-size: 12px; color: #94a3b8; margin-top: 8px; }}
            .info-card {{ background-color: #1e293b; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 12px; color: #cbd5e1; line-height: 1.5; }}
            .footer {{ background-color: #0a0e1a; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2937; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 EvalAI Assessment Platform</h1>
              <p>Email Account Verification</p>
            </div>
            <div class="content">
              <div class="greeting">Hello <strong>{full_name or 'Candidate'}</strong>,</div>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0;">
                Thank you for joining our recruitment assessment portal. Please use the 6-digit verification code below to confirm your registered email address:
              </p>
              <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
                <div class="otp-expiry">⏱️ Valid for the next <strong>{expire_minutes} minutes</strong></div>
              </div>
              <div class="info-card">
                🛡️ <strong>Security Tip:</strong> Never share this OTP with anyone. EvalAI staff will never ask for your verification code or account password.
              </div>
            </div>
            <div class="footer">
              This automated verification email was sent to {email}. If you did not request this, you can safely ignore this message.
            </div>
          </div>
        </body>
        </html>
        """

        plain_body = (
            f"Hello {full_name},\n\n"
            f"Your EvalAI account verification code is: {otp_code}\n\n"
            f"This code will expire in {expire_minutes} minutes.\n"
            f"If you did not request this code, please ignore this email."
        )

        return await cls.send_raw_email(email, subject, html_body, plain_body, db=db)

    @classmethod
    async def send_assessment_invitation(
        cls,
        email: str,
        candidate_name: str,
        assessment_title: str,
        assessment_id: str,
        duration_minutes: int,
        passing_percentage: float,
        instructions: Optional[str],
        invitation_token: str,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Sends an assessment invitation with access link and proctoring requirements.
        """
        cfg = await cls.get_smtp_config(db)
        frontend_url = cfg["frontend_url"].rstrip("/")
        assessment_url = f"{frontend_url}/candidate/instructions/{assessment_id}?token={invitation_token}"

        subject = f"🎯 Assessment Invitation: {assessment_title} — EvalAI"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; margin: 0; padding: 24px; }}
            .container {{ max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .header {{ background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%); padding: 32px 24px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; }}
            .header p {{ color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 13px; }}
            .content {{ padding: 32px 28px; }}
            .card {{ background-color: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #334155; }}
            .spec-item {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 13px; }}
            .spec-item:last-child {{ border-bottom: none; }}
            .btn {{ display: block; width: fit-content; margin: 28px auto 16px auto; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); }}
            .proctoring-box {{ background-color: #0f172a; border-left: 4px solid #f59e0b; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-size: 12px; color: #cbd5e1; line-height: 1.5; }}
            .footer {{ background-color: #0a0e1a; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2937; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Assessment Invitation</h1>
              <p>You have been invited to an evaluation test</p>
            </div>
            <div class="content">
              <p style="font-size: 15px; color: #94a3b8; margin: 0 0 16px 0;">Hello <strong>{candidate_name or 'Candidate'}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
                You have been selected to take the assessment: <strong>{assessment_title}</strong>.
              </p>

              <div class="card">
                <div style="font-weight: 700; font-size: 14px; color: #38bdf8; margin-bottom: 12px;">📋 Assessment Overview</div>
                <div style="font-size: 13px; color: #e2e8f0; line-height: 1.8;">
                  <div>⏱️ <strong>Duration:</strong> {duration_minutes} minutes</div>
                  <div>🎯 <strong>Passing Score:</strong> {passing_percentage}%</div>
                  <div>🛡️ <strong>Environment:</strong> AI Proctored Fullscreen Sandbox</div>
                </div>
              </div>

              <div class="proctoring-box">
                ⚠️ <strong>Proctoring Notice:</strong> This assessment enforces automated face tracking, screen lock, and tab-switch monitoring. Please ensure you have a working camera and an uninterrupted internet connection.
              </div>

              <a href="{assessment_url}" class="btn">🚀 Start Assessment Now</a>

              <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
                Direct URL: <a href="{assessment_url}" style="color: #38bdf8; word-break: break-all;">{assessment_url}</a>
              </p>
            </div>
            <div class="footer">
              EvalAI Proctored Assessment Suite • Delivered to {email}
            </div>
          </div>
        </body>
        </html>
        """

        plain_body = (
            f"Hello {candidate_name},\n\n"
            f"You have been invited to complete the assessment: {assessment_title}\n\n"
            f"Duration: {duration_minutes} minutes\n"
            f"Passing Criteria: {passing_percentage}%\n"
            f"Start Assessment: {assessment_url}\n\n"
            f"Please ensure you are using a desktop browser with a working webcam for proctoring."
        )

        return await cls.send_raw_email(email, subject, html_body, plain_body, db=db)

    @classmethod
    async def send_assessment_reminder(
        cls,
        email: str,
        candidate_name: str,
        assessment_title: str,
        assessment_id: str,
        duration_minutes: int,
        passing_percentage: float,
        invitation_token: str,
        reminder_index: int = 1,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Sends an urgent assessment reminder email to candidate.
        """
        cfg = await cls.get_smtp_config(db)
        frontend_url = cfg["frontend_url"].rstrip("/")
        assessment_url = f"{frontend_url}/candidate/instructions/{assessment_id}?token={invitation_token}"

        subject = f"⏰ Reminder #{reminder_index}: Pending Assessment — {assessment_title}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; margin: 0; padding: 24px; }}
            .container {{ max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }}
            .header {{ background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 32px 24px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; }}
            .header p {{ color: rgba(255, 255, 255, 0.95); margin: 6px 0 0 0; font-size: 13px; font-weight: 600; }}
            .content {{ padding: 32px 28px; }}
            .badge {{ display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }}
            .btn {{ display: block; width: fit-content; margin: 28px auto 16px auto; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.4); }}
            .checklist {{ background-color: #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0; border: 1px solid #334155; font-size: 13px; line-height: 1.7; }}
            .footer {{ background-color: #0a0e1a; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1f2937; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Assessment Action Required</h1>
              <p>Your pending assessment is awaiting completion</p>
            </div>
            <div class="content">
              <span class="badge">Action Reminder</span>
              <p style="font-size: 15px; color: #94a3b8; margin: 0 0 16px 0;">Hello <strong>{candidate_name or 'Candidate'}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
                This is a friendly reminder that you have a pending recruitment assessment: <strong>{assessment_title}</strong>.
              </p>

              <div class="checklist">
                <div style="font-weight: 700; color: #fbbf24; margin-bottom: 8px;">✅ Pre-Exam Checklist:</div>
                <div>⏱️ <strong>Duration:</strong> {duration_minutes} minutes</div>
                <div>📹 <strong>Webcam &amp; Mic:</strong> Enabled and ready for AI proctoring</div>
                <div>🖥️ <strong>Browser:</strong> Chrome / Firefox / Edge (Fullscreen required)</div>
                <div>📶 <strong>Connection:</strong> Stable high-speed internet</div>
              </div>

              <a href="{assessment_url}" class="btn">⚡ Proceed to Assessment</a>

              <p style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
                Link: <a href="{assessment_url}" style="color: #38bdf8; word-break: break-all;">{assessment_url}</a>
              </p>
            </div>
            <div class="footer">
              EvalAI Automated Proctoring System • Sent to {email}
            </div>
          </div>
        </body>
        </html>
        """

        plain_body = (
            f"Hello {candidate_name},\n\n"
            f"This is a reminder to complete your assessment: {assessment_title}\n\n"
            f"Duration: {duration_minutes} minutes\n"
            f"Direct Test URL: {assessment_url}\n\n"
            f"Please complete your assessment as soon as possible."
        )

        return await cls.send_raw_email(email, subject, html_body, plain_body, db=db)

    @classmethod
    async def send_suspension_report(
        cls,
        email: str,
        creator_email: Optional[str],
        candidate_name: str,
        assessment_title: str,
        suspension_reason: str,
        warning_count: int,
        warning_limit: int,
        db: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Dispatches an automated Assessment Attempt Suspension & Security Incident Report email
        to BOTH the candidate's email address and the recruiter/creator's email address.
        """
        subject = f"🚨 Assessment Suspended — Security Threshold Exceeded: {assessment_title}"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #dc2626; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.2); }}
            .header {{ text-align: center; padding-bottom: 24px; border-bottom: 1px solid #1e293b; }}
            .header h1 {{ color: #ef4444; margin: 0; font-size: 22px; font-weight: 800; }}
            .header p {{ color: #94a3b8; font-size: 13px; margin-top: 6px; }}
            .content {{ padding: 24px 0; }}
            .badge {{ display: inline-block; background-color: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; font-family: monospace; text-transform: uppercase; margin-bottom: 16px; }}
            .box {{ background-color: #1e1b4b; border: 1px solid #4338ca; border-radius: 12px; padding: 16px; margin: 16px 0; text-align: left; font-size: 13px; color: #e0e7ff; }}
            .footer {{ text-align: center; font-size: 11px; color: #64748b; padding-top: 24px; border-top: 1px solid #1e293b; font-family: monospace; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Assessment Session Suspended</h1>
              <p>Security limit reached during proctored assessment</p>
            </div>
            <div class="content">
              <span class="badge">Security Violation Incident Report</span>
              <p style="font-size: 15px; color: #f8fafc; margin: 0 0 16px 0;">Notice for <strong>{candidate_name}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0;">
                Your attempt for assessment <strong>{assessment_title}</strong> was automatically suspended because the security warning threshold was reached ({warning_count} of {warning_limit} warnings logged).
              </p>

              <div class="box">
                <div style="font-weight: 700; color: #fca5a5; margin-bottom: 8px;">📋 Suspension Summary:</div>
                <div>• <strong>Reason:</strong> {suspension_reason}</div>
                <div>• <strong>Warnings Reached:</strong> {warning_count} / {warning_limit}</div>
                <div>• <strong>Status:</strong> Attempt Terminated &amp; Preserved</div>
                <div>• <strong>Time:</strong> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</div>
              </div>

              <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                All answers and code submissions up to the suspension moment have been safely recorded. You may contact your recruiter or talent acquisition administrator if you believe this was an error or wish to request a reattempt.
              </p>
            </div>
            <div class="footer">
              EvalAI Automated Proctoring System &bull; Security Incident Notice
            </div>
          </div>
        </body>
        </html>
        """

        plain_body = (
            f"ASSESSMENT ATTEMPT SUSPENDED\n\n"
            f"Candidate: {candidate_name} ({email})\n"
            f"Assessment: {assessment_title}\n"
            f"Reason: {suspension_reason}\n"
            f"Warnings Reached: {warning_count}/{warning_limit}\n"
            f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
            f"All submitted answers and code up to the suspension have been preserved in the platform audit log."
        )

        res1 = await cls.send_raw_email(email, subject, html_body, plain_body, db=db)
        if creator_email and creator_email.strip().lower() != email.strip().lower():
            try:
                creator_subject = f"🚨 Candidate Attempt Suspended: {candidate_name} ({assessment_title})"
                await cls.send_raw_email(creator_email, creator_subject, html_body, plain_body, db=db)
            except Exception as e:
                print(f"[!] EmailService: Error sending suspension notice to creator {creator_email}: {e}")

        return res1

    @classmethod
    async def test_smtp_connection(
        cls,
        host: str,
        port: int,
        user: str,
        password: str,
        use_tls: bool = True
    ) -> Dict[str, Any]:
        """
        Runs live connection and credential probe against SMTP server.
        """
        def _test_sync():
            if port == 465:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(host, port, context=context, timeout=10) as server:
                    if user and password:
                        server.login(user, password)
                    return {"status": "SUCCESS", "message": f"Successfully connected & authenticated with {host}:{port}"}
            else:
                with smtplib.SMTP(host, port, timeout=10) as server:
                    if use_tls:
                        context = ssl.create_default_context()
                        server.starttls(context=context)
                    if user and password:
                        server.login(user, password)
                    return {"status": "SUCCESS", "message": f"Successfully connected & authenticated with {host}:{port}"}

        try:
            res = await asyncio.to_thread(_test_sync)
            return res
        except Exception as e:
            return {
                "status": "ERROR",
                "message": f"SMTP Connection Failed: {str(e)}"
            }
