import { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import AppLayout from '../layout/AppLayout';
import { downloadCsv } from '../../utils/csv';
import { differenceInDays, parseISO } from 'date-fns';
import { Download, FileText } from 'lucide-react';

export default function ReportsPage() {
  const { state } = useStore();
  const [programme, setProgramme] = useState('');
  const [locationId, setLocationId] = useState('');
  const [itemId, setItemId] = useState('');

  const programmes = [...new Set(state.students.map((s) => s.programme))];

  const rows = useMemo(() => {
    return state.issues
      .map((issue) => {
        const student = state.students.find((s) => s.id === issue.studentId);
        return { issue, student };
      })
      .filter(({ issue, student }) => {
        if (programme && student?.programme !== programme) return false;
        const lines = issue.lines.filter((l) => {
          if (itemId && l.itemId !== itemId) return false;
          if (locationId) {
            const item = state.items.find((i) => i.id === l.itemId);
            if (item?.locationId !== locationId) return false;
          }
          return true;
        });
        return lines.length > 0;
      });
  }, [state, programme, locationId, itemId]);

  const exportRows = () => {
    const csvRows = [];
    rows.forEach(({ issue, student }) => {
      issue.lines.forEach((l) => {
        const item = state.items.find((i) => i.id === l.itemId);
        if (itemId && l.itemId !== itemId) return;
        if (locationId && item?.locationId !== locationId) return;
        csvRows.push({
          issueId: issue.id,
          student: student?.name,
          enrollmentNo: student?.enrollmentNo,
          programme: student?.programme,
          item: item?.name,
          location: state.locations.find((loc) => loc.id === item?.locationId)?.name,
          qtyIssued: l.qtyIssued,
          qtyOutstanding: l.qtyOutstanding,
          issueDate: issue.issueDate,
          dueDate: issue.dueDate,
          status: issue.status,
          overdueDays: issue.status === 'overdue' ? differenceInDays(new Date(), parseISO(issue.dueDate)) : 0,
        });
      });
    });
    downloadCsv('nfsu-inventory-report.csv', csvRows);
  };

  return (
    <AppLayout title="Reports" subtitle="Student, item, programme, and location views">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Inventory Reports</div>
          <div className="section-sub">Filter and export issue records. Print this page for a paper copy.</div>
        </div>
        <button className="btn btn-secondary" onClick={exportRows} disabled={rows.length === 0}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="filter-bar">
        <select className="form-select" style={{ width: 220 }} value={programme} onChange={(e) => setProgramme(e.target.value)}>
          <option value="">All Programmes</option>
          {programmes.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="form-select" style={{ width: 220 }} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
          <option value="">All Locations</option>
          {state.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select className="form-select" style={{ width: 220 }} value={itemId} onChange={(e) => setItemId(e.target.value)}>
          <option value="">All Items</option>
          {state.items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>

      <div className="card print-area">
        <div className="card-header">
          <span className="card-title"><FileText size={15} style={{ display: 'inline', marginRight: 6 }} />Filtered Issues ({rows.length})</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Issue</th><th>Student</th><th>Programme</th><th>Items</th>
                <th>Issued</th><th>Due</th><th>Status</th><th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ issue, student }) => {
                const outstanding = issue.lines.reduce((s, l) => s + l.qtyOutstanding, 0);
                return (
                  <tr key={issue.id} className={issue.status === 'overdue' ? 'overdue-row' : ''}>
                    <td><code style={{ fontSize: 11 }}>{issue.id}</code></td>
                    <td>
                      <strong>{student?.name}</strong>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{student?.enrollmentNo}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{student?.programme}</td>
                    <td>
                      {issue.lines.map((l) => (
                        <div key={l.id} style={{ fontSize: 12 }}>
                          {state.items.find((i) => i.id === l.itemId)?.name} ×{l.qtyIssued}
                        </div>
                      ))}
                    </td>
                    <td>{issue.issueDate}</td>
                    <td>{issue.dueDate}</td>
                    <td><span className={`badge ${issue.status === 'overdue' ? 'badge-red' : issue.status === 'returned' ? 'badge-green' : 'badge-blue'}`}>{issue.status}</span></td>
                    <td style={{ textAlign: 'center' }}>{outstanding}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><p>No matching records.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
