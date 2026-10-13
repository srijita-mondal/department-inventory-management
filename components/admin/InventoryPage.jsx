import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { Plus, Edit2, Search, Package, X } from 'lucide-react';

const CATEGORIES = ['Equipment', 'Cable', 'Adapter', 'Laboratory Tool', 'Furniture', 'Other'];
const CONDITIONS = ['usable', 'damaged', 'maintenance', 'lost', 'retired'];

function ItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || {
    itemCode: '', name: '', category: 'Equipment', description: '',
    make: '', model: '', trackingType: 'quantity',
    totalQty: 1, availableQty: 1, locationId: '', condition: 'usable',
  });
  const { state } = useStore();
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!item;

  const handleSave = () => {
    if (!form.itemCode || !form.name) { alert('Item code and name are required.'); return; }
    if (form.totalQty < 1) { alert('Total quantity must be at least 1.'); return; }
    if (onSave(form) !== false) onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Inventory Item' : 'Add Inventory Item'}</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Item Code *</label>
              <input className="form-input" value={form.itemCode} onChange={e => upd('itemCode', e.target.value)} placeholder="NFSU-XXX-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Item Name *</label>
              <input className="form-input" value={form.name} onChange={e => upd('name', e.target.value)} placeholder="e.g. Dell Laptop" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => upd('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tracking Type</label>
              <select className="form-select" value={form.trackingType} onChange={e => upd('trackingType', e.target.value)}>
                <option value="individual">Individual Asset</option>
                <option value="quantity">Quantity-Based</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => upd('description', e.target.value)} rows={2} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Make</label>
              <input className="form-input" value={form.make} onChange={e => upd('make', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-input" value={form.model} onChange={e => upd('model', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Quantity</label>
              <input className="form-input" type="number" min="1" value={form.totalQty} onChange={e => upd('totalQty', parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group">
              <label className="form-label">Storage Location</label>
              <select className="form-select" value={form.locationId} onChange={e => upd('locationId', e.target.value)}>
                <option value="">-- Select --</option>
                {state.locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Condition/Status</label>
            <select className="form-select" value={form.condition} onChange={e => upd('condition', e.target.value)}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Item'}</button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { state, actions } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterTrack, setFilterTrack] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | item

  const conditionBadge = (c) => {
    const map = { usable: 'badge-green', damaged: 'badge-red', maintenance: 'badge-orange', lost: 'badge-gray', retired: 'badge-gray' };
    return <span className={`badge ${map[c] || 'badge-gray'}`}>{c}</span>;
  };

  const filtered = state.items.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.itemCode.toLowerCase().includes(q);
    const matchCat = !filterCat || i.category === filterCat;
    const matchTrack = !filterTrack || i.trackingType === filterTrack;
    return matchQ && matchCat && matchTrack;
  });

  const getLocation = (id) => state.locations.find(l => l.id === id)?.name || '—';

  const handleSave = (form) => {
    const result = form.id ? actions.updateItem(form) : actions.addItem(form);
    if (!result.ok) { toast.error(result.error); return false; }
    toast.success(form.id ? 'Item updated successfully.' : 'Inventory item added.');
  };

  return (
    <AppLayout title="Inventory Items" subtitle="Manage departmental inventory">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Inventory Items</div>
          <div className="section-sub">{state.items.length} items recorded</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal('add')}>
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" style={{ width: 240 }} placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-select" style={{ width: 180 }} value={filterTrack} onChange={e => setFilterTrack(e.target.value)}>
          <option value="">All Tracking Types</option>
          <option value="individual">Individual Asset</option>
          <option value="quantity">Quantity-Based</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Item Code</th><th>Name</th><th>Category</th><th>Tracking</th>
                <th>Total</th><th>Available</th><th>Location</th><th>Condition</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{item.itemCode}</code></td>
                  <td><strong>{item.name}</strong>{item.make && <div style={{ fontSize: 11, color: '#9ca3af' }}>{item.make} {item.model}</div>}</td>
                  <td><span className="badge badge-blue">{item.category}</span></td>
                  <td><span className="badge badge-purple">{item.trackingType === 'individual' ? 'Individual' : 'Qty-Based'}</span></td>
                  <td style={{ textAlign: 'center' }}>{item.totalQty}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: item.availableQty === 0 ? '#c0392b' : item.availableQty < 3 ? '#d35400' : '#1a7f4f', fontWeight: 700 }}>
                      {item.availableQty}
                    </span>
                  </td>
                  <td>{getLocation(item.locationId)}</td>
                  <td>{conditionBadge(item.condition)}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-icon btn-secondary" title="Edit" onClick={() => setModal(item)}>
                        <Edit2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 9 : 8}><div className="empty-state"><Package size={28} /><p>No items found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ItemModal
          item={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}
