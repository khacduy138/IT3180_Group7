import React, { useMemo, useState } from 'react';

import useAsync from '../../hooks/useAsync';
import { createInvoice, listInvoices } from '../../services/billingService';
import formatCurrency from '../../utils/formatCurrency';

export default function BillingPage() {
  const { loading, data, error, run } = useAsync(listInvoices, []);

  const [form, setForm] = useState({ householdId: '', total: '' });
  const [submitState, setSubmitState] = useState({ loading: false, error: null, result: null });

  const rows = Array.isArray(data?.data) ? data.data : [];

  const columns = useMemo(
    () => [
      { key: 'id', header: 'ID' },
      { key: 'householdId', header: 'Household ID' },
      { key: 'total', header: 'Total' },
      { key: 'status', header: 'Status' },
    ],
    []
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitState({ loading: true, error: null, result: null });
    try {
      const totalNumber = form.total ? Number(form.total) : undefined;
      if (form.total && !Number.isFinite(totalNumber)) {
        setSubmitState({ loading: false, error: { message: 'Total must be a number' }, result: null });
        return;
      }

      const payload = {
        householdId: form.householdId || undefined,
        total: totalNumber,
      };
      const result = await createInvoice(payload);
      setSubmitState({ loading: false, error: null, result });
      await run();
    } catch (err) {
      setSubmitState({ loading: false, error: err, result: null });
    }
  };

  return (
    <div>
      <h2>Billing</h2>

      <section style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Create invoice (POST /api/billing)</h3>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420 }}>
          <label>
            Household ID
            <input
              value={form.householdId}
              onChange={(e) => setForm((s) => ({ ...s, householdId: e.target.value }))}
              style={{ width: '100%', padding: 8 }}
              placeholder="e.g. H001"
            />
          </label>
          <label>
            Total
            <input
              value={form.total}
              onChange={(e) => setForm((s) => ({ ...s, total: e.target.value }))}
              style={{ width: '100%', padding: 8 }}
              placeholder="e.g. 1500000"
              inputMode="numeric"
            />
          </label>
          <button type="submit" disabled={submitState.loading}>
            {submitState.loading ? 'Submitting...' : 'Create invoice'}
          </button>
        </form>

        {submitState.error && <p>Error: {submitState.error.message}</p>}
        {submitState.result && (
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(submitState.result, null, 2)}</pre>
        )}
      </section>

      <section>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Invoices (GET /api/billing)</h3>
          <button type="button" onClick={() => run()} disabled={loading}>
            Refresh
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}
        {data?.message && <p>{data.message}</p>}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    style={{ textAlign: 'left', borderBottom: '1px solid currentColor', padding: 8 }}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ padding: 8 }}>
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row?.id ?? idx}>
                    {columns.map((c) => (
                      <td key={c.key} style={{ borderBottom: '1px solid currentColor', padding: 8 }}>
                        {c.key === 'total'
                          ? formatCurrency(row?.[c.key]) || String(row?.[c.key] ?? '')
                          : String(row?.[c.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>}
      </section>
    </div>
  );
}
