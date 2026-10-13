from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # coordinator or student
    name = db.Column(db.String(120), nullable=False)
    enrolment_number = db.Column(db.String(50), unique=True)
    programme = db.Column(db.String(120))
    semester = db.Column(db.String(30))
    contact = db.Column(db.String(120))
    active = db.Column(db.Boolean, default=True, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class StorageLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), unique=True, nullable=False)
    description = db.Column(db.String(250), default="")


class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(60), unique=True, nullable=False)
    name = db.Column(db.String(160), nullable=False)
    category = db.Column(db.String(100), default="")
    description = db.Column(db.Text, default="")
    make_model = db.Column(db.String(160), default="")
    tracking_type = db.Column(db.String(20), nullable=False, default="quantity")  # quantity or asset
    total_quantity = db.Column(db.Integer, nullable=False, default=0)
    unavailable_quantity = db.Column(db.Integer, nullable=False, default=0)
    location_id = db.Column(db.Integer, db.ForeignKey("storage_location.id"))
    location = db.relationship("StorageLocation")
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Asset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_item.id"), nullable=False)
    asset_tag = db.Column(db.String(80), unique=True, nullable=False)
    serial_number = db.Column(db.String(120), default="")
    condition = db.Column(db.String(30), nullable=False, default="usable")
    status = db.Column(db.String(30), nullable=False, default="available")
    location_id = db.Column(db.Integer, db.ForeignKey("storage_location.id"))
    item = db.relationship("InventoryItem", backref="assets")
    location = db.relationship("StorageLocation")


class Loan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_item.id"), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey("asset.id"))
    quantity_issued = db.Column(db.Integer, nullable=False)
    quantity_outstanding = db.Column(db.Integer, nullable=False)
    purpose = db.Column(db.String(250), default="")
    issue_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    issued_by_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    closed = db.Column(db.Boolean, default=False, nullable=False)
    student = db.relationship("User", foreign_keys=[student_id])
    item = db.relationship("InventoryItem")
    asset = db.relationship("Asset")
    issued_by = db.relationship("User", foreign_keys=[issued_by_id])


class RenewalRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey("loan.id"), nullable=False)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    remarks = db.Column(db.String(300), default="")
    revised_due_date = db.Column(db.Date)
    requested_by_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    loan = db.relationship("Loan", backref="renewal_requests")
    requested_by = db.relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = db.relationship("User", foreign_keys=[reviewed_by_id])


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    kind = db.Column(db.String(30), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("inventory_item.id"))
    loan_id = db.Column(db.Integer, db.ForeignKey("loan.id"))
    quantity = db.Column(db.Integer, default=0, nullable=False)
    note = db.Column(db.Text, default="")
    performed_by_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    occurred_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    item = db.relationship("InventoryItem")
    loan = db.relationship("Loan")
    performed_by = db.relationship("User")
