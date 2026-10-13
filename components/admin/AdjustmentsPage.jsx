import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { Settings, Plus, X } from 'lucide-react';
import { DEMO_USERS } from '../../data/mockData';

function AdjustmentModal({ onClose }) {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [type, setType] = useState('add_stock');
  const [itemId, setItemId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [qty, setQty] = useState(1);
  const [newCondition, setNewCondition] = useState('usable');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const item = state.items.find(i => i.id === itemId);
  const availableAssets = item ? state.assets.filter(a => a.itemId === itemId) : [];

  const handleSubmit = () => {
    if (!itemId) { setError('Select an item.'); return; }
    if (!reason.trim()) { setError('Reason is required.'); return; }
    if (type === 'add_stock' && qty < 1) { setError('Quantity must be at least 1.'); return; }
    if (type === 'condition_change' && !assetId) { setError('Select an asset for condition change.'); return; }
    const result = actions.stockAdjustment({ itemId, assetId: assetId || null, type, reason, qtyAdjusted: qty, newCondition, actorId: user.id });
    if (!result.ok) { setError(result.error); return; }
    toast.success('Stock adjustment recorded.');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Stock Adjustment</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="form-group">
            <label className="form-label">Adjustment Type</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="add_stock">Add Stock</option>
              <option value="condition_change">Change Asset Condition</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Item</label>
            <select className="form-select" value={itemId} onChange={e => { setItemId(e.target.value); setAssetId(''); }}>
              <option value="">-- Select Item --</option>
              {state.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          {type === 'add_stock' && (
            <div className="form-group">
              <label className="form-label">Quantity to Add</label>
              <input className="form-input" type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} />
            </div>
          )}
          {type === 'condition_change' && item && (
            <>
              <div className="form-group">
                <label className="form-label">Asset</label>
                <select className="form-select" value={assetId} onChange={e => setAssetId(e.target.value)}>
                  <option value="">-- Select Asset --</option>
                  {availableAssets.map(a => <option key={a.id} value={a.id}>{a.assetTag} — {a.condition}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">New Condition</label>
                <select className="form-select" value={newCondition} onChange={e => setNewCondition(e.target.value)}>
                  {['usable', 'damaged', 'maintenance', 'lost', 'retired'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain the reason for this adjustment..." rows={3} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}><Plus size={14} /> Record Adjustment</button>
        </div>
      </div>
    </div>
  );
}

export default function AdjustmentsPage() {
  const { state } = useStore();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const getActor = (id) => DEMO_USERS?.find(u => u.id === id)?.name || id;
  const getItem = (id) => state.items.find(i => i.id === id)?.name || '—';
  const getAsset = (id) => state.assets.find(a => a.id === id)?.assetTag || '—';

  return (
    <AppLayout title="Stock Adjustments" subtitle="Record stock changes, condition updates, and corrections">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Stock Adjustments</div>
          <div className="section-sub">{state.adjustments.length} adjustments recorded</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Adjustment</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>ID</th><th>Type</th><th>Item</th><th>Asset</th><th>Qty</th><th>New Condition</th><th>Reason</th><th>Date</th><th>By</th></tr></thead>
            <tbody>
              {[...state.adjustments].reverse().map(a => (
                <tr key={a.id}>
                  <td><code style={{ fontSize: 11 }}>{a.id}</code></td>
                  <td><span className="badge badge-purple">{a.type.replace(/_/g, ' ')}</span></td>
                  <td>{getItem(a.itemId)}</td>
                  <td>{a.assetId ? getAsset(a.assetId) : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{a.qtyAdjusted ?? '—'}</td>
                  <td>
                    {a.newCondition
                      ? <span className={`badge ${a.newCondition === 'usable' ? 'badge-green' : 'badge-red'}`}>{a.newCondition}</span>
                      : '—'}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 200 }}>{a.reason}</td>
                  <td style={{ fontSize: 12 }}>{a.date}</td>
                  <td style={{ fontSize: 12 }}>{getActor(a.actorId)}</td>
                </tr>
              ))}
              {state.adjustments.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><Settings size={28} /><p>No adjustments recorded.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AdjustmentModal onClose={() => setShowModal(false)} />}
    </AppLayout>
  );
}
