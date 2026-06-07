import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Tag } from '../../components/ui/Tag';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partially paid' },
  { value: 'PAID', label: 'Paid' },
];

const STATUS_TAGS = {
  PENDING: { label: 'Pending', color: 'red' },
  PARTIAL: { label: 'Partially paid', color: 'yellow' },
  PAID: { label: 'Paid', color: 'green' },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
};

export default function InvoiceListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [periodId, setPeriodId] = useState('');
  const [status, setStatus] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchInvoices = async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({ pageSize: '100' });
      if (periodId.trim()) {
        params.set('feePeriodId', periodId.trim());
      }
      if (status) {
        params.set('status', status);
      }

      try {
        const response = await fetch(
          `http://localhost:3001/api/invoices?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            signal: controller.signal,
          }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load invoices');
        }

        setInvoices(result.data || []);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setInvoices([]);
          setError(requestError.message || 'Unable to connect to the server');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();
    return () => controller.abort();
  }, [periodId, status, reloadKey]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main
          className={`flex-1 p-8 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
              <p className="mt-1 text-muted-foreground">
                Review household invoices and payment status.
              </p>
            </div>

            <Card className="flex flex-wrap items-end gap-4">
              <label className="min-w-56 space-y-2 text-sm font-medium">
                <span>Fee period ID</span>
                <input
                  type="number"
                  min="1"
                  value={periodId}
                  onChange={(event) => setPeriodId(event.target.value)}
                  placeholder="All fee periods"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <label className="min-w-56 space-y-2 text-sm font-medium">
                <span>Status</span>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  options={STATUS_OPTIONS}
                  className="w-full"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </Card>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" />
                  Loading invoices...
                </div>
              ) : error ? (
                <div className="min-h-64 p-8 text-center text-destructive">
                  {error}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice number</TableHead>
                      <TableHead>Household / room</TableHead>
                      <TableHead>Total amount</TableHead>
                      <TableHead>Paid amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No invoices match the selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => {
                        const statusTag = STATUS_TAGS[invoice.status] || {
                          label: invoice.status,
                          color: 'red',
                        };

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>
                              {invoice.household?.room_number || invoice.household_id}
                            </TableCell>
                            <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                            <TableCell>{formatCurrency(invoice.paid_amount)}</TableCell>
                            <TableCell>
                              <Tag color={statusTag.color}>{statusTag.label}</Tag>
                            </TableCell>
                            <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
