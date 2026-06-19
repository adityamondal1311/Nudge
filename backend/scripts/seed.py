"""Seeds 15-20 realistic resolved tickets with embeddings. Re-runnable: clears existing rows first."""
import datetime as dt

from app.db import SessionLocal
from app.embeddings import embed
from app.models import Ticket

SEED_TICKETS = [
    dict(
        title="Cannot connect to office VPN from home",
        description="My VPN client fails to connect when I work from home. It says 'authentication failed' even though my password is correct. Worked fine last week.",
        resolution_notes="VPN certificate had expired on the user's profile. Reissued the certificate via the VPN admin console and had the user reinstall the client. Connection restored.",
        category="IT", urgency="High", assigned_agent="Rahul Mehta",
    ),
    dict(
        title="Laptop running extremely slow after Windows update",
        description="Since the last Windows update my laptop takes 10+ minutes to boot and apps freeze constantly. Already tried restarting.",
        resolution_notes="Update had triggered a background disk indexing process consuming all CPU. Disabled Windows Search indexing temporarily and ran disk cleanup. Performance restored to normal within an hour.",
        category="IT", urgency="Medium", assigned_agent="Rahul Mehta",
    ),
    dict(
        title="Need a new laptop for new joinee starting Monday",
        description="We have a new field coordinator joining next Monday and they don't have a laptop allocated yet. Need one configured with standard software.",
        resolution_notes="Allocated a refurbished ThinkPad from IT inventory, imaged with standard org software stack, and handed over to HR for delivery before the joining date.",
        category="IT", urgency="Medium", assigned_agent="Rahul Mehta",
    ),
    dict(
        title="Forgot password and locked out of email account",
        description="I'm locked out of my official email after too many failed login attempts. Need urgent access for a donor call today.",
        resolution_notes="Unlocked the account from the admin panel and triggered a password reset link to the user's personal backup email. Verified login within 15 minutes.",
        category="IT", urgency="High", assigned_agent="Rahul Mehta",
    ),
    dict(
        title="Printer in the regional office not working",
        description="The shared printer on the 2nd floor regional office shows 'offline' on every computer even though it's powered on.",
        resolution_notes="Printer had been assigned a new IP by the router after a reboot. Updated the static IP reservation and reinstalled the printer driver on affected machines.",
        category="IT", urgency="Low", assigned_agent="Rahul Mehta",
    ),
    dict(
        title="Request to access shared Google Drive folder for new project",
        description="I've been added to the new skilling project team but don't have access to the shared Drive folder with project documents.",
        resolution_notes="Verified the request with the project lead and granted editor access to the shared Drive folder. Confirmed access with the employee.",
        category="IT", urgency="Low", assigned_agent="Rahul Mehta",
    ),
    dict(
        title="Reimbursement for field travel not received after 3 weeks",
        description="I submitted my travel reimbursement claim for the district visit three weeks ago and haven't received the amount yet. Receipts were attached as required.",
        resolution_notes="Claim had been stuck in finance approval queue due to a missing manager sign-off. Followed up with the manager, got approval, and processed payment same week.",
        category="Finance", urgency="High", assigned_agent="Priya Nair",
    ),
    dict(
        title="Incorrect amount credited in monthly salary",
        description="My salary this month is short by around 2000 rupees compared to my usual payslip. Not sure why.",
        resolution_notes="Discrepancy was due to a one-day unpaid leave being deducted twice in payroll processing. Corrected the payroll entry and credited the difference in the next cycle with an explanation.",
        category="Finance", urgency="High", assigned_agent="Priya Nair",
    ),
    dict(
        title="How to submit reimbursement for conference registration fee",
        description="I paid out of pocket for a conference registration related to my role. What is the process and which form do I use to claim it back?",
        resolution_notes="Shared the standard reimbursement form and the list of documents required (registration receipt, approval email from manager). Guided the employee through the finance portal submission.",
        category="Finance", urgency="Low", assigned_agent="Priya Nair",
    ),
    dict(
        title="Vendor invoice payment delayed for training materials",
        description="A vendor who supplied training materials for our skilling program hasn't been paid yet, invoice is over a month old, and they are following up with us repeatedly.",
        resolution_notes="Invoice had missing PO reference required for processing. Coordinated with procurement to add the PO number and pushed the payment through, completed within the week.",
        category="Finance", urgency="Medium", assigned_agent="Priya Nair",
    ),
    dict(
        title="Need clarification on per diem rates for field visits",
        description="Going on a multi-day field visit next week and unsure what the current per diem rate is for district-level travel.",
        resolution_notes="Shared the latest internal per diem policy document with rates broken down by city tier, and clarified that receipts are still required for accommodation.",
        category="Finance", urgency="Low", assigned_agent="Priya Nair",
    ),
    dict(
        title="Applying for maternity leave - process unclear",
        description="I want to apply for maternity leave starting next month and I'm not sure what documents are needed or how far in advance to apply.",
        resolution_notes="Walked the employee through the maternity leave policy, shared the required documents checklist (medical certificate, leave application form), and submitted the leave request in the HR system on her behalf.",
        category="HR", urgency="Medium", assigned_agent="Sana Iqbal",
    ),
    dict(
        title="Leave balance shown incorrectly in HR portal",
        description="The HR portal shows I have 2 days of earned leave left but I'm certain I should have 6. I haven't taken extra leave recently.",
        resolution_notes="Found that a leave encashment from the previous cycle had not been synced to the portal. Manually corrected the leave balance and verified it matched HR records.",
        category="HR", urgency="Medium", assigned_agent="Sana Iqbal",
    ),
    dict(
        title="Need experience letter for previous role within the organization",
        description="I moved to a new team last year and now need an experience letter for the earlier role for a personal loan application.",
        resolution_notes="Generated the experience letter using HR templates with the correct role dates and designation, signed off by the reporting manager, and shared a digital copy within 2 working days.",
        category="HR", urgency="Low", assigned_agent="Sana Iqbal",
    ),
    dict(
        title="Unable to access HRMS portal for performance review submission",
        description="The performance review deadline is tomorrow and I can't log into the HRMS portal, it just shows a blank page after login.",
        resolution_notes="Issue was a browser cache problem after a recent HRMS update. Asked the employee to clear cache/cookies and use Chrome, which resolved the blank page issue. Submission deadline extended by a day as a precaution.",
        category="HR", urgency="High", assigned_agent="Sana Iqbal",
    ),
    dict(
        title="Question about work-from-home policy for field staff",
        description="As a field-based employee, I want to know if I'm eligible for occasional work-from-home days and how to request them.",
        resolution_notes="Clarified that field staff can request up to 2 WFH days per month with manager approval, logged via the HRMS leave module under 'WFH' category. Shared the policy document for reference.",
        category="HR", urgency="Low", assigned_agent="Sana Iqbal",
    ),
    dict(
        title="Need access card reissued after losing office ID",
        description="I lost my office access card somewhere over the weekend and can't enter the building this morning.",
        resolution_notes="Deactivated the lost card immediately for security and issued a temporary access card at the front desk while a permanent replacement was processed within 3 days.",
        category="Admin", urgency="Medium", assigned_agent="Karan Bose",
    ),
    dict(
        title="Conference room AC not working for client meeting today",
        description="The AC in the 3rd floor conference room isn't cooling at all and we have an important donor meeting scheduled there this afternoon.",
        resolution_notes="Facilities team found the outdoor unit had tripped on a breaker. Reset the breaker and serviced the filter; AC was functional well before the meeting.",
        category="Admin", urgency="High", assigned_agent="Karan Bose",
    ),
    dict(
        title="Request for additional desk and chair for new team member",
        description="Our team has grown and we need one more desk and ergonomic chair set up in the open office area.",
        resolution_notes="Procured a desk and chair from existing inventory in storage and had facilities set it up at the requested location within two days.",
        category="Admin", urgency="Low", assigned_agent="Karan Bose",
    ),
    dict(
        title="Drinking water dispenser empty on the 4th floor for two days",
        description="The water dispenser near the 4th floor pantry has been empty since Monday and nobody seems to have refilled it.",
        resolution_notes="Contacted the water supply vendor directly as the standing order had lapsed, arranged an immediate refill, and renewed the vendor contract to avoid future lapses.",
        category="Admin", urgency="Medium", assigned_agent="Karan Bose",
    ),
]


