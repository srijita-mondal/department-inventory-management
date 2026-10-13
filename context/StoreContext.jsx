// ============================================================
// Inventory / App Store Context
// ============================================================
// Demo store with transactional validation. In production this
// is replaced by Supabase (PostgreSQL + RLS + RPCs).
// Role checks here simulate server/database enforcement.
// ============================================================

import { createContext, useContext, useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { useAuth } from './AuthContext';
import {
  inventoryItems as INITIAL_ITEMS,
  assets as INITIAL_ASSETS,
  students as INITIAL_STUDENTS,
  issues as INITIAL_ISSUES,
  returns as INITIAL_RETURNS,
  renewals as INITIAL_RENEWALS,
  transactions as INITIAL_TRANSACTIONS,
  stockAdjustments as INITIAL_ADJUSTMENTS,
  locations,
} from '../data/mockData';

const STORAGE_KEY = 'nfsu_ih_store_v1';

const today = () => format(new Date(), 'yyyy-MM-dd');
const dueFrom = (issueDate) => format(addDays(new Date(issueDate), 15), 'yyyy-MM-dd');

const INITIAL_STATE = {
  items: INITIAL_ITEMS,
  assets: INITIAL_ASSETS,
  students: INITIAL_STUDENTS,
  issues: INITIAL_ISSUES,
  returns: INITIAL_RETURNS,
  renewals: INITIAL_RENEWALS,
  transactions: INITIAL_TRANSACTIONS,
  adjustments: INITIAL_ADJUSTMENTS,
  locations,
  idSeq: 1000,
  lastError: null,
  lastAck: null,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATE,
      ...parsed,
      locations,
      lastError: null,
      lastAck: null,
    };
  } catch {
    return INITIAL_STATE;
  }
}

function uid(state, prefix) {
  return `${prefix}-${state.idSeq + 1}`;
}

function bump(state) {
  return { ...state, idSeq: state.idSeq + 1 };
}

function txRecord(state, type, actorId, targetId, details) {
  const next = bump(state);
  const tx = {
    id: uid(state, 'tx'),
    type,
    actorId,
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };
  return { state: next, tx };
}

function fail(state, error) {
  return { ...state, lastError: error, lastAck: null };
}

