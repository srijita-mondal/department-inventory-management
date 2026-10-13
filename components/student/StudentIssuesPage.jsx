// Student Issues Page – detailed view of own issues
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { differenceInDays, parseISO } from 'date-fns';
import { BookOpen, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

export default function StudentIssuesPage() {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();

  // Security: derive student from authenticated user identity, not from URL param
  const student = state.students.find(s => s.userId === user.id);
  const myIssues = student
    ? [...state.issues.filter(i => i.studentId === student.id)].sort(
        (a, b) => a.dueDate < b.dueDate ? -1 : 1
      )
    : [];

  const getItem = (id) => state.items.find(i => i.id === id);
  const getAsset = (id) => state.assets.find(a => a.id === id);

  const handleRenewal = (issueId) => {
    if (!student) return;
    const existing = state.renewals.find(r => r.issueId === issueId && r.status === 'pending');
    if (existing) { toast.warning('A renewal request is already pending for this issue.'); return; }
    const result = actions.submitRenewal({ issueId, studentId: student.id });
    if (!result.ok) { toast.error(result.error); return; }
    toast.success('Renewal request submitted. Awaiting coordinator approval.');
  };

  const statusBadge = (s) => {
    const map = { active: 'badge-blue', overdue: 'badge-red', returned: 'badge-green' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  if (!student) {
    return (
      <AppLayout title="My Issues" subtitle="Your borrowing records">
        <div className="alert alert-warning"><AlertTriangle size={15} /><span>Student record not linked to this account.</span></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Issues" subtitle="All your borrowing records">
      <div className="section-heading">My Borrowing History</div>
      <div className="section-sub">{myIssues.length} total issues · {student.name}</div>

      {myIssues.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <BookOpen size={48} />
          <p>You have no borrowing records.</p>
        </div>
      ) : (
        myIssues.map(issue => {
          const outstanding = issue.lines.reduce((s, l) => s + l.qtyOutstanding, 0);
          const daysLeft = differenceInDays(parseISO(issue.dueDate), new Date());
          const hasPendingRenewal = state.renewals.some(r => r.issueId === issue.id && r.status === 'pending');

          return (
            <div key={issue.id} className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{issue.id}</code>
                  {statusBadge(issue.status)}
                  {hasPendingRenewal && <span className="badge badge-yellow"><Clock size={11} /> Renewal Pending</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {issue.status !== 'returned' && outstanding > 0 && !hasPendingRenewal && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRenewal(issue.id)}>
                      <RotateCcw size={13} /> Request Renewal
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="form-row" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Issue Date</div>
                    <div style={{ fontWeight: 600 }}>{issue.issueDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Due Date</div>
                    <div style={{ fontWeight: 700, color: issue.status === 'overdue' ? '#c0392b' : issue.status === 'active' && daysLeft <= 3 ? '#d35400' : '#1a7f4f' }}>
                      {issue.dueDate}
                    </div>
                    {issue.status !== 'returned' && (
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>
                        {issue.status === 'overdue'
                          ? `${Math.abs(daysLeft)} days overdue`
                          : daysLeft >= 0 ? `${daysLeft} days remaining` : ''}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Purpose</div>
                    <div style={{ fontSize: 13 }}>{issue.purpose}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Outstanding</div>
                    <span className={`badge ${outstanding > 0 ? 'badge-orange' : 'badge-green'}`}>{outstanding}</span>
                  </div>
                </div>

                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Item Details</div>
                <table style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Item</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Asset Tag</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Issued</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Returned</th>
                      <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#374151' }}>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issue.lines.map(l => (
                      <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '6px 8px' }}>{getItem(l.itemId)?.name || '—'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          {l.assetId ? (
                            <code style={{ fontSize: 11 }}>{getAsset(l.assetId)?.assetTag}</code>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>{l.qtyIssued}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: '#1a7f4f' }}>{l.qtyReturned}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span className={`badge ${l.qtyOutstanding > 0 ? 'badge-orange' : 'badge-green'}`}>
                            {l.qtyOutstanding}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </AppLayout>
  );
}
