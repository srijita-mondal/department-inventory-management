from datetime import date
from extensions import db
from models import Loan, InventoryItem, RenewalRequest
from conftest import login


def test_issue_sets_due_date_and_reduces_availability(app, client):
    login(client, 'coordinator')
    response = client.post('/issue', data={'student_id': 2, 'item_id': 1, 'quantity': 2, 'issue_date': '2026-10-01', 'purpose': 'Lab'}, follow_redirects=True)
    assert b'2026-10-16' in response.data
    with app.app_context():
        loan = Loan.query.one()
        assert loan.due_date == date(2026, 10, 16)
        assert loan.quantity_outstanding == 2


def test_failed_issue_does_not_create_loan(app, client):
    login(client, 'coordinator')
    response = client.post('/issue', data={'student_id': 2, 'item_id': 1, 'quantity': 8, 'issue_date': '2026-10-01'}, follow_redirects=True)
    assert b'only 5 currently available' in response.data
    with app.app_context(): assert Loan.query.count() == 0


def test_renewal_request_does_not_change_due_date_until_approval(app, client):
    login(client, 'coordinator')
    client.post('/issue', data={'student_id': 2, 'item_id': 1, 'quantity': 1, 'issue_date': '2026-10-01'}, follow_redirects=True)
    with app.app_context():
        loan = Loan.query.one(); loan_id = loan.id; original_due = loan.due_date
    # Switch to student and submit request before the due date using a test date aligned with issue date.
    with client.session_transaction() as sess: sess['user_id'] = 2
    with app.app_context():
        # Temporarily set due date ahead of today's date so the request is valid.
        loan = db.session.get(Loan, loan_id); loan.due_date = date.today().replace(day=min(25, date.today().day + 5)); db.session.commit(); original_due = loan.due_date
    client.post(f'/renew/{loan_id}', follow_redirects=True)
    with app.app_context():
        loan = db.session.get(Loan, loan_id); assert loan.due_date == original_due
        renewal = RenewalRequest.query.one(); rid = renewal.id
    with client.session_transaction() as sess: sess['user_id'] = 1
    client.post(f'/renewals/{rid}/approve', data={'remarks':'Approved'}, follow_redirects=True)
    with app.app_context(): assert db.session.get(Loan, loan_id).due_date == original_due.fromordinal(original_due.toordinal()+15)
