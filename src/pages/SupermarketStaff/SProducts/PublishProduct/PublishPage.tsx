import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { productService } from "@/services/product.service";
import { useAuth } from "@/hooks/useAuth";
import { Product } from "@/types/aiProduct.type";

/* ================= COMPONENT ================= */

const PublishPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);

    /* ================= FETCH ================= */
    useEffect(() => {
        if (!productId) return;

        productService
            .getById(productId)
            .then((res) => setProduct(res.data.data))
            .catch(() => toast.error("Không tải được sản phẩm"))
            .finally(() => setLoading(false));
    }, [productId]);

    /* ================= PUBLISH ================= */
    const handlePublish = async () => {
        if (!product || !user?.userId) return;

        if (product.status !== 2) {
            toast.error("Sản phẩm chưa được chốt giá");
            return;
        }

        try {
            setPublishing(true);
            await productService.publish(product.productId, user.userId);
            toast.success("Đăng bán sản phẩm thành công");
            navigate("/supermarketStaff/products");
        } catch {
            toast.error("Đăng bán thất bại");
        } finally {
            setPublishing(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500">
                Đang tải dữ liệu…
            </div>
        );
    }

    if (!product) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500">
                Không tìm thấy sản phẩm
            </div>
        );
    }

    /* ================= ALL PRODUCT_FIELDS ================= */
    const PRODUCT_FIELDS: {
        key: keyof Product;
        label: string;
    }[] = [
            { key: "name", label: "Tên sản phẩm" },
            { key: "brand", label: "Thương hiệu" },
            { key: "category", label: "Danh mục" },
            { key: "barcode", label: "Mã vạch" },
            { key: "expiryDate", label: "Hạn sử dụng" },
            { key: "manufactureDate", label: "Ngày sản xuất" },
            { key: "daysToExpiry", label: "Số ngày còn lại" },
            { key: "originalPrice", label: "Giá gốc" },
            { key: "suggestedPrice", label: "Giá AI đề xuất" },
            { key: "finalPrice", label: "Giá bán cuối" },
            { key: "pricingConfidence", label: "Độ tin cậy AI" },
            { key: "pricingReasons", label: "Lý do AI" },
            { key: "ocrConfidence", label: "Độ tin cậy OCR" },
            { key: "ingredients", label: "Thành phần" },
            { key: "nutritionFacts", label: "Dinh dưỡng" },
            { key: "weightTypeName", label: "Đơn vị trọng lượng" },
            { key: "isFreshFood", label: "Thực phẩm tươi" },
            { key: "status", label: "Trạng thái" },
            { key: "createdAt", label: "Ngày tạo" },
            { key: "verifiedAt", label: "Ngày xác nhận" },
            { key: "pricedAt", label: "Ngày chốt giá" },
        ];

    const displayValue = (value: any) => {
        if (value === null || value === undefined || value === "") {
            return <span className="text-gray-400 italic">—</span>;
        }

        if (typeof value === "boolean") {
            return value ? "Có" : "Không";
        }

        if (typeof value === "number") {
            return value;
        }

        if (typeof value === "string") {
            // ISO date
            if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
                return new Date(value).toLocaleDateString();
            }
            return value;
        }

        if (Array.isArray(value)) {
            return value.length === 0 ? (
                <span className="text-gray-400 italic">—</span>
            ) : (
                <ul className="list-disc ml-5">
                    {value.map((v, i) => (
                        <li key={i}>{String(v)}</li>
                    ))}
                </ul>
            );
        }

        if (typeof value === "object") {
            // object rỗng
            if (Object.keys(value).length === 0) {
                return <span className="text-gray-400 italic">—</span>;
            }

            // object có data → stringify cho người dùng xem
            return (
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        }

        return String(value);
    };

    /* ================= RENDER ================= */
    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 bg-white">
            {/* ===== HEADER ===== */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-800">
                    Xác nhận đăng bán sản phẩm
                </h1>
                <p className="text-gray-500">
                    Kiểm tra thông tin trước khi hiển thị cho khách hàng
                </p>
            </div>

            {/* ===== BASIC INFO ===== */}
            <section className="border rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4">🏷 Thông tin sản phẩm</h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <Info label="Tên sản phẩm" value={product.name} />
                    <Info label="Thương hiệu" value={product.brand} />
                    <Info label="Danh mục" value={product.category} />
                    <Info label="Mã vạch" value={product.barcode || "—"} />
                    <Info
                        label="Thực phẩm tươi"
                        value={product.isFreshFood ? "Có" : "Không"}
                    />
                </div>
            </section>

            {/* ===== AI / OCR ===== */}
            <section className="border rounded-xl p-6 bg-gray-50">
                <h2 className="font-semibold text-lg mb-4">🧠 Phân tích từ AI</h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <Info
                        label="Độ tin cậy OCR"
                        value={`${Math.round(
                            (product.ocrConfidence || 0) * 100
                        )}%`}
                    />
                    <Info
                        label="Giá AI đề xuất"
                        value={
                            product.suggestedPrice
                                ? `${product.suggestedPrice}`
                                : "—"
                        }
                    />
                    <Info
                        label="Độ tin cậy định giá"
                        value={`${Math.round(
                            (product.pricingConfidence || 0) * 100
                        )}%`}
                    />
                </div>

                {product.pricingReasons && (
                    <div className="mt-4 text-sm text-gray-600">
                        <div className="font-medium mb-1">
                            Lý do AI đề xuất:
                        </div>

                        {Array.isArray(product.pricingReasons) ? (
                            <ul className="list-disc ml-5">
                                {product.pricingReasons.map((r: string, i: number) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="ml-1">{product.pricingReasons}</p>
                        )}
                    </div>
                )}
            </section>

            {/* ===== EXPIRY ===== */}
            <section className="border rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4">
                    📦 Hạn sử dụng & tình trạng
                </h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <Info
                        label="Hạn sử dụng"
                        value={
                            product.expiryDate
                                ? new Date(
                                    product.expiryDate
                                ).toLocaleDateString()
                                : "—"
                        }
                    />
                    <Info
                        label="Số ngày còn lại"
                        value={product.daysToExpiry ?? "—"}
                    />
                    <Info
                        label="Ngày sản xuất"
                        value={
                            product.manufactureDate
                                ? new Date(
                                    product.manufactureDate
                                ).toLocaleDateString()
                                : "—"
                        }
                    />
                </div>
            </section>

            {/* ===== PRICE ===== */}
            <section className="border rounded-xl p-6 bg-green-50">
                <h2 className="font-semibold text-lg mb-4">💰 Giá bán</h2>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <Info
                        label="Giá gốc"
                        value={product.originalPrice || "—"}
                    />
                    <Info
                        label="Giá bán cuối"
                        value={
                            <span className="text-green-700 font-semibold">
                                {product.finalPrice}
                            </span>
                        }
                    />
                </div>
            </section>

            {/* ===== SYSTEM INFO ===== */}
            <section className="border rounded-xl p-6 text-sm text-gray-500">
                <h2 className="font-semibold text-gray-700 mb-3">
                    🧾 Thông tin hệ thống
                </h2>

                <div className="grid grid-cols-2 gap-3">
                    <Info label="Product ID" value={product.productId} />
                    <Info label="Supermarket ID" value={product.supermarketId} />
                    <Info label="Tạo lúc" value={product.createdAt} />
                    <Info label="Trạng thái" value={product.status} />
                </div>
            </section>

            {/* ================= RENDER ALL SCHEMA ================= */}
            <div className="border rounded-xl p-6 bg-white shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                    Thông tin chi tiết sản phẩm
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {PRODUCT_FIELDS.map(({ key, label }) => (
                        <div key={key} className="flex gap-2">
                            <div className="w-44 text-gray-600 font-medium">
                                {label}
                            </div>
                            <div className="flex-1 text-gray-800">
                                {displayValue(product[key])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== ACTION ===== */}
            <div className="flex justify-between pt-4">
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 border rounded"
                >
                    Quay lại
                </button>

                <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-70"
                >
                    {publishing ? "Đang đăng bán…" : "Đăng bán"}
                </button>
            </div>
        </div>
    );
};

/* ================= SUB ================= */

const Info = ({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) => (
    <div>
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-gray-800 break-all">
            {value ?? "—"}
        </div>
    </div>
);

export default PublishPage;
