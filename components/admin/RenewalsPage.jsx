import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { RotateCcw, CheckCircle, XCircle, X } from 'lucide-react';

function DecisionModal({ renewal, onClose }) {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const issue = state.issues.find(i => i.id === renewal.issueId);
  const student = state.students.find(s => s.id === renewal.studentId);

  const handle = (decision) => {
    const result = actions.decideRenewal({ renewalId: renewal.id, decision, remarks, actorId: user.id });
    if (!result.ok) { setError(result.error); return; }
    toast.success(`Renewal ${decision === 'approved' ? 'approved' : 'rejected'}.`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Renewal Decision</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info">
            <div><strong>Student:</strong> {student?.name} ({student?.enrollmentNo})</div>
            <div><strong>Issue:</strong> {renewal.issueId}</div>
            <div><strong>Current Due:</strong> {renewal.currentDueDate}</div>
            <div style={{ color: '#1a7f4f' }}><strong>If Approved, New Due:</strong> {renewal.proposedDueDate}</div>
          </div>
          <div className="alert alert-warning">
            <RotateCcw size={14} /> Approving will extend the due date by <strong>15 calendar days</strong>.
            Rejecting will leave the due date unchanged.
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-textarea" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks for the student..." rows={3} />
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handle('rejected')}><XCircle size={15} /> Reject</button>
          <button className="btn btn-success" onClick={() => handle('approved')}><CheckCircle size={15} /> Approve</button>
        </div>
      </div>
    </div>
  );
}

export default function RenewalsPage() {
  const { state } = useStore();
  const { isAdmin } = useAuth();
  const [filterStatus, setFilterStatus] = useState('pending');
  const [decisionModal, setDecisionModal] = useState(null);

  const getStudent = (id) => state.students.find(s => s.id === id);

  const filtered = state.renewals.filter(r => !filterStatus || r.status === filterStatus);

  const statusBadge = (s) => {
    const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  const pendingCount = state.renewals.filter(r => r.status === 'pending').length;

  return (
    <AppLayout title="Renewal Requests" subtitle="Review and decide on student renewal requests">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Renewal Requests</div>
          <div className="section-sub">{pendingCount} pending decisions</div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <RotateCcw size={14} />
          <span><strong>{pendingCount} renewal request{pendingCount > 1 ? 's' : ''}</strong> await your decision. A pending request does NOT extend the due date.</span>
        </div>
      )}

      <div className="filter-bar">
        <div className="tabs" style={{ marginBottom: 0 }}>
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`tab-btn ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Renewal ID</th><th>Student</th><th>Issue ID</th><th>Request Date</th>
                <th>Current Due</th><th>Proposed Due</th><th>Status</th>
                {isAdmin && <th>Remarks</th>}
                {isAdmin && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const student = getStudent(r.studentId);
                return (
                  <tr key={r.id}>
                    <td><code style={{ fontSize: 11 }}>{r.id}</code></td>
                    <td>
                      <strong>{student?.name}</strong>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{student?.enrollmentNo}</div>
                    </td>
                    <td><code style={{ fontSize: 11 }}>{r.issueId}</code></td>
                    <td>{r.requestDate}</td>
                    <td>{r.currentDueDate}</td>
                    <td style={{ color: '#1a7f4f', fontWeight: 600 }}>{r.proposedDueDate}</td>
                    <td>{statusBadge(r.status)}</td>
                    {isAdmin && <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 200 }}>{r.remarks || '—'}</td>}
                    {isAdmin && (
                      <td>
                        {r.status === 'pending' ? (
                          <button className="btn btn-warning btn-sm" onClick={() => setDecisionModal(r)}>
                            <RotateCcw size={13} /> Decide
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: '#9ca3af' }}>Decided</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><RotateCcw size={28} /><p>No renewal requests.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {decisionModal && <DecisionModal renewal={decisionModal} onClose={() => setDecisionModal(null)} />}
    </AppLayout>
  );
}
