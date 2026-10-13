import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import AppLayout from '../layout/AppLayout';
import { History, Search, Download } from 'lucide-react';
import { downloadCsv } from '../../utils/csv';
import { DEMO_USERS } from '../../data/mockData';

const TX_TYPES = ['ISSUE', 'RETURN', 'RENEWAL_REQUEST', 'RENEWAL_APPROVED', 'RENEWAL_REJECTED', 'STOCK_ADJUSTMENT'];

const TX_BADGES = {
  ISSUE: 'badge-blue',
  RETURN: 'badge-green',
  RENEWAL_REQUEST: 'badge-yellow',
  RENEWAL_APPROVED: 'badge-green',
  RENEWAL_REJECTED: 'badge-red',
  STOCK_ADJUSTMENT: 'badge-purple',
};

export default function TransactionsPage() {
  const { state } = useStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const getActor = (id) => DEMO_USERS.find(u => u.id === id)?.name || id || 'System';

  const filtered = [...state.transactions]
    .reverse()
    .filter(tx => {
      const q = search.toLowerCase();
      const mQ = !q || tx.details.toLowerCase().includes(q) || tx.type.toLowerCase().includes(q);
      const mT = !filterType || tx.type === filterType;
      return mQ && mT;
    });

  return (
    <AppLayout title="Transaction Log" subtitle="Full audit trail of all inventory operations">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Audit Trail</div>
          <div className="section-sub">{state.transactions.length} events recorded</div>
        </div>
        <button className="btn btn-secondary" onClick={() => downloadCsv('nfsu-transactions.csv', filtered.map(tx => ({
          type: tx.type, actor: getActor(tx.actorId), details: tx.details, timestamp: tx.timestamp,
        })))}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" style={{ width: 280 }} placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 200 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Type</th><th>Actor</th><th>Details</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td><span className={`badge ${TX_BADGES[tx.type] || 'badge-gray'}`}>{tx.type.replace(/_/g, ' ')}</span></td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{getActor(tx.actorId)}</td>
                  <td style={{ maxWidth: 400, fontSize: 12 }}>{tx.details}</td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: '#9ca3af' }}>{tx.timestamp?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4}><div className="empty-state"><History size={28} /><p>No transactions found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