def main():
    session = SessionLocal()
    try:
        deleted = session.query(Ticket).delete()
        print(f"Cleared {deleted} existing tickets.")

        now = dt.datetime.now(dt.timezone.utc)
        for i, t in enumerate(SEED_TICKETS):
            created_at = now - dt.timedelta(days=20 - i)
            resolved_at = created_at + dt.timedelta(days=2)
            status_history = [
                {"status": "Open", "timestamp": created_at.isoformat()},
                {"status": "In Progress", "timestamp": (created_at + dt.timedelta(hours=4)).isoformat()},
                {"status": "Resolved", "timestamp": resolved_at.isoformat()},
            ]
            ticket = Ticket(
                title=t["title"],
                description=t["description"],
                description_embedding=embed(t["description"]),
                category=t["category"],
                category_confidence=0.95,
                category_reasoning=f"Seed data labeled as {t['category']}.",
                urgency=t["urgency"],
                status="Resolved",
                raised_by="seed-data@thenudge.org",
                assigned_agent=t["assigned_agent"],
                resolution_notes=t["resolution_notes"],
                status_history=status_history,
                created_at=created_at,
                updated_at=resolved_at,
            )
            session.add(ticket)

        session.commit()
        print(f"Inserted {len(SEED_TICKETS)} resolved tickets with embeddings.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
