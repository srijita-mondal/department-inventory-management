import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { Plus, Search, ClipboardList, X, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import IssueAckModal from './IssueAckModal';

function IssueModal({ onClose }) {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();

  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [lines, setLines] = useState([{ itemId: '', assetId: '', qty: 1 }]);
  const [errors, setErrors] = useState([]);

  const activeStudents = state.students.filter(s => s.status === 'active');
  const today = format(new Date(), 'yyyy-MM-dd');
  const dueDate = format(addDays(new Date(), 15), 'yyyy-MM-dd');

  const getAvailableAssets = (itemId) =>
    state.assets.filter(a => a.itemId === itemId && a.status === 'available' && a.condition === 'usable');

  const getItem = (id) => state.items.find(i => i.id === id);

  const updateLine = (idx, key, val) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [key]: key === 'qty' ? parseInt(val) || 1 : val, ...(key === 'itemId' ? { assetId: '' } : {}) } : l));
  };

  const addLine = () => setLines(prev => [...prev, { itemId: '', assetId: '', qty: 1 }]);
  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const errs = [];
    if (!studentId) errs.push('Please select a student.');
    if (!purpose.trim()) errs.push('Purpose is required.');
    if (lines.length === 0) errs.push('At least one item must be selected.');
    lines.forEach((l, i) => {
      if (!l.itemId) { errs.push(`Line ${i + 1}: Select an item.`); return; }
      const item = getItem(l.itemId);
      if (!item) return;
      if (item.trackingType === 'individual') {
        if (!l.assetId) errs.push(`Line ${i + 1}: Select an asset for individual tracking.`);
        const asset = state.assets.find(a => a.id === l.assetId);
        if (asset && asset.status !== 'available') errs.push(`Line ${i + 1}: Selected asset is not available.`);
      } else {
        if (l.qty < 1) errs.push(`Line ${i + 1}: Quantity must be at least 1.`);
        if (l.qty > item.availableQty) errs.push(`Line ${i + 1}: Requested (${l.qty}) exceeds available (${item.availableQty}).`);
      }
    });
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    const payload = lines.map((l) => {
      const item = getItem(l.itemId);
      return {
        itemId: l.itemId,
        assetId: item?.trackingType === 'individual' ? l.assetId : null,
        qty: item?.trackingType === 'individual' ? 1 : l.qty,
      };
    });
    const result = actions.createIssue({ studentId, lines: payload, purpose, actorId: user.id });
    if (!result.ok) { setErrors([result.error]); return; }
    toast.success('Items issued successfully!');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">Issue Items to Student</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {errors.length > 0 && (
            <div className="alert alert-danger">
              <ul style={{ margin: 0, paddingLeft: 18 }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select className="form-select" value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">-- Select Active Student --</option>
                {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.enrollmentNo})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose *</label>
              <input className="form-input" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Final Year Project" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Issue Date</label>
              <input className="form-input" value={today} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date (auto-calculated)</label>
              <input className="form-input" value={dueDate} disabled style={{ background: '#f0fdf4', color: '#166534', fontWeight: 600 }} />
              <div className="form-hint">15 calendar days from issue date</div>
            </div>
          </div>

          <div style={{ marginBottom: 8, fontWeight: 700, color: '#1a3a6b' }}>Items to Issue</div>
          {lines.map((line, idx) => {
            const item = getItem(line.itemId);
            const availableAssets = line.itemId ? getAvailableAssets(line.itemId) : [];
            return (
              <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 12, background: '#f9fafb' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 2 }}>
                    <label className="form-label">Item</label>
                    <select className="form-select" value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}>
                      <option value="">-- Select Item --</option>
                      {state.items.filter(i => i.condition === 'usable' && i.availableQty > 0).map(i => (
                        <option key={i.id} value={i.id}>{i.name} (Avail: {i.availableQty})</option>
                      ))}
                    </select>
                  </div>
                  {item?.trackingType === 'individual' ? (
                    <div style={{ flex: 2 }}>
                      <label className="form-label">Asset</label>
                      <select className="form-select" value={line.assetId} onChange={e => updateLine(idx, 'assetId', e.target.value)}>
                        <option value="">-- Select Asset --</option>
                        {availableAssets.map(a => <option key={a.id} value={a.id}>{a.assetTag} ({a.serial})</option>)}
                      </select>
                    </div>
                  ) : (
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Qty (Max: {item?.availableQty || 0})</label>
                      <input className="form-input" type="number" min={1} max={item?.availableQty || 1} value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} />
                    </div>
                  )}
                  {lines.length > 1 && (
                    <div style={{ paddingTop: 22 }}>
                      <button className="btn btn-icon btn-danger" onClick={() => removeLine(idx)}><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <button className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={14} /> Add Another Item</button>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSubmit}><CheckCircle size={15} /> Confirm Issue</button>
        </div>
      </div>
    </div>
  );
}

export default function IssuePage() {
  const { state, actions } = useStore();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const getStudent = (id) => state.students.find(s => s.id === id);
  const getItem = (id) => state.items.find(i => i.id === id);

  const filtered = state.issues.filter(i => {
    const student = getStudent(i.studentId);
    const q = search.toLowerCase();
    const mQ = !q || student?.name.toLowerCase().includes(q) || student?.enrollmentNo.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
    const mS = !filterStatus || i.status === filterStatus;
    return mQ && mS;
  });

  const statusBadge = (s) => {
    const map = { active: 'badge-blue', overdue: 'badge-red', returned: 'badge-green', partial: 'badge-orange' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  const sortedIssues = [...filtered].sort((a, b) => a.dueDate < b.dueDate ? -1 : 1);

  return (
    <AppLayout title="Issue Management" subtitle="Issue items to registered students">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Item Issues</div>
          <div className="section-sub">{state.issues.length} total issues recorded</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Issue Items
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" style={{ width: 240 }} placeholder="Search by student or issue ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Issue ID</th><th>Student</th><th>Items</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Outstanding</th></tr>
            </thead>
            <tbody>
              {sortedIssues.map(issue => {
                const student = getStudent(issue.studentId);
                const outstanding = issue.lines.reduce((s, l) => s + l.qtyOutstanding, 0);
                return (
                  <tr key={issue.id} className={issue.status === 'overdue' ? 'overdue-row' : ''}>
                    <td><code style={{ fontSize: 11 }}>{issue.id}</code></td>
                    <td>
                      <strong>{student?.name || 'Unknown'}</strong>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{student?.enrollmentNo}</div>
                    </td>
                    <td>
                      {issue.lines.map(l => (
                        <div key={l.id} style={{ fontSize: 12 }}>{getItem(l.itemId)?.name} ×{l.qtyIssued}</div>
                      ))}
                    </td>
                    <td>{issue.issueDate}</td>
                    <td style={{ fontWeight: 600, color: issue.status === 'overdue' ? '#c0392b' : 'inherit' }}>{issue.dueDate}</td>
                    <td>{statusBadge(issue.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${outstanding > 0 ? 'badge-orange' : 'badge-green'}`}>{outstanding}</span>
                    </td>
                  </tr>
                );
              })}
              {sortedIssues.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><ClipboardList size={28} /><p>No issues found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <IssueModal onClose={() => setShowModal(false)} />}
      {state.lastAck && <IssueAckModal ack={state.lastAck} onClose={() => actions.clearAck()} />}
    </AppLayout>
  );
}
