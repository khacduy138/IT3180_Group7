import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";

import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";

const STATUS_TAGS = {
  PENDING: { label: "Pending", color: "red" },
  PARTIAL: { label: "Partially paid", color: "yellow" },
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const getRemainingAmount = (invoice) =>
  Math.max(
    Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0),
    0,
  );

const getHouseholdLabel = (invoice) => {
  const room = invoice.household?.room_number || invoice.household_id;
  const householdName = invoice.household?.name;

  return householdName ? `${householdName} / ${room}` : room;
};

export default function PaymentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHOD_OPTIONS[0].value,
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchInvoices = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "http://localhost:3001/api/invoices?pageSize=100",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            signal: controller.signal,
          },
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load invoices");
        }

        setInvoices(
          (result.data || []).filter((invoice) =>
            ["PENDING", "PARTIAL"].includes(invoice.status),
          ),
        );
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setInvoices([]);
          setError(requestError.message || "Unable to connect to the server");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return invoices;
    }

    return invoices.filter((invoice) => {
      const fields = [
        invoice.invoice_number,
        invoice.household?.room_number,
        invoice.household?.name,
        invoice.household_id,
      ];

      return fields.some((field) =>
        String(field || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [invoices, search]);

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setAmount(String(getRemainingAmount(invoice)));
    setPaymentMethod(PAYMENT_METHOD_OPTIONS[0].value);
    setNote("");
    setSubmitError("");
  };

  const closePaymentModal = () => {
    if (submitting) {
      return;
    }

    setSelectedInvoice(null);
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedInvoice) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(
        `http://localhost:3001/api/invoices/${selectedInvoice.id}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            amount: Number(amount),
            paymentMethod,
            note: note.trim() || undefined,
          }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to record payment");
      }

      setSelectedInvoice(null);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      setSubmitError(requestError.message || "Unable to connect to the server");
    } finally {
      setSubmitting(false);
    }
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
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Thu phí</h1>
              <p className="mt-1 text-muted-foreground">
                Thực hiện thu phí cho các hóa đơn đang chờ thanh toán.
              </p>
            </div>

            <div className="flex gap-2 items-center bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all w-full max-w-2xl">
              <Input
                placeholder="tìm số hóa đơn, phòng hoặc nhân khẩu..."
                className="border-none bg-transparent focus-visible:ring-0 text-base h-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setReloadKey((prev) => prev + 1)
                }
                rightIcon={
                  search.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={() => {
                        setSearch("");
                        setReloadKey((prev) => prev + 1);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  )
                }
              />

              <div className="h-6 w-px bg-border" />

              <Button
                variant="icon"
                className="rounded-xl h-10 w-12 p-0 flex shrink-0"
                onClick={() => setReloadKey((prev) => prev + 1)}
              >
                <Search size={18} />
              </Button>

              <div className="h-6 w-px bg-border" />

              <Button
                variant="outline"
                className="rounded-xl h-10 px-4 flex gap-2 shrink-0 border-none hover:bg-muted font-medium text-sm text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setReloadKey((prev) => prev + 1);
                }}
              >
                <RefreshCw size={16} />
                làm mới
              </Button>
            </div>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" />
                  Loading outstanding invoices...
                </div>
              ) : error ? (
                <div className="min-h-64 p-8 text-center text-destructive">
                  {error}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số hóa đơn</TableHead>
                      <TableHead>Hộ gia đình / Phòng</TableHead>
                      <TableHead>Tổng số tiền</TableHead>
                      <TableHead>Đã thanh toán</TableHead>
                      <TableHead>Dư nợ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No outstanding invoices match the search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const statusTag = STATUS_TAGS[invoice.status] || {
                          label: invoice.status,
                          color: "red",
                        };

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>{getHouseholdLabel(invoice)}</TableCell>
                            <TableCell>
                              {formatCurrency(invoice.total_amount)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(invoice.paid_amount)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(getRemainingAmount(invoice))}
                            </TableCell>
                            <TableCell>
                              <Tag color={statusTag.color}>
                                {statusTag.label}
                              </Tag>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                onClick={() => openPaymentModal(invoice)}
                              >
                                Thu phí
                              </Button>
                            </TableCell>
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

      <Modal open={Boolean(selectedInvoice)} onOpenChange={closePaymentModal}>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Thu phí</ModalHeader>
          <ModalBody className="space-y-4">
            {selectedInvoice ? (
              <div className="grid gap-3 rounded-md border border-border p-3 text-sm md:grid-cols-3">
                <div>
                  <div className="text-muted-foreground">Tổng</div>
                  <div className="font-medium">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Đã thanh toán</div>
                  <div className="font-medium">
                    {formatCurrency(selectedInvoice.paid_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Dư nợ</div>
                  <div className="font-medium">
                    {formatCurrency(getRemainingAmount(selectedInvoice))}
                  </div>
                </div>
              </div>
            ) : null}

            <label className="block space-y-2 text-sm font-medium">
              <span>Số tiền</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Phương thức thanh toán</span>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                options={PAYMENT_METHOD_OPTIONS}
                className="w-full"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Ghi chú</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Optional"
              />
            </label>

            {submitError ? (
              <div className="text-sm text-destructive">{submitError}</div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closePaymentModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Submit payment"}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
