// Student Dashboard – personal borrowing view
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { differenceInDays, parseISO } from 'date-fns';
import { BookOpen, RotateCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}><Icon size={22} color={color} /></div>
      <div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div>
    </div>
  );
}

export default function StudentDashboard() {
  const { state, actions } = useStore();
  const { user } = useAuth();
  const toast = useToast();

  // Security: only show data belonging to the authenticated student
  const student = state.students.find(s => s.userId === user.id);
  const myIssues = student
    ? state.issues.filter(i => i.studentId === student.id)
    : [];

  const activeIssues = myIssues.filter(i => i.status === 'active' || i.status === 'overdue');
  const overdueIssues = myIssues.filter(i => i.status === 'overdue');
  const myRenewals = state.renewals.filter(r => r.studentId === student?.id);

  const getItem = (id) => state.items.find(i => i.id === id);

  const handleRenewalRequest = (issueId) => {
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

  const renewalBadge = (s) => {
    const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  if (!student) {
    return (
      <AppLayout title="My Dashboard" subtitle="Student borrowing portal">
        <div className="alert alert-warning">
          <AlertTriangle size={15} />
          <span>Your student record has not been linked to this account. Please contact the inventory coordinator.</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Dashboard" subtitle={`${student.name} · ${student.enrollmentNo}`}>
      {/* Student Profile Card */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #0d1b3e, #1a3a6b)', color: '#fff', border: 'none' }}>
        <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ background: '#e8a020', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, flexShrink: 0 }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{student.name}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>{student.programme} · Semester {student.semester}</div>
            <div style={{ opacity: 0.7, fontSize: 13 }}>Enrollment: {student.enrollmentNo}</div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard icon={BookOpen} value={activeIssues.length} label="Active Issues" color="#1a3a6b" bg="#dbeafe" />
        <StatCard icon={AlertTriangle} value={overdueIssues.length} label="Overdue" color="#c0392b" bg="#fee2e2" />
        <StatCard icon={RotateCcw} value={myRenewals.filter(r => r.status === 'pending').length} label="Pending Renewals" color="#854d0e" bg="#fef9c3" />
        <StatCard icon={CheckCircle} value={myIssues.filter(i => i.status === 'returned').length} label="Returned" color="#1a7f4f" bg="#dcfce7" />
      </div>

      {overdueIssues.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span>You have <strong>{overdueIssues.length} overdue item{overdueIssues.length > 1 ? 's' : ''}</strong>. Please return them immediately or request a renewal.</span>
        </div>
      )}

      {/* Active Issues */}
      <div className="section-heading" style={{ fontSize: 16, marginBottom: 12 }}>My Active Issues</div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Issue ID</th><th>Item(s)</th><th>Issued</th><th>Due Date</th><th>Outstanding</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {activeIssues.map(issue => {
                const outstanding = issue.lines.reduce((s, l) => s + l.qtyOutstanding, 0);
                const daysLeft = differenceInDays(parseISO(issue.dueDate), new Date());
                const hasPendingRenewal = state.renewals.some(r => r.issueId === issue.id && r.status === 'pending');
                return (
                  <tr key={issue.id} className={issue.status === 'overdue' ? 'overdue-row' : ''}>
                    <td><code style={{ fontSize: 11 }}>{issue.id}</code></td>
                    <td>
                      {issue.lines.map(l => (
                        <div key={l.id} style={{ fontSize: 12 }}>
                          {getItem(l.itemId)?.name} ×{l.qtyIssued}
                          <span style={{ color: '#9ca3af' }}> ({l.qtyOutstanding} remaining)</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ fontSize: 12 }}>{issue.issueDate}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: issue.status === 'overdue' ? '#c0392b' : daysLeft <= 3 ? '#d35400' : 'inherit' }}>
                        {issue.dueDate}
                      </div>
                      {issue.status !== 'overdue' && daysLeft >= 0 && (
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</div>
                      )}
                      {issue.status === 'overdue' && (
                        <div style={{ fontSize: 11, color: '#c0392b' }}>
                          {Math.abs(daysLeft)} day{Math.abs(daysLeft) !== 1 ? 's' : ''} overdue
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-orange">{outstanding}</span></td>
                    <td>{statusBadge(issue.status)}</td>
                    <td>
                      {hasPendingRenewal ? (
                        <span className="badge badge-yellow"><Clock size={11} /> Renewal Pending</span>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRenewalRequest(issue.id)}
                          title="Request renewal"
                        >
                          <RotateCcw size={13} /> Request Renewal
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {activeIssues.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><BookOpen size={28} /><p>No active issues.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Requests */}
      <div className="section-heading" style={{ fontSize: 16, marginBottom: 12 }}>My Renewal Requests</div>
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Request ID</th><th>Issue ID</th><th>Request Date</th><th>Current Due</th><th>Proposed Due</th><th>Status</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {[...myRenewals].reverse().map(r => (
                <tr key={r.id}>
                  <td><code style={{ fontSize: 11 }}>{r.id}</code></td>
                  <td><code style={{ fontSize: 11 }}>{r.issueId}</code></td>
                  <td style={{ fontSize: 12 }}>{r.requestDate}</td>
                  <td style={{ fontSize: 12 }}>{r.currentDueDate}</td>
                  <td style={{ fontSize: 12, color: '#1a7f4f', fontWeight: 600 }}>{r.proposedDueDate}</td>
                  <td>{renewalBadge(r.status)}</td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{r.remarks || '—'}</td>
                </tr>
              ))}
              {myRenewals.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state" style={{ padding: 20 }}><p>No renewal requests submitted.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
