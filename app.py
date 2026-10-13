import os
from datetime import date, datetime, timedelta
from functools import wraps
from flask import Flask, flash, redirect, render_template, request, session, url_for
from dotenv import load_dotenv
from extensions import db
from models import User, StorageLocation, InventoryItem, Asset, Loan, RenewalRequest, Transaction

load_dotenv()


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'local-development-key-change-me'),
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///inventory.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    if test_config:
        app.config.update(test_config)
    db.init_app(app)

    with app.app_context():
        db.create_all()

    def current_user():
        uid = session.get('user_id')
        return db.session.get(User, uid) if uid else None

    app.jinja_env.globals['current_user'] = current_user

    def login_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not current_user():
                flash('Please sign in to continue.', 'warning')
                return redirect(url_for('login'))
            return fn(*args, **kwargs)
        return wrapper

    def role_required(role):
        def decorator(fn):
            @wraps(fn)
            @login_required
            def wrapper(*args, **kwargs):
                user = current_user()
                if user.role != role:
                    flash('You do not have permission to access that page.', 'danger')
                    return redirect(url_for('index'))
                return fn(*args, **kwargs)
            return wrapper
        return decorator

    def log_transaction(kind, item_id, user_id, quantity=0, note='', loan_id=None):
        db.session.add(Transaction(kind=kind, item_id=item_id, loan_id=loan_id,
                                   quantity=quantity, note=note, performed_by_id=user_id))

    def available_quantity(item):
        if item.tracking_type == 'asset':
            return Asset.query.filter_by(item_id=item.id, status='available', condition='usable').count()
        issued = db.session.query(db.func.coalesce(db.func.sum(Loan.quantity_outstanding), 0)).filter(
            Loan.item_id == item.id, Loan.closed.is_(False)).scalar() or 0
        return max(0, item.total_quantity - issued - item.unavailable_quantity)

    app.jinja_env.globals['available_quantity'] = available_quantity

    @app.route('/')
    def index():
        user = current_user()
        if not user:
            return render_template('home.html')
        if user.role == 'student':
            loans = Loan.query.filter_by(student_id=user.id, closed=False).order_by(Loan.due_date).all()
            history = Loan.query.filter_by(student_id=user.id).order_by(Loan.issue_date.desc()).limit(10).all()
            return render_template('student_dashboard.html', loans=loans, history=history, today=date.today())
        items = InventoryItem.query.filter_by(active=True).order_by(InventoryItem.name).all()
        overdue = Loan.query.filter(Loan.closed.is_(False), Loan.due_date < date.today()).order_by(Loan.due_date).all()
        pending = RenewalRequest.query.filter_by(status='pending').order_by(RenewalRequest.requested_at).all()
        return render_template('coordinator_dashboard.html', items=items, overdue=overdue, pending=pending, today=date.today())

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            user = User.query.filter_by(username=request.form.get('username', '').strip()).first()
            if user and user.active and user.check_password(request.form.get('password', '')):
                session.clear()
                session['user_id'] = user.id
                flash(f'Welcome, {user.name}.', 'success')
                return redirect(url_for('index'))
            flash('Invalid username or password.', 'danger')
        return render_template('login.html')

    @app.route('/logout', methods=['POST'])
    def logout():
        session.clear()
        flash('You have been signed out.', 'info')
        return redirect(url_for('login'))

    @app.route('/inventory')
    @role_required('coordinator')
    def inventory():
        items = InventoryItem.query.filter_by(active=True).order_by(InventoryItem.name).all()
        return render_template('inventory.html', items=items)

    @app.route('/inventory/new', methods=['GET', 'POST'])
    @role_required('coordinator')
    def inventory_new():
        locations = StorageLocation.query.order_by(StorageLocation.name).all()
        if request.method == 'POST':
            code = request.form.get('code', '').strip()
            name = request.form.get('name', '').strip()
            tracking = request.form.get('tracking_type', 'quantity')
            try:
                total = int(request.form.get('total_quantity', '0'))
            except ValueError:
                total = -1
            if not code or not name or tracking not in ('quantity', 'asset') or total < 0:
                flash('Enter a code, name, valid tracking type, and non-negative quantity.', 'danger')
                return render_template('inventory_form.html', locations=locations)
            if InventoryItem.query.filter_by(code=code).first():
                flash('That item code already exists.', 'danger')
                return render_template('inventory_form.html', locations=locations)
            loc_id = request.form.get('location_id') or None
            item = InventoryItem(code=code, name=name, category=request.form.get('category',''),
                description=request.form.get('description',''), make_model=request.form.get('make_model',''),
                tracking_type=tracking, total_quantity=total, location_id=loc_id)
            db.session.add(item); db.session.flush()
            if tracking == 'asset':
                # total_quantity represents expected asset count; assets are created individually below.
                asset_tags = [x.strip() for x in request.form.get('asset_tags','').splitlines() if x.strip()]
                if len(asset_tags) != total:
                    db.session.rollback()
                    flash('For individually tracked assets, enter exactly one unique asset tag per asset (one per line).', 'danger')
                    return render_template('inventory_form.html', locations=locations)
                if len(set(asset_tags)) != len(asset_tags) or any(Asset.query.filter_by(asset_tag=t).first() for t in asset_tags):
                    db.session.rollback(); flash('Asset tags must be unique.', 'danger')
                    return render_template('inventory_form.html', locations=locations)
                for tag in asset_tags:
                    db.session.add(Asset(item_id=item.id, asset_tag=tag, location_id=loc_id, condition='usable', status='available'))
            log_transaction('stock_add', item.id, current_user().id, total, 'Initial stock recorded')
            db.session.commit(); flash('Inventory item created.', 'success')
            return redirect(url_for('inventory'))
        return render_template('inventory_form.html', locations=locations)


    @app.route('/inventory/<int:item_id>/status', methods=['POST'])
    @role_required('coordinator')
    def update_stock_status(item_id):
        item = db.get_or_404(InventoryItem, item_id)
        if item.tracking_type == 'asset':
            asset_id = request.form.get('asset_id', type=int)
            asset = db.session.get(Asset, asset_id) if asset_id else None
            status = request.form.get('status', 'available')
            if not asset or asset.item_id != item.id or status not in ('available','damaged','lost','maintenance'):
                flash('Choose a valid asset and status.', 'danger')
            else:
                if status == 'available':
                    asset.condition = 'usable'  # coordinator explicitly confirms the asset is usable
                asset.status = status
                log_transaction('asset_status', item.id, current_user().id, 1, f'{asset.asset_tag} status set to {status}')
                db.session.commit(); flash('Asset status updated.', 'success')
        else:
            try: qty = int(request.form.get('quantity','0'))
            except ValueError: qty = 0
            action = request.form.get('action')
            if qty < 1:
                flash('Quantity must be positive.', 'danger')
            elif action == 'release' and qty <= item.unavailable_quantity:
                item.unavailable_quantity -= qty
                log_transaction('stock_released', item.id, current_user().id, qty, 'Coordinator confirmed stock is usable')
                db.session.commit(); flash('Stock marked usable and released.', 'success')
            else:
                flash('Invalid stock status adjustment.', 'danger')
        return redirect(url_for('inventory'))

    @app.route('/locations', methods=['GET', 'POST'])
    @role_required('coordinator')
    def locations():
        if request.method == 'POST':
            name = request.form.get('name','').strip()
            if not name:
                flash('Location name is required.', 'danger')
            elif StorageLocation.query.filter_by(name=name).first():
                flash('That location already exists.', 'danger')
            else:
                db.session.add(StorageLocation(name=name, description=request.form.get('description','').strip()))
                db.session.commit(); flash('Storage location added.', 'success')
                return redirect(url_for('locations'))
        return render_template('locations.html', locations=StorageLocation.query.order_by(StorageLocation.name).all())

    @app.route('/students', methods=['GET', 'POST'])
    @role_required('coordinator')
    def students():
        if request.method == 'POST':
            username = request.form.get('username','').strip()
            enrolment = request.form.get('enrolment_number','').strip()
            if not username or not enrolment or User.query.filter_by(username=username).first() or User.query.filter_by(enrolment_number=enrolment).first():
                flash('Username and enrolment number must be present and unique.', 'danger')
            else:
                u = User(username=username, name=request.form.get('name','').strip(), role='student',
                    enrolment_number=enrolment, programme=request.form.get('programme',''),
                    semester=request.form.get('semester',''), contact=request.form.get('contact',''))
                u.set_password(request.form.get('password','ChangeMe123!'))
                db.session.add(u); db.session.commit(); flash('Student registered.', 'success')
                return redirect(url_for('students'))
        return render_template('students.html', students=User.query.filter_by(role='student').order_by(User.name).all())

    @app.route('/issue', methods=['GET', 'POST'])
    @role_required('coordinator')
    def issue():
        students_list = User.query.filter_by(role='student', active=True).order_by(User.name).all()
        items = InventoryItem.query.filter_by(active=True).order_by(InventoryItem.name).all()
        if request.method == 'POST':
            student = db.session.get(User, request.form.get('student_id', type=int))
            item = db.session.get(InventoryItem, request.form.get('item_id', type=int))
            quantity = request.form.get('quantity', type=int)
            issue_date = date.fromisoformat(request.form.get('issue_date') or date.today().isoformat())
            asset_id = request.form.get('asset_id', type=int)
            if not student or student.role != 'student' or not student.active:
                flash('Items can only be issued to a registered, active student.', 'danger')
            elif not item or not item.active or not quantity or quantity < 1:
                flash('Choose a valid item and positive quantity.', 'danger')
            elif item.tracking_type == 'asset' and (quantity != 1 or not asset_id):
                flash('Choose exactly one available individual asset.', 'danger')
            elif item.tracking_type == 'asset' and (not (asset := db.session.get(Asset, asset_id)) or asset.item_id != item.id or asset.status != 'available' or asset.condition != 'usable'):
                flash('That asset is not available in usable condition.', 'danger')
            elif item.tracking_type == 'quantity' and quantity > available_quantity(item):
                flash(f'Issue failed: {quantity} requested, but only {available_quantity(item)} currently available.', 'danger')
            else:
                loan = Loan(student_id=student.id, item_id=item.id, asset_id=asset_id if item.tracking_type == 'asset' else None,
                    quantity_issued=quantity, quantity_outstanding=quantity, purpose=request.form.get('purpose','').strip(),
                    issue_date=issue_date, due_date=issue_date + timedelta(days=15), issued_by_id=current_user().id)
                db.session.add(loan); db.session.flush()
                if item.tracking_type == 'asset':
                    asset.status = 'issued'
                log_transaction('issue', item.id, current_user().id, quantity, f'Issued to {student.enrolment_number}; due {loan.due_date}', loan.id)
                db.session.commit(); flash(f'Issue recorded. Due date: {loan.due_date.isoformat()}.', 'success')
                return redirect(url_for('index'))
        assets = Asset.query.filter_by(status='available', condition='usable').order_by(Asset.asset_tag).all()
        return render_template('issue.html', students=students_list, items=items, assets=assets, today=date.today())

    @app.route('/returns/<int:loan_id>', methods=['GET', 'POST'])
    @role_required('coordinator')
    def record_return(loan_id):
        loan = db.get_or_404(Loan, loan_id)
        if request.method == 'POST':
            qty = request.form.get('quantity', type=int)
            condition = request.form.get('condition','usable')
            returned_on = date.fromisoformat(request.form.get('returned_on') or date.today().isoformat())
            if qty is None or qty < 1 or qty > loan.quantity_outstanding:
                flash(f'Return quantity must be between 1 and {loan.quantity_outstanding}.', 'danger')
            elif condition not in ('usable','damaged','lost','maintenance'):
                flash('Choose a valid condition.', 'danger')
            else:
                loan.quantity_outstanding -= qty
                if loan.quantity_outstanding == 0: loan.closed = True
                if loan.asset:
                    loan.asset.condition = condition
                    loan.asset.status = 'available' if condition == 'usable' else condition
                elif condition != 'usable':
                    loan.item.unavailable_quantity = min(loan.item.total_quantity, loan.item.unavailable_quantity + qty)
                log_transaction('return', loan.item_id, current_user().id, qty,
                    f'Returned {qty}; condition={condition}; date={returned_on.isoformat()}', loan.id)
                db.session.commit(); flash('Return and condition recorded.', 'success')
                return redirect(url_for('index'))
        return render_template('return_form.html', loan=loan, today=date.today())

    @app.route('/renew/<int:loan_id>', methods=['POST'])
    @login_required
    def request_renewal(loan_id):
        loan = db.get_or_404(Loan, loan_id)
        user = current_user()
        if user.role != 'student' or loan.student_id != user.id:
            flash('You can only request renewal for your own borrowing record.', 'danger')
        elif loan.closed or loan.due_date < date.today():
            flash('Renewal must be requested for an open loan before its due date.', 'danger')
        elif RenewalRequest.query.filter_by(loan_id=loan.id, status='pending').first():
            flash('A renewal request is already pending.', 'warning')
        else:
            db.session.add(RenewalRequest(loan_id=loan.id, requested_by_id=user.id))
            log_transaction('renewal_requested', loan.item_id, user.id, loan.quantity_outstanding, 'Request submitted; due date unchanged', loan.id)
            db.session.commit(); flash('Renewal request submitted. The due date remains unchanged until approval.', 'success')
        return redirect(url_for('index'))

    @app.route('/renewals/<int:req_id>/<decision>', methods=['POST'])
    @role_required('coordinator')
    def review_renewal(req_id, decision):
        renewal = db.get_or_404(RenewalRequest, req_id)
        remarks = request.form.get('remarks','').strip()
        if decision not in ('approve','reject') or renewal.status != 'pending':
            flash('This renewal request cannot be reviewed.', 'danger')
        else:
            renewal.status = 'approved' if decision == 'approve' else 'rejected'
            renewal.remarks = remarks
            renewal.reviewed_by_id = current_user().id
            if decision == 'approve' and not renewal.loan.closed:
                renewal.loan.due_date = renewal.loan.due_date + timedelta(days=15)
                renewal.revised_due_date = renewal.loan.due_date
            log_transaction('renewal_' + renewal.status, renewal.loan.item_id, current_user().id,
                renewal.loan.quantity_outstanding, remarks or 'No remarks', renewal.loan.id)
            db.session.commit(); flash(f'Renewal {renewal.status}.', 'success')
        return redirect(url_for('index'))

    @app.route('/overdue')
    @role_required('coordinator')
    def overdue():
        loans = Loan.query.filter(Loan.closed.is_(False), Loan.due_date < date.today()).order_by(Loan.due_date).all()
        return render_template('overdue.html', loans=loans, today=date.today())

    @app.route('/history')
    @login_required
    def history():
        user = current_user()
        if user.role == 'student':
            loans = Loan.query.filter_by(student_id=user.id).order_by(Loan.issue_date.desc()).all()
        else:
            loans = Loan.query.order_by(Loan.issue_date.desc()).limit(250).all()
        transactions = Transaction.query.order_by(Transaction.occurred_at.desc()).limit(250).all() if user.role == 'coordinator' else []
        return render_template('history.html', loans=loans, transactions=transactions)

    @app.cli.command('init-db')
    def init_db():
        db.create_all()
        print('Database tables created.')

    @app.cli.command('seed-demo')
    def seed_demo():
        if not User.query.filter_by(username='coordinator').first():
            c = User(username='coordinator', name='Inventory Coordinator', role='coordinator'); c.set_password('ChangeMe123!'); db.session.add(c)
        if not User.query.filter_by(username='student1').first():
            s = User(username='student1', name='Demo Student', role='student', enrolment_number='DEMO001', programme='M.Sc. DFIS', semester='I', contact='student@example.edu'); s.set_password('ChangeMe123!'); db.session.add(s)
        if not StorageLocation.query.filter_by(name='Cyber Lab').first(): db.session.add(StorageLocation(name='Cyber Lab', description='Demo storage location'))
        db.session.flush()
        loc = StorageLocation.query.filter_by(name='Cyber Lab').first()
        if not InventoryItem.query.filter_by(code='USBCABLE').first():
            db.session.add(InventoryItem(code='USBCABLE', name='USB Cable', category='Accessories', description='Reusable USB cable', tracking_type='quantity', total_quantity=20, location_id=loc.id))
        if not InventoryItem.query.filter_by(code='DEVBOARD').first():
            item=InventoryItem(code='DEVBOARD', name='Development Board', category='Development', description='Individually tracked development board', tracking_type='asset', total_quantity=2, location_id=loc.id); db.session.add(item); db.session.flush()
            for tag in ('DB-014','DB-015'):
                if not Asset.query.filter_by(asset_tag=tag).first(): db.session.add(Asset(item_id=item.id, asset_tag=tag, serial_number=tag, condition='usable', status='available', location_id=loc.id))
        db.session.commit(); print('Demo data ready. Login: coordinator / student1, password ChangeMe123!')

    return app

app = create_app()
