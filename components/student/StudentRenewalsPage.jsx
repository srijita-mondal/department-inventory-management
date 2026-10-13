// Student Renewals Page
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { RotateCcw, AlertTriangle, Clock } from 'lucide-react';

export default function StudentRenewalsPage() {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();

  const student = state.students.find(s => s.userId === user.id);
  const myRenewals = student
    ? [...state.renewals.filter(r => r.studentId === student.id)].reverse()
    : [];

  const eligibleIssues = student
    ? state.issues.filter(i =>
        i.studentId === student.id &&
        (i.status === 'active' || i.status === 'overdue') &&
        !state.renewals.some(r => r.issueId === i.id && r.status === 'pending')
      )
    : [];

  const handleRenewal = (issueId) => {
    const result = actions.submitRenewal({ issueId, studentId: student.id });
    if (!result.ok) { toast.error(result.error); return; }
    toast.success('Renewal request submitted. Awaiting coordinator approval.');
  };

  const statusBadge = (s) => {
    const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  if (!student) {
    return (
      <AppLayout title="My Renewals" subtitle="Renewal requests">
        <div className="alert alert-warning"><AlertTriangle size={15} /><span>Student record not linked.</span></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Renewals" subtitle="Track your renewal requests">
      <div className="section-heading">Renewal Requests</div>
      <div className="section-sub">
        Note: A pending renewal request does <strong>not</strong> automatically extend your due date. Wait for coordinator approval.
      </div>

      {eligibleIssues.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <RotateCcw size={14} />
          <div>
            <strong>You can request renewal for these active issues:</strong>
            {eligibleIssues.map(i => (
              <div key={i.id} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <code style={{ fontSize: 11 }}>{i.id}</code>
                <span style={{ fontSize: 12 }}>Due: {i.dueDate}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleRenewal(i.id)}>
                  <RotateCcw size={12} /> Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Request ID</th><th>Issue ID</th><th>Requested</th>
                <th>Current Due</th><th>Proposed Due</th><th>Status</th>
                <th>Decision Date</th><th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {myRenewals.map(r => (
                <tr key={r.id}>
                  <td><code style={{ fontSize: 11 }}>{r.id}</code></td>
                  <td><code style={{ fontSize: 11 }}>{r.issueId}</code></td>
                  <td style={{ fontSize: 12 }}>{r.requestDate}</td>
                  <td style={{ fontSize: 12 }}>{r.currentDueDate}</td>
                  <td style={{ fontSize: 12, color: '#1a7f4f', fontWeight: 600 }}>{r.proposedDueDate}</td>
                  <td>
                    {statusBadge(r.status)}
                    {r.status === 'pending' && (
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Due date unchanged</div>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{r.decisionDate || '—'}</td>
                  <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 180 }}>{r.remarks || '—'}</td>
                </tr>
              ))}
              {myRenewals.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state" style={{ padding: 30 }}>
                    <RotateCcw size={28} />
                    <p>No renewal requests submitted yet.</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
