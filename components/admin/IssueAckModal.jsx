import { Printer, X } from 'lucide-react';

export default function IssueAckModal({ ack, onClose }) {
  if (!ack) return null;

  return (
    <div className="modal-overlay">
      <div className="modal print-area">
        <div className="modal-header no-print">
          <span className="modal-title">Issue Acknowledgement</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0d1b3e' }}>NFSU InventoryHub</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Issue Acknowledgement · Keep this record with the borrower</div>
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div>
              <div className="form-hint">Issue ID</div>
              <strong>{ack.issueId}</strong>
            </div>
            <div>
              <div className="form-hint">Student</div>
              <strong>{ack.studentName}</strong>
              <div style={{ fontSize: 12 }}>{ack.enrollmentNo}</div>
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 12 }}>
            <div>
              <div className="form-hint">Issue Date</div>
              <strong>{ack.issueDate}</strong>
            </div>
            <div>
              <div className="form-hint">Due Date (15 calendar days)</div>
              <strong style={{ color: '#166534' }}>{ack.dueDate}</strong>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="form-hint">Purpose</div>
            <div>{ack.purpose}</div>
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th>Asset</th><th>Qty</th></tr>
            </thead>
            <tbody>
              {ack.lines.map((l, i) => (
                <tr key={i}>
                  <td>{l.name}</td>
                  <td>{l.assetTag || '—'}</td>
                  <td>{l.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer no-print">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={15} /> Print</button>
        </div>
      </div>
    </div>
  );
}
