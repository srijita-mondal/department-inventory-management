import { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import AppLayout from '../layout/AppLayout';
import { Plus, Edit2, Search, Users, X } from 'lucide-react';

const PROGRAMMES = [
  'B.Tech Cyber Security',
  'M.Sc Digital Forensics',
  'M.Sc Forensic Science',
  'B.Tech Computer Science',
  'PhD Cyber Security',
  'Other',
];

function StudentModal({ student, onClose, onSave }) {
  const [form, setForm] = useState(student || {
    name: '', enrollmentNo: '', programme: PROGRAMMES[0],
    semester: 1, status: 'active', email: '',
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.enrollmentNo) { alert('Name and enrollment number are required.'); return; }
    if (onSave(form) !== false) onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{student ? 'Edit Student' : 'Register Student'}</span>
          <button className="btn btn-icon btn-secondary" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => upd('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Enrollment Number *</label>
              <input className="form-input" value={form.enrollmentNo} onChange={e => upd('enrollmentNo', e.target.value)} placeholder="NFSU2024XXX" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Programme</label>
              <select className="form-select" value={form.programme} onChange={e => upd('programme', e.target.value)}>
                {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester</label>
              <select className="form-select" value={form.semester} onChange={e => upd('semester', parseInt(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NFSU Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="student@nfsu.ac.in" />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Status</label>
              <select className="form-select" value={form.status} onChange={e => upd('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{student ? 'Save Changes' : 'Register Student'}</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { state, actions } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filterProg, setFilterProg] = useState('');
  const [modal, setModal] = useState(null);

  const filtered = state.students.filter(s => {
    const q = search.toLowerCase();
    const mQ = !q || s.name.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase().includes(q);
    const mP = !filterProg || s.programme === filterProg;
    return mQ && mP;
  });

  const getActiveIssues = (studentId) =>
    state.issues.filter(i => i.studentId === studentId && (i.status === 'active' || i.status === 'overdue')).length;

  const statusBadge = (s) => {
    if (s === 'active') return <span className="badge badge-green">Active</span>;
    if (s === 'inactive') return <span className="badge badge-gray">Inactive</span>;
    return <span className="badge badge-red">Suspended</span>;
  };

  const handleSave = (form) => {
    const result = form.id ? actions.updateStudent(form) : actions.addStudent(form);
    if (!result.ok) { toast.error(result.error); return false; }
    toast.success(form.id ? 'Student record updated.' : 'Student registered successfully.');
  };

  return (
    <AppLayout title="Students" subtitle="Manage registered students">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="section-heading">Registered Students</div>
          <div className="section-sub">{state.students.length} students on record</div>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setModal('add')}>
            <Plus size={16} /> Register Student
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} className="search-icon" />
          <input className="form-input search-input" style={{ width: 240 }} placeholder="Search by name or enrollment no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 220 }} value={filterProg} onChange={e => setFilterProg(e.target.value)}>
          <option value="">All Programmes</option>
          {PROGRAMMES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Enrollment No.</th><th>Name</th><th>Programme</th><th>Semester</th>
                <th>Status</th><th>Active Issues</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td><code style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{s.enrollmentNo}</code></td>
                  <td><strong>{s.name}</strong><div style={{ fontSize: 11, color: '#9ca3af' }}>{s.email}</div></td>
                  <td>{s.programme}</td>
                  <td>Semester {s.semester}</td>
                  <td>{statusBadge(s.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${getActiveIssues(s.id) > 0 ? 'badge-orange' : 'badge-gray'}`}>
                      {getActiveIssues(s.id)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-icon btn-secondary" onClick={() => setModal(s)}><Edit2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><Users size={28} /><p>No students found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <StudentModal
          student={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </AppLayout>
  );
}
