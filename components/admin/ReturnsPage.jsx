import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { ArrowLeftRight, Search, X, CheckCircle } from 'lucide-react';

function ReturnModal({ issue, onClose }) {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [selectedLine, setSelectedLine] = useState(issue.lines.find(l => l.qtyOutstanding > 0)?.id || '');
  const [qty, setQty] = useState(1);
  const [condition, setCondition] = useState('usable');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const line = issue.lines.find(l => l.id === selectedLine);
  const getItem = (id) => state.items.find(i => i.id === id);

  const handleReturn = () => {
    if (!selectedLine) { setError('Select an issue line.'); return; }
    if (!line) { setError('Invalid line.'); return; }
    if (qty < 1 || qty > line.qtyOutstanding) {
      setError(`Quantity must be between 1 and ${line.qtyOutstanding}.`); return;
    }
    const result = actions.recordReturn({
      issueId: issue.id,
      lineId: selectedLine,
      qty,
      condition,
      actorId: user.id,
      remarks,
    });
    if (!result.ok) { setError(result.error); return; }
    toast.success(`Return of ${qty} item(s) recorded.`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Record Return</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="alert alert-info">
            <span>Issue <strong>{issue.id}</strong> · Due: <strong>{issue.dueDate}</strong></span>
          </div>
          <div className="form-group">
            <label className="form-label">Select Line</label>
            <select className="form-select" value={selectedLine} onChange={e => { setSelectedLine(e.target.value); setQty(1); }}>
              <option value="">-- Select --</option>
              {issue.lines.filter(l => l.qtyOutstanding > 0).map(l => (
                <option key={l.id} value={l.id}>
                  {getItem(l.itemId)?.name} — Outstanding: {l.qtyOutstanding}
                </option>
              ))}
            </select>
          </div>
          {line && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Return Quantity (Max: {line.qtyOutstanding})</label>
                  <input className="form-input" type="number" min={1} max={line.qtyOutstanding} value={qty}
                    onChange={e => setQty(Math.min(parseInt(e.target.value) || 1, line.qtyOutstanding))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Condition on Return</label>
                  <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                    <option value="usable">Usable (restore to stock)</option>
                    <option value="damaged">Damaged (stays unavailable)</option>
                    <option value="lost">Lost</option>
                    <option value="maintenance">Needs Maintenance</option>
                  </select>
                </div>
              </div>
              {condition !== 'usable' && (
                <div className="alert alert-warning">
                  Item will be marked <strong>{condition}</strong> and will NOT be restored to available stock.
                </div>
              )}
            </>
          )}
          <div className="form-group">
            <label className="form-label">Remarks (optional)</label>
            <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Any notes about the return..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleReturn}><CheckCircle size={15} /> Record Return</button>
        </div>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const { state } = useStore();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [returnModal, setReturnModal] = useState(null);

  const getStudent = (id) => state.students.find(s => s.id === id);
  const getItem = (id) => state.items.find(i => i.id === id);

  // Active issues with outstanding items
  const activeIssues = state.issues.filter(i =>
    (i.status === 'active' || i.status === 'overdue') &&
    i.lines.some(l => l.qtyOutstanding > 0)
  );

  const filtered = activeIssues.filter(i => {
    const student = getStudent(i.studentId);
    const q = search.toLowerCase();
    return !q || student?.name.toLowerCase().includes(q) || student?.enrollmentNo.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
  });

  const statusBadge = (s) => {
    const map = { active: 'badge-blue', overdue: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <AppLayout title="Returns" subtitle="Record item returns and inspect condition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Outstanding Issues</div>
          <div className="section-sub">Record complete or partial returns below</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" style={{ width: 240 }} placeholder="Search by student or issue ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Issue ID</th><th>Student</th><th>Items Outstanding</th><th>Issue Date</th><th>Due Date</th><th>Status</th>{isAdmin && <th>Action</th>}</tr>
            </thead>
            <tbody>
              {filtered.map(issue => {
                const student = getStudent(issue.studentId);
                return (
                  <tr key={issue.id} className={issue.status === 'overdue' ? 'overdue-row' : ''}>
                    <td><code style={{ fontSize: 11 }}>{issue.id}</code></td>
                    <td>
                      <strong>{student?.name}</strong>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{student?.enrollmentNo}</div>
                    </td>
                    <td>
                      {issue.lines.filter(l => l.qtyOutstanding > 0).map(l => (
                        <div key={l.id} style={{ fontSize: 12 }}>
                          {getItem(l.itemId)?.name}: <strong>{l.qtyOutstanding} outstanding</strong>
                          {l.assetId && <span style={{ color: '#6b7280' }}> (Asset)</span>}
                        </div>
                      ))}
                    </td>
                    <td>{issue.issueDate}</td>
                    <td style={{ fontWeight: 600, color: issue.status === 'overdue' ? '#c0392b' : 'inherit' }}>{issue.dueDate}</td>
                    <td>{statusBadge(issue.status)}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn btn-success btn-sm" onClick={() => setReturnModal(issue)}>
                          <ArrowLeftRight size={13} /> Record Return
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><CheckCircle size={28} /><p>No outstanding issues.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return History */}
      <div style={{ marginTop: 24 }}>
        <div className="section-heading" style={{ fontSize: 16, marginBottom: 12 }}>Return History</div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Return ID</th><th>Issue ID</th><th>Date</th><th>Qty Returned</th><th>Condition</th><th>Remarks</th></tr></thead>
              <tbody>
                {[...state.returns].reverse().map(r => (
                  <tr key={r.id}>
                    <td><code style={{ fontSize: 11 }}>{r.id}</code></td>
                    <td><code style={{ fontSize: 11 }}>{r.issueId}</code></td>
                    <td>{r.returnDate}</td>
                    <td style={{ textAlign: 'center' }}>{r.qtyReturned}</td>
                    <td>
                      <span className={`badge ${r.condition === 'usable' ? 'badge-green' : r.condition === 'damaged' ? 'badge-red' : 'badge-orange'}`}>
                        {r.condition}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{r.remarks || '—'}</td>
                  </tr>
                ))}
                {state.returns.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state" style={{ padding: 20 }}><p>No return records.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {returnModal && <ReturnModal issue={returnModal} onClose={() => setReturnModal(null)} />}
    </AppLayout>
  );
}
