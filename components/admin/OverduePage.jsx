import { useStore } from '../../context/StoreContext';
import AppLayout from '../layout/AppLayout';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function OverduePage() {
  const { state } = useStore();

  const getStudent = (id) => state.students.find(s => s.id === id);
  const getItem = (id) => state.items.find(i => i.id === id);

  const overdueIssues = state.issues
    .filter(i => i.status === 'overdue')
    .map(i => {
      const student = getStudent(i.studentId);
      const overdueDays = differenceInDays(new Date(), parseISO(i.dueDate));
      return { ...i, student, overdueDays };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays);

  return (
    <AppLayout title="Overdue Monitoring" subtitle="Issues past their due date with outstanding items">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Overdue Issues</div>
          <div className="section-sub">{overdueIssues.length} outstanding overdue issue{overdueIssues.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {overdueIssues.length > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} />
          <span><strong>{overdueIssues.length} issue{overdueIssues.length > 1 ? 's' : ''}</strong> have passed their due date. A pending renewal request does not suppress overdue status.</span>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Issue ID</th><th>Student</th><th>Items</th>
                <th>Issue Date</th><th>Due Date</th><th>Overdue Days</th>
                <th>Outstanding Qty</th><th>Renewal Status</th>
              </tr>
            </thead>
            <tbody>
              {overdueIssues.map(issue => {
                const outstanding = issue.lines.reduce((s, l) => s + l.qtyOutstanding, 0);
                const renewal = state.renewals.find(r => r.issueId === issue.id && r.status === 'pending');
                return (
                  <tr key={issue.id} className="overdue-row">
                    <td><code style={{ fontSize: 11 }}>{issue.id}</code></td>
                    <td>
                      <strong>{issue.student?.name || 'Unknown'}</strong>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{issue.student?.enrollmentNo}</div>
                    </td>
                    <td>
                      {issue.lines.map(l => (
                        <div key={l.id} style={{ fontSize: 12 }}>
                          {getItem(l.itemId)?.name} ×{l.qtyOutstanding} outstanding
                        </div>
                      ))}
                    </td>
                    <td>{issue.issueDate}</td>
                    <td style={{ fontWeight: 700, color: '#c0392b' }}>{issue.dueDate}</td>
                    <td>
                      <span className="badge badge-red" style={{ fontSize: 13, padding: '4px 10px' }}>
                        {issue.overdueDays} day{issue.overdueDays !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-orange">{outstanding}</span></td>
                    <td>
                      {renewal
                        ? <span className="badge badge-yellow">Renewal Pending — still overdue</span>
                        : <span className="badge badge-gray">No Request</span>}
                    </td>
                  </tr>
                );
              })}
              {overdueIssues.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <CheckCircle size={32} />
                      <p style={{ fontSize: 16, marginTop: 8 }}>No overdue issues! Great job.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
