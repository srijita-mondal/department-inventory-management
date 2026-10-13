import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { Plus, Edit2, Search, Shield, X } from 'lucide-react';

const CONDITIONS = ['usable', 'damaged', 'maintenance', 'lost', 'retired'];

function AssetModal({ asset, items, locations, onClose, onSave }) {
  const [form, setForm] = useState(asset || {
    itemId: items[0]?.id || '',
    assetTag: '', serial: '', condition: 'usable', locationId: '',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{asset ? 'Edit Asset' : 'Register Asset'}</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Inventory Item *</label>
            <select className="form-select" value={form.itemId} onChange={e => upd('itemId', e.target.value)}>
              {items.filter(i => i.trackingType === 'individual').map(i => <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Asset Tag *</label>
              <input className="form-input" value={form.assetTag} onChange={e => upd('assetTag', e.target.value)} placeholder="NFSU-XXX-001-A" />
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input className="form-input" value={form.serial} onChange={e => upd('serial', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-select" value={form.condition} onChange={e => upd('condition', e.target.value)}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <select className="form-select" value={form.locationId} onChange={e => upd('locationId', e.target.value)}>
                <option value="">-- Select --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { if (!form.assetTag) { alert('Asset tag required'); return; } if (onSave(form) !== false) onClose(); }}>
            {asset ? 'Save' : 'Register Asset'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { state, actions } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterCond, setFilterCond] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [modal, setModal] = useState(null);

  const getItem = (id) => state.items.find(i => i.id === id);
  const getLocation = (id) => state.locations.find(l => l.id === id)?.name || '—';

  const condBadge = (c) => {
    const map = { usable: 'badge-green', damaged: 'badge-red', maintenance: 'badge-orange', lost: 'badge-gray', retired: 'badge-gray' };
    return <span className={`badge ${map[c] || 'badge-gray'}`}>{c}</span>;
  };
  const statusBadge = (s) => {
    const map = { available: 'badge-green', issued: 'badge-blue', damaged: 'badge-red', maintenance: 'badge-orange', lost: 'badge-gray' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  const filtered = state.assets.filter(a => {
    const q = search.toLowerCase();
    const mQ = !q || a.assetTag.toLowerCase().includes(q) || (a.serial || '').toLowerCase().includes(q);
    const mC = !filterCond || a.condition === filterCond;
    const mI = !filterItem || a.itemId === filterItem;
    return mQ && mC && mI;
  });

  const handleSave = (form) => {
    const result = form.id ? actions.updateAsset(form) : actions.addAsset(form);
    if (!result.ok) { toast.error(result.error); return false; }
    toast.success(form.id ? 'Asset updated.' : 'Asset registered.');
  };

  return (
    <AppLayout title="Assets" subtitle="Individually tracked asset registry">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Asset Registry</div>
          <div className="section-sub">{state.assets.length} assets registered</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={16} /> Register Asset</button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" style={{ width: 220 }} placeholder="Search tag or serial..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterItem} onChange={e => setFilterItem(e.target.value)}>
          <option value="">All Items</option>
          {state.items.filter(i => i.trackingType === 'individual').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={filterCond} onChange={e => setFilterCond(e.target.value)}>
          <option value="">All Conditions</option>
          {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Asset Tag</th><th>Item</th><th>Serial No.</th><th>Condition</th><th>Status</th><th>Location</th>{isAdmin && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const item = getItem(a.itemId);
                return (
                  <tr key={a.id}>
                    <td><code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{a.assetTag}</code></td>
                    <td>{item?.name || '—'}</td>
                    <td><code style={{ fontSize: 11 }}>{a.serial || '—'}</code></td>
                    <td>{condBadge(a.condition)}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td>{getLocation(a.locationId)}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-icon btn-secondary" onClick={() => setModal(a)}><Edit2 size={14} /></button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><Shield size={28} /><p>No assets found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <AssetModal
          asset={modal === 'add' ? null : modal}
          items={state.items}
          locations={state.locations}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}
