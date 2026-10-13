import pytest
from app import create_app
from extensions import db
from models import User, StorageLocation, InventoryItem

@pytest.fixture()
def app(tmp_path):
    app = create_app({'TESTING': True, 'SECRET_KEY': 'test-secret', 'SQLALCHEMY_DATABASE_URI': f'sqlite:///{tmp_path / "test.db"}'})
    with app.app_context():
        db.drop_all(); db.create_all()
        c = User(username='coordinator', name='Coordinator', role='coordinator'); c.set_password('testpass')
        s = User(username='student1', name='Student One', role='student', enrolment_number='S001'); s.set_password('testpass')
        loc = StorageLocation(name='Lab')
        db.session.add_all([c,s,loc]); db.session.flush()
        db.session.add(InventoryItem(code='CABLE', name='USB Cable', tracking_type='quantity', total_quantity=5, location_id=loc.id))
        db.session.commit()
    yield app
    with app.app_context(): db.session.remove(); db.drop_all()

@pytest.fixture()
def client(app): return app.test_client()

def login(client, username, password='testpass'):
    return client.post('/login', data={'username': username, 'password': password}, follow_redirects=True)
