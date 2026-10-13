import { useStore } from '../../context/StoreContext';
import AppLayout from '../layout/AppLayout';
import { format, differenceInDays, parseISO } from 'date-fns';
import {
  Package, Users, ClipboardList, AlertTriangle, RotateCcw,
  ArrowLeftRight, TrendingUp, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon: Icon, value, label, color, bg, onClick }) {
  return (
    <div className="stat-card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div className="stat-icon" style={{ background: bg }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { state } = useStore();
  const nav = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const totalItems = state.items.length;
  const totalAvailableQty = state.items.reduce((s, i) => s + i.availableQty, 0);
  const activeIssues = state.issues.filter(i => i.status === 'active' || i.status === 'overdue').length;
  const overdueIssues = state.issues.filter(i => i.status === 'overdue').length;
  const pendingRenewals = state.renewals.filter(r => r.status === 'pending').length;
  const damagedAssets = state.assets.filter(a => a.condition === 'damaged').length;

  const recentTx = [...state.transactions].reverse().slice(0, 8);

  const overdueList = state.issues
    .filter(i => i.status === 'overdue')
    .map(i => {
      const student = state.students.find(s => s.id === i.studentId);
      const overdueDays = differenceInDays(new Date(), parseISO(i.dueDate));
      return { ...i, student, overdueDays };
    });

  const upcomingDue = state.issues
    .filter(i => i.status === 'active')
    .filter(i => {
      const days = differenceInDays(parseISO(i.dueDate), new Date());
      return days >= 0 && days <= 5;
    })
    .map(i => {
      const student = state.students.find(s => s.id === i.studentId);
      return { ...i, student, daysLeft: differenceInDays(parseISO(i.dueDate), new Date()) };
    });

  const txTypeColors = {
    ISSUE: '#dbeafe',
    RETURN: '#dcfce7',
    RENEWAL_REQUEST: '#fef9c3',
    RENEWAL_APPROVED: '#dcfce7',
    RENEWAL_REJECTED: '#fee2e2',
    STOCK_ADJUSTMENT: '#ede9fe',
  };
  const txTypeLabel = {
    ISSUE: 'Issue',
    RETURN: 'Return',
    RENEWAL_REQUEST: 'Renewal Req.',
    RENEWAL_APPROVED: 'Renewal ✓',
    RENEWAL_REJECTED: 'Renewal ✗',
    STOCK_ADJUSTMENT: 'Stock Adj.',
  };

  return (
    <AppLayout title="Dashboard" subtitle="Administrative Overview">
      <div className="section-heading">Inventory Overview</div>
      <div className="section-sub">Real-time statistics across all departments</div>

      <div className="stats-grid">
        <StatCard icon={Package} value={totalItems} label="Inventory Items" color="#1a3a6b" bg="#dbeafe" onClick={() => nav('/admin/inventory')} />
        <StatCard icon={CheckCircle} value={totalAvailableQty} label="Available Stock" color="#1a7f4f" bg="#dcfce7" onClick={() => nav('/admin/inventory')} />
        <StatCard icon={ClipboardList} value={activeIssues} label="Active Issues" color="#d35400" bg="#ffedd5" onClick={() => nav('/admin/issues')} />
        <StatCard icon={AlertTriangle} value={overdueIssues} label="Overdue Issues" color="#c0392b" bg="#fee2e2" onClick={() => nav('/admin/overdue')} />
        <StatCard icon={RotateCcw} value={pendingRenewals} label="Pending Renewals" color="#854d0e" bg="#fef9c3" onClick={() => nav('/admin/renewals')} />
        <StatCard icon={Users} value={state.students.length} label="Registered Students" color="#5b21b6" bg="#ede9fe" onClick={() => nav('/admin/students')} />
        <StatCard icon={Package} value={damagedAssets} label="Damaged Assets" color="#c0392b" bg="#fee2e2" onClick={() => nav('/admin/assets')} />
        <StatCard icon={ArrowLeftRight} value={state.returns.length} label="Total Returns" color="#1a7f4f" bg="#dcfce7" onClick={() => nav('/admin/returns')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Overdue Issues */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: '#c0392b' }}><AlertTriangle size={15} style={{ display: 'inline', marginRight: 6 }} />Overdue Issues</span>
            <button className="btn btn-secondary btn-sm" onClick={() => nav('/admin/overdue')}>View All</button>
          </div>
          <div className="table-wrapper">
            {overdueList.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}><CheckCircle size={28} style={{ opacity: 0.4, display: 'block', margin: '0 auto 8px' }} /><p>No overdue issues!</p></div>
            ) : (
              <table>
                <thead><tr><th>Student</th><th>Due Date</th><th>Overdue</th></tr></thead>
                <tbody>
                  {overdueList.map(i => (
                    <tr key={i.id} className="overdue-row">
                      <td>{i.student?.name || 'Unknown'}</td>
                      <td>{i.dueDate}</td>
                      <td><span className="badge badge-red">{i.overdueDays}d</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Due */}
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: '#854d0e' }}><TrendingUp size={15} style={{ display: 'inline', marginRight: 6 }} />Due This Week</span>
          </div>
          <div className="table-wrapper">
            {upcomingDue.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}><CheckCircle size={28} style={{ opacity: 0.4, display: 'block', margin: '0 auto 8px' }} /><p>No items due this week.</p></div>
            ) : (
              <table>
                <thead><tr><th>Student</th><th>Due Date</th><th>Days Left</th></tr></thead>
                <tbody>
                  {upcomingDue.map(i => (
                    <tr key={i.id}>
                      <td>{i.student?.name}</td>
                      <td>{i.dueDate}</td>
                      <td><span className="badge badge-yellow">{i.daysLeft}d</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Pending Renewals */}
      {pendingRenewals > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <RotateCcw size={16} />
          <span><strong>{pendingRenewals} renewal request{pendingRenewals > 1 ? 's' : ''}</strong> awaiting your decision. <button className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={() => nav('/admin/renewals')}>Review Now</button></span>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <button className="btn btn-secondary btn-sm" onClick={() => nav('/admin/transactions')}>Full Log</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Type</th><th>Details</th><th>Timestamp</th></tr></thead>
            <tbody>
              {recentTx.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <span className="badge" style={{ background: txTypeColors[tx.type] || '#f3f4f6', color: '#374151' }}>
                      {txTypeLabel[tx.type] || tx.type}
                    </span>
                  </td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.details}</td>
                  <td style={{ color: '#9ca3af', fontSize: 12 }}>{tx.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
