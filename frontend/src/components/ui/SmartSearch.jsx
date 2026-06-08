import React, { useState, useEffect, useRef } from "react";
import { Search, X, Calendar } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { Spinner } from "./Spinner";
import { cn } from "../../lib/utils";

/**
 * @param {string} endpoint - URL API để lấy gợi ý
 * @param {Array} categories - Danh sách filter [{value, label}]
 * @param {function} onResultSelect - Callback khi người dùng chọn 1 kết quả
 * @param {function} renderResultItem - (Optional) Custom cách hiển thị từng item
 */
export default function SmartSearch({
  endpoint,
  categories = [],
  onResultSelect,
  placeholder = "Tìm kiếm...",
  className,
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.value || "all",
  );
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length === 0 && !dateRange.start) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2 || (dateRange.start && dateRange.end)) {
        setIsLoading(true);
        setIsOpen(true);
        try {
          const token = localStorage.getItem("token");
          const params = new URLSearchParams({
            q: query,
            category: activeCategory,
            startDate: dateRange.start,
            endDate: dateRange.end,
          });
          const res = await fetch(`${endpoint}?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (json.success && json.data) {
            setResults(json.data);
            } else {
                setResults({ households: [], residents: [], invoices: [] });
            }
            } catch (err) {
            setResults({ households: [], residents: [], invoices: [] });
            } finally {
            setIsLoading(false);
            setIsOpen(true); 
            }
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [query, activeCategory, dateRange, endpoint]);

  return (
    <div className={cn("relative w-full", className)} ref={searchRef}>
      <div className="flex gap-2 items-center bg-card p-2 rounded-2xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {/* 1. Lọc Loại dữ liệu */}
        <Select
          variant="subtle"
          size="sm"
          value={activeCategory}
          onValueChange={setActiveCategory}
          options={categories}
          className="h-9 rounded-xl border-none bg-muted/50"
        />

        {/* 2. Ô nhập Query (Tên/CCCD/Mã HĐ) */}
        <Input
          placeholder="Nhập tên, CCCD hoặc mã hóa đơn..."
          className="flex-[2] border-none bg-transparent focus-visible:ring-0 h-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
                if (query.trim().length > 0 || dateRange.start) setIsOpen(true);
            }}
        />

        {/* 3. Lọc Khoảng thời gian (Inline) */}
        <div className="hidden lg:flex items-center gap-2 border-l border-border pl-4 px-2">
          <Calendar size={16} className="text-muted-foreground" />
          <input
            type="date"
            className="bg-transparent text-xs outline-none text-muted-foreground cursor-pointer"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <span className="text-muted-foreground text-xs">→</span>
          <input
            type="date"
            className="bg-transparent text-xs outline-none text-muted-foreground cursor-pointer"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>

        {/* 4. Nút Action Động */}
        <div className="flex items-center px-2 border-l border-border">
          {isLoading ? (
            <Spinner size="sm" />
          ) : query || dateRange.start ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setQuery("");
                setDateRange({ start: "", end: "" });
              }}
            >
              <X size={18} />
            </Button>
          ) : (
            <Search size={18} className="text-muted-foreground" />
          )}
        </div>
      </div>

      {/* --- DROPDOWN KẾT QUẢ --- */}
      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {/* 1. Kiểm tra xem có dữ liệu bất kỳ không */}
            {( (results.households?.length || 0) + 
                (results.residents?.length || 0) + 
                (results.invoices?.length || 0) ) > 0 ? (
              Object.keys(results).map((key) => {
                const items = results[key];
                if (!items?.length) return null;
                return (
                  <div key={key} className="mb-2">
                    <div className="px-3 py-1 text-[10px] font-black uppercase text-primary/50">
                      {key === "households"
                        ? "Căn hộ"
                        : key === "residents"
                          ? "Cư dân"
                          : "Hóa đơn"}
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-muted rounded-xl cursor-pointer"
                        onClick={() => onResultSelect(key, item)}
                      >
                        <div className="font-bold text-sm">
                          {item.invoice_number ||
                            item.full_name ||
                            `Phòng ${item.room_number}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.citizen_id && `CCCD: ${item.citizen_id}`}
                          {item.total_amount &&
                            ` • ${new Intl.NumberFormat("vi-VN").format(item.total_amount)}đ • ${item.status}`}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            ) : (
              /* 2. Hiển thị khi không có kết quả phù hợp */
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <div className="bg-muted p-3 rounded-full">
                    <Search size={24} className="text-muted-foreground opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                    Không tìm thấy kết quả phù hợp cho "{query}"
                </p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
