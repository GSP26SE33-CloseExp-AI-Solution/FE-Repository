import { useEffect, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  MoreVertical,
} from "lucide-react";
import axiosClient from "@/utils/axiosClient";

// ================================
// TYPES
// ================================
export interface ProductLot {
  lotId: string;
  productId: string;
  productName: string;
  brand: string;
  category: string;
  barcode: string;
  expiryDate: string;
  quantity: number;

  unitName: string;
  originalUnitPrice: number;
  finalUnitPrice: number;

  expiryStatus: number;
  expiryStatusText: string;
  daysRemaining: number;

  mainImageUrl?: string;
}

interface LotsPagedResponse {
  items: ProductLot[];
  totalResult: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ================================
// API
// ================================
async function fetchMySupermarketLots(params: {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  expiryStatus?: number;
  sortBy?: "expiry" | "price";
}): Promise<LotsPagedResponse> {
  const res = await axiosClient.get<ApiResponse<LotsPagedResponse>>(
    "/Products/my-supermarket/lots",
    { params },
  );

  const data = res.data?.data;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    totalResult: data?.totalResult ?? 0,
    page: data?.page ?? params.pageNumber,
    pageSize: data?.pageSize ?? params.pageSize,
  };
}

// ================================
// PAGE
// ================================
const ProductsLotsPage = () => {
  const [lots, setLots] = useState<ProductLot[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<"expiry" | "price">("expiry");

  const [selected, setSelected] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLots();
    // eslint-disable-next-line
  }, [page, keyword, expiryFilter, sortBy]);

  const loadLots = async () => {
    setLoading(true);
    try {
      const data = await fetchMySupermarketLots({
        pageNumber: page,
        pageSize,
        searchTerm: keyword || undefined,
        expiryStatus: expiryFilter,
        sortBy,
      });

      setLots(data.items);
      setTotalPages(
        data.totalResult > 0 ? Math.ceil(data.totalResult / pageSize) : 1,
      );
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    if (selected.length === lots.length) {
      setSelected([]);
    } else {
      setSelected(lots.map((l) => l.lotId));
    }
  };

  const bulkPublish = () => {
    console.log("Publish lots:", selected);
  };

  const bulkQuickApprove = () => {
    console.log("Quick approve lots:", selected);
  };

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="max-w-[1500px] mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý lô sản phẩm
          </h1>

          <div className="flex gap-2">
            <div className="relative w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={keyword}
                onChange={(e) => {
                  setPage(1);
                  setKeyword(e.target.value);
                }}
                placeholder="Tìm tên / barcode"
                className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded-lg px-3 bg-white"
            >
              <option value="expiry">Sắp hết hạn</option>
              <option value="price">Giá bán</option>
            </select>
          </div>
        </div>

        {/* BULK ACTION */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 border rounded-lg shadow-sm">
            <span className="text-sm text-gray-600">
              Đã chọn {selected.length} lô
            </span>
            <button
              onClick={bulkQuickApprove}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Quick approve
            </button>
            <button
              onClick={bulkPublish}
              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm"
            >
              Publish
            </button>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.length === lots.length && lots.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th className="p-3 text-left">Sản phẩm</th>
                <th className="p-3">SL</th>
                <th className="p-3">Hạn</th>
                <th className="p-3">Giá gốc</th>
                <th className="p-3">% giảm</th>
                <th className="p-3">Giá bán</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    <Loader2 className="animate-spin inline mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : lots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                lots.map((lot) => {
                  const discount =
                    lot.originalUnitPrice > 0
                      ? Math.round(
                          100 -
                            (lot.finalUnitPrice / lot.originalUnitPrice) * 100,
                        )
                      : 0;

                  const danger = lot.daysRemaining <= 3;

                  return (
                    <tr key={lot.lotId} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(lot.lotId)}
                          onChange={() => toggleSelect(lot.lotId)}
                        />
                      </td>

                      <td className="p-3">
                        <div className="flex gap-3 items-center">
                          <img
                            src={lot.mainImageUrl || "/placeholder.png"}
                            className="w-12 h-12 rounded border object-cover"
                            alt=""
                          />
                          <div>
                            <p className="font-medium text-gray-800">
                              {lot.productName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {lot.unitName} · {lot.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center">{lot.quantity}</td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            danger
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {lot.daysRemaining} ngày
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        {lot.originalUnitPrice.toLocaleString()}₫
                      </td>

                      <td className="p-3 text-center">
                        {discount > 0 ? (
                          <span className="text-red-500 font-semibold">
                            -{discount}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="p-3 text-right font-semibold text-green-600">
                        {lot.finalUnitPrice.toLocaleString()}₫
                      </td>

                      <td className="p-3 text-center">
                        <MoreVertical
                          size={16}
                          className="mx-auto text-gray-400"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-end items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 border rounded bg-white disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm">
            Trang {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 border rounded bg-white disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsLotsPage;