function withTx(state, extra, type, actorId, targetId, details) {
  const { state: s, tx } = txRecord(state, type, actorId, targetId, details);
  return {
    ...s,
    ...extra,
    transactions: [...s.transactions, tx],
    lastError: null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'CLEAR_ERROR':
      return { ...state, lastError: null };
    case 'CLEAR_ACK':
      return { ...state, lastAck: null };

    case 'ADD_ITEM': {
      const item = action.item;
      if (!item?.itemCode?.trim() || !item?.name?.trim()) return fail(state, 'Item code and name are required.');
      const dup = state.items.some(
        (i) => i.itemCode.toLowerCase() === item.itemCode.trim().toLowerCase()
      );
      if (dup) return fail(state, 'Item code already exists.');
      const totalQty = Math.max(1, Number(item.totalQty) || 1);
      const next = bump(state);
      const record = {
        ...item,
        id: uid(state, 'inv'),
        itemCode: item.itemCode.trim(),
        totalQty,
        availableQty: totalQty,
        condition: item.condition || 'usable',
      };
      return withTx(
        next,
        { items: [...next.items, record] },
        'INVENTORY_CREATE',
        action.actorId,
        record.id,
        `Created item ${record.itemCode} (${record.name})`
      );
    }

    case 'UPDATE_ITEM': {
      const item = action.item;
      if (!state.items.some((i) => i.id === item.id)) return fail(state, 'Item not found.');
      const dup = state.items.some(
        (i) => i.id !== item.id && i.itemCode.toLowerCase() === item.itemCode.trim().toLowerCase()
      );
      if (dup) return fail(state, 'Item code already exists.');
      return withTx(
        state,
        {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, ...item, availableQty: i.availableQty } : i
          ),
        },
        'INVENTORY_UPDATE',
        action.actorId,
        item.id,
        `Updated item ${item.itemCode}`
      );
    }

    case 'ADD_ASSET': {
      const asset = action.asset;
      if (!asset?.assetTag?.trim()) return fail(state, 'Asset tag is required.');
      const item = state.items.find((i) => i.id === asset.itemId);
      if (!item || item.trackingType !== 'individual') return fail(state, 'Asset must belong to an individually tracked item.');
      if (state.assets.some((a) => a.assetTag.toLowerCase() === asset.assetTag.trim().toLowerCase())) {
        return fail(state, 'Asset tag already exists.');
      }
      const next = bump(state);
      const record = {
        ...asset,
        id: uid(state, 'ast'),
        assetTag: asset.assetTag.trim(),
        status: asset.condition === 'usable' ? 'available' : asset.condition,
      };
      const items = next.items.map((i) =>
        i.id !== item.id
          ? i
          : {
              ...i,
              totalQty: i.totalQty + 1,
              availableQty: record.status === 'available' ? i.availableQty + 1 : i.availableQty,
            }
      );
      return withTx(
        next,
        { assets: [...next.assets, record], items },
        'ASSET_CREATE',
        action.actorId,
        record.id,
        `Registered asset ${record.assetTag}`
      );
    }

    case 'UPDATE_ASSET': {
      const asset = action.asset;
      const existing = state.assets.find((a) => a.id === asset.id);
      if (!existing) return fail(state, 'Asset not found.');
      return withTx(
        state,
        { assets: state.assets.map((a) => (a.id === asset.id ? { ...a, ...asset } : a)) },
        'ASSET_UPDATE',
        action.actorId,
        asset.id,
        `Updated asset ${asset.assetTag || existing.assetTag}`
      );
    }

    case 'ADD_STUDENT': {
      const student = action.student;
      if (!student?.name?.trim() || !student?.enrollmentNo?.trim()) {
        return fail(state, 'Name and enrolment number are required.');
      }
      if (state.students.some((s) => s.enrollmentNo.toLowerCase() === student.enrollmentNo.trim().toLowerCase())) {
        return fail(state, 'Enrolment number already exists.');
      }
      const next = bump(state);
      const record = { ...student, id: uid(state, 'stu'), userId: null, enrollmentNo: student.enrollmentNo.trim() };
      return withTx(
        next,
        { students: [...next.students, record] },
        'STUDENT_CREATE',
        action.actorId,
        record.id,
        `Registered student ${record.name} (${record.enrollmentNo})`
      );
    }

    case 'UPDATE_STUDENT': {
      const student = action.student;
      if (!state.students.some((s) => s.id === student.id)) return fail(state, 'Student not found.');
      if (
        state.students.some(
          (s) => s.id !== student.id && s.enrollmentNo.toLowerCase() === student.enrollmentNo.trim().toLowerCase()
        )
      ) {
        return fail(state, 'Enrolment number already exists.');
      }
      const { userId, ...safe } = student;
      return withTx(
        state,
        {
          students: state.students.map((s) =>
            s.id === student.id ? { ...s, ...safe, userId: s.userId } : s
          ),
        },
        'STUDENT_UPDATE',
        action.actorId,
        student.id,
        `Updated student ${student.enrollmentNo}`
      );
    }

    case 'CREATE_ISSUE': {
      const { studentId, lines, purpose, actorId } = action;
      const student = state.students.find((s) => s.id === studentId);
      if (!student || student.status !== 'active') return fail(state, 'Only registered active students may receive items.');
      if (!purpose?.trim()) return fail(state, 'Purpose is required.');
      if (!lines?.length) return fail(state, 'At least one item is required.');

      const qtyByItem = {};
      const usedAssets = new Set();

      for (const line of lines) {
        const item = state.items.find((i) => i.id === line.itemId);
        if (!item) return fail(state, 'Unknown inventory item.');
        if (item.condition !== 'usable') return fail(state, `${item.name} is not in usable condition.`);
        const qty = Number(line.qty) || 0;
        if (qty < 1) return fail(state, 'Quantity must be at least 1.');

        if (item.trackingType === 'individual') {
          if (!line.assetId) return fail(state, `Select an asset for ${item.name}.`);
          if (usedAssets.has(line.assetId)) return fail(state, 'The same asset cannot be issued twice.');
          usedAssets.add(line.assetId);
          const asset = state.assets.find((a) => a.id === line.assetId);
          if (!asset || asset.itemId !== item.id) return fail(state, 'Invalid asset selection.');
          if (asset.status !== 'available' || asset.condition !== 'usable') {
            return fail(state, `Asset ${asset.assetTag} is not available.`);
          }
          const alreadyIssued = state.issues.some(
            (iss) =>
              iss.status !== 'returned' &&
              iss.lines.some((l) => l.assetId === line.assetId && l.qtyOutstanding > 0)
          );
          if (alreadyIssued) return fail(state, `Asset ${asset.assetTag} already has an active issue.`);
          if (qty !== 1) return fail(state, 'Individual assets must be issued as quantity 1.');
        } else if (line.assetId) {
          return fail(state, 'Quantity-based items cannot be linked to an asset ID.');
        }

        qtyByItem[item.id] = (qtyByItem[item.id] || 0) + qty;
      }

      for (const [itemId, qty] of Object.entries(qtyByItem)) {
        const item = state.items.find((i) => i.id === itemId);
        if (qty > item.availableQty) {
          return fail(state, `Requested ${qty} of ${item.name} exceeds available ${item.availableQty}.`);
        }
      }

      let working = state;
      const issueId = uid(working, 'iss');
      working = bump(working);

      const issueLines = lines.map((l) => {
        const lineId = uid(working, 'il');
        working = bump(working);
        return {
          id: lineId,
          issueId,
          itemId: l.itemId,
          assetId: l.assetId || null,
          qtyIssued: Number(l.qty),
          qtyReturned: 0,
          qtyOutstanding: Number(l.qty),
        };
      });

      const issueDate = today();
      const dueDate = dueFrom(issueDate);
      const newIssue = {
        id: issueId,
        studentId,
        issuedBy: actorId,
        issueDate,
        dueDate,
        status: 'active',
        purpose: purpose.trim(),
        lines: issueLines,
      };

      const updatedItems = working.items.map((item) => {
        const q = qtyByItem[item.id];
        if (!q) return item;
        return { ...item, availableQty: item.availableQty - q };
      });

      const updatedAssets = working.assets.map((asset) =>
        usedAssets.has(asset.id) ? { ...asset, status: 'issued' } : asset
      );

      const ack = {
        issueId,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        purpose: newIssue.purpose,
        issueDate,
        dueDate,
        lines: issueLines.map((l) => ({
          name: working.items.find((i) => i.id === l.itemId)?.name,
          qty: l.qtyIssued,
          assetTag: l.assetId ? working.assets.find((a) => a.id === l.assetId)?.assetTag : null,
        })),
      };

      const result = withTx(
        working,
        { issues: [...working.issues, newIssue], items: updatedItems, assets: updatedAssets },
        'ISSUE',
        actorId,
        issueId,
        `Issued to ${student.name} (${student.enrollmentNo}): ${lines.map((l) => `${l.qty}× ${l.itemId}`).join(', ')}`
      );
      return { ...result, lastAck: ack };
    }

    case 'RECORD_RETURN': {
      const { issueId, lineId, qty, condition, actorId, remarks } = action;
      const allowed = ['usable', 'damaged', 'lost', 'maintenance'];
      if (!allowed.includes(condition)) return fail(state, 'Invalid return condition.');
      const issue = state.issues.find((i) => i.id === issueId);
      if (!issue) return fail(state, 'Issue not found.');
      const line = issue.lines.find((l) => l.id === lineId);
      const nQty = Number(qty);
      if (!line || nQty < 1 || nQty > line.qtyOutstanding) {
        return fail(state, 'Return quantity exceeds outstanding quantity.');
      }

      const updatedLines = issue.lines.map((l) => {
        if (l.id !== lineId) return l;
        return {
          ...l,
          qtyReturned: l.qtyReturned + nQty,
          qtyOutstanding: l.qtyOutstanding - nQty,
        };
      });
      const allReturned = updatedLines.every((l) => l.qtyOutstanding === 0);
      const newStatus = allReturned ? 'returned' : issue.dueDate < today() ? 'overdue' : 'active';

      let updatedItems = state.items;
      let updatedAssets = state.assets;
      if (condition === 'usable') {
        updatedItems = state.items.map((item) =>
          item.id === line.itemId ? { ...item, availableQty: item.availableQty + nQty } : item
        );
        if (line.assetId) {
          updatedAssets = state.assets.map((a) =>
            a.id === line.assetId ? { ...a, status: 'available', condition: 'usable' } : a
          );
        }
      } else if (line.assetId) {
        updatedAssets = state.assets.map((a) =>
          a.id === line.assetId ? { ...a, status: condition, condition } : a
        );
      }

      let working = bump(state);
      const returnId = uid(state, 'ret');
      const newReturn = {
        id: returnId,
        issueId,
        issueLine: lineId,
        returnDate: today(),
        qtyReturned: nQty,
        condition,
        receivedBy: actorId,
        remarks: remarks || '',
      };

      return withTx(
        working,
        {
          issues: working.issues.map((i) =>
            i.id === issueId ? { ...i, lines: updatedLines, status: newStatus } : i
          ),
          items: updatedItems,
          assets: updatedAssets,
          returns: [...working.returns, newReturn],
        },
        'RETURN',
        actorId,
        issueId,
        `Return: ${nQty}× item (condition: ${condition}) for issue ${issueId}`
      );
    }

    case 'SUBMIT_RENEWAL': {
      const { issueId, studentId } = action;
      const issue = state.issues.find((i) => i.id === issueId);
      if (!issue) return fail(state, 'Issue not found.');
      if (issue.studentId !== studentId) return fail(state, 'You can only request renewal for your own issues.');
      if (issue.status === 'returned') return fail(state, 'Returned issues cannot be renewed.');
      if (state.renewals.some((r) => r.issueId === issueId && r.status === 'pending')) {
        return fail(state, 'A renewal request is already pending for this issue.');
      }
      let working = bump(state);
      const renewalId = uid(state, 'ren');
      const proposed = format(addDays(new Date(issue.dueDate), 15), 'yyyy-MM-dd');
      const newRenewal = {
        id: renewalId,
        issueId,
        studentId,
        requestDate: today(),
        status: 'pending',
        decisionBy: null,
        decisionDate: null,
        remarks: null,
        currentDueDate: issue.dueDate,
        proposedDueDate: proposed,
      };
      return withTx(
        working,
        { renewals: [...working.renewals, newRenewal] },
        'RENEWAL_REQUEST',
        studentId,
        renewalId,
        `Renewal request by student ${studentId} for issue ${issueId}`
      );
    }

    case 'DECIDE_RENEWAL': {
      const { renewalId, decision, remarks, actorId } = action;
      if (decision !== 'approved' && decision !== 'rejected') return fail(state, 'Invalid decision.');
      const renewal = state.renewals.find((r) => r.id === renewalId);
      if (!renewal || renewal.status !== 'pending') return fail(state, 'Renewal is not pending.');

      const updatedRenewal = {
        ...renewal,
        status: decision,
        decisionBy: actorId,
        decisionDate: today(),
        remarks: remarks || '',
      };

      let updatedIssues = state.issues;
      if (decision === 'approved') {
        updatedIssues = state.issues.map((i) => {
          if (i.id !== renewal.issueId) return i;
          const newDue = format(addDays(new Date(i.dueDate), 15), 'yyyy-MM-dd');
          const newStatus = i.status === 'returned' ? 'returned' : newDue < today() ? 'overdue' : 'active';
          return { ...i, dueDate: newDue, status: newStatus };
        });
      }

      return withTx(
        state,
        {
          renewals: state.renewals.map((r) => (r.id === renewalId ? updatedRenewal : r)),
          issues: updatedIssues,
        },
        decision === 'approved' ? 'RENEWAL_APPROVED' : 'RENEWAL_REJECTED',
        actorId,
        renewalId,
        `Renewal ${decision} for issue ${renewal.issueId}. Remarks: ${remarks || 'none'}`
      );
    }

    case 'STOCK_ADJUSTMENT': {
      const { itemId, assetId, type, reason, qtyAdjusted, newCondition, actorId } = action;
      if (!reason?.trim()) return fail(state, 'Reason is required.');
      const item = state.items.find((i) => i.id === itemId);
      if (!item) return fail(state, 'Item not found.');

      let updatedItems = state.items;
      let updatedAssets = state.assets;

      if (type === 'add_stock') {
        const qty = Number(qtyAdjusted);
        if (!Number.isInteger(qty) || qty < 1) return fail(state, 'Quantity to add must be at least 1.');
        updatedItems = state.items.map((i) =>
          i.id === itemId
            ? { ...i, totalQty: i.totalQty + qty, availableQty: i.availableQty + qty }
            : i
        );
      } else if (type === 'condition_change') {
        if (!assetId) return fail(state, 'Select an asset.');
        const asset = state.assets.find((a) => a.id === assetId);
        if (!asset) return fail(state, 'Asset not found.');
        if (asset.status === 'issued') return fail(state, 'Cannot change condition of an issued asset. Record a return first.');
        updatedAssets = state.assets.map((a) => {
          if (a.id !== assetId) return a;
          return { ...a, condition: newCondition, status: newCondition === 'usable' ? 'available' : newCondition };
        });
        if (asset.status === 'available' && newCondition !== 'usable') {
          updatedItems = state.items.map((i) =>
            i.id === asset.itemId ? { ...i, availableQty: Math.max(0, i.availableQty - 1) } : i
          );
        } else if (asset.status !== 'available' && newCondition === 'usable') {
          updatedItems = state.items.map((i) =>
            i.id === asset.itemId ? { ...i, availableQty: i.availableQty + 1 } : i
          );
        }
      } else {
        return fail(state, 'Unknown adjustment type.');
      }

      let working = bump(state);
      const adj = {
        id: uid(state, 'adj'),
        itemId,
        assetId: assetId || null,
        type,
        date: today(),
        reason: reason.trim(),
        qtyAdjusted: qtyAdjusted || null,
        newCondition: newCondition || null,
        actorId,
      };

      return withTx(
        working,
        { items: updatedItems, assets: updatedAssets, adjustments: [...working.adjustments, adj] },
        'STOCK_ADJUSTMENT',
        actorId,
        itemId,
        `Adjustment type="${type}" item=${itemId} ${qtyAdjusted ? `qty=${qtyAdjusted}` : ''} reason="${reason}"`
      );
    }

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [state, setState] = useState(loadState);

  useEffect(() => {
    const { lastError, lastAck, ...persistable } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [state]);

  const todayStr = today();
  const issuesWithStatus = state.issues.map((issue) => {
    if (issue.status === 'returned') return issue;
    const hasOutstanding = issue.lines.some((l) => l.qtyOutstanding > 0);
    if (!hasOutstanding) return { ...issue, status: 'returned' };
    return { ...issue, status: issue.dueDate < todayStr ? 'overdue' : 'active' };
  });

  const apply = (action) => {
    const next = reducer(state, action);
    setState(next);
    return next.lastError
      ? { ok: false, error: next.lastError }
      : { ok: true, ack: next.lastAck };
  };

  const deny = (msg) => ({ ok: false, error: msg });

  const run = (action) => apply(action);

  const requireAdmin = () => {
    if (!user || !isAdmin) return deny('Administrator permission required.');
    return null;
  };

  const actions = {
    addItem: (item) => requireAdmin() || run({ type: 'ADD_ITEM', item, actorId: user.id }),
    updateItem: (item) => requireAdmin() || run({ type: 'UPDATE_ITEM', item, actorId: user.id }),
    addAsset: (asset) => requireAdmin() || run({ type: 'ADD_ASSET', asset, actorId: user.id }),
    updateAsset: (asset) => requireAdmin() || run({ type: 'UPDATE_ASSET', asset, actorId: user.id }),
    addStudent: (student) => requireAdmin() || run({ type: 'ADD_STUDENT', student, actorId: user.id }),
    updateStudent: (student) => requireAdmin() || run({ type: 'UPDATE_STUDENT', student, actorId: user.id }),
    createIssue: (data) => requireAdmin() || run({ type: 'CREATE_ISSUE', ...data, actorId: user.id }),
    recordReturn: (data) => requireAdmin() || run({ type: 'RECORD_RETURN', ...data, actorId: user.id }),
    decideRenewal: (data) => requireAdmin() || run({ type: 'DECIDE_RENEWAL', ...data, actorId: user.id }),
    stockAdjustment: (data) => requireAdmin() || run({ type: 'STOCK_ADJUSTMENT', ...data, actorId: user.id }),
    submitRenewal: (data) => {
      if (!user) return deny('Authentication required.');
      const student = state.students.find((s) => s.userId === user.id);
      if (!student) return deny('Student record not linked to this account.');
      if (data.studentId && data.studentId !== student.id) {
        return deny('You cannot submit a renewal for another student.');
      }
      return run({ type: 'SUBMIT_RENEWAL', issueId: data.issueId, studentId: student.id });
    },
    clearAck: () => apply({ type: 'CLEAR_ACK' }),
    clearError: () => apply({ type: 'CLEAR_ERROR' }),
  };

  return (
    <StoreContext.Provider value={{ state: { ...state, issues: issuesWithStatus }, actions }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
};
