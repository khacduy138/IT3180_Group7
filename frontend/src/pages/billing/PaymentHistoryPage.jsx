import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getHouseholdLabel = (payment) => {
  const invoice = payment.invoice;
  const room = invoice?.household?.room_number || invoice?.household_id;
  const householdName = invoice?.household?.name;

  if (!room && !householdName) {
    return '-';
  }

  return householdName ? `${householdName} / ${room}` : room;
};

export default function PaymentHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [invoiceId, setInvoiceId] = useState('');
  const [appliedInvoiceId, setAppliedInvoiceId] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPayments = async () => {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (appliedInvoiceId.trim()) {
        params.set('invoiceId', appliedInvoiceId.trim());
      }

      try {
        const response = await fetch(
          `http://localhost:3001/api/payments${params.toString() ? `?${params.toString()}` : ''}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            signal: controller.signal,
          }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Unable to load payments');
        }

        setPayments(result.data || []);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setPayments([]);
          setError(requestError.message || 'Unable to connect to the server');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPayments();
    return () => controller.abort();
  }, [appliedInvoiceId, reloadKey]);

  const applyFilter = (event) => {
    event.preventDefault();
    setAppliedInvoiceId(invoiceId);
  };

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
              <h1 className="text-3xl font-bold tracking-tight">Payment history</h1>
              <p className="mt-1 text-muted-foreground">
                Review recorded payments by invoice.
              </p>
            </div>

            <Card>
              <form className="flex flex-wrap items-end gap-4" onSubmit={applyFilter}>
                <label className="min-w-56 space-y-2 text-sm font-medium">
                  <span>Invoice ID</span>
                  <Input
                    type="number"
                    min="1"
                    value={invoiceId}
                    onChange={(event) => setInvoiceId(event.target.value)}
                    placeholder="All invoices"
                  />
                </label>

                <Button type="submit">Apply filter</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReloadKey((current) => current + 1)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </form>
            </Card>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" />
                  Loading payments...
                </div>
              ) : error ? (
                <div className="min-h-64 p-8 text-center text-destructive">
                  {error}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Invoice number</TableHead>
                      <TableHead>Household / room</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment method</TableHead>
                      <TableHead>Payment date</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No payments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>{payment.invoice?.invoice_number || payment.invoice_id}</TableCell>
                          <TableCell>{getHouseholdLabel(payment)}</TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell>{formatDateTime(payment.payment_date)}</TableCell>
                          <TableCell>{payment.note || '-'}</TableCell>
                        </TableRow>
                      ))
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
