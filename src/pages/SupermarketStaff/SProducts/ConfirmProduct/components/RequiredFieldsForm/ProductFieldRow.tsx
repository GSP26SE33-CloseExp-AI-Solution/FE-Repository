import React from "react";
import { ProductFormModel } from "@/types/productForm.model";
import { Field } from "./productFormConfig";

interface Props {
    field: Field;
    value: ProductFormModel[keyof ProductFormModel];
    missing: boolean;
    disabled: boolean;
    onChange: (value: any) => void;
    index: number;
}

const NO_DATA = "Chưa có dữ liệu";

/* ================= FORMAT HELPERS ================= */

/* number -> 10.000 đ */
const formatCurrencyVN = (num: number) =>
    num.toLocaleString("vi-VN") + " đ";

/* "10.000 đ" -> 10000 */
const parseCurrencyVN = (value: string) =>
    Number(value.replace(/[^\d]/g, ""));

/* yyyy-mm-dd -> dd/MM/yyyy */
const formatDateVN = (value?: string) => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    if (!y || !m || !d) return value;
    return `${d}/${m}/${y}`;
};

const isTrulyEmpty = (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    return false;
};

const ProductFieldRow: React.FC<Props> = ({
    field,
    value,
    missing,
    disabled,
    onChange,
    index,
}) => {
    const isGray = index % 2 === 1;

    const isBarcodeField = field.key === "barcode";
    const hasBarcodeValue = !isTrulyEmpty(value);

    const isEditable =
        field.editable &&
        !disabled &&
        !(isBarcodeField && hasBarcodeValue);

    /* ================= READ ONLY ================= */
    if (!isEditable) {
        let displayValue: string = NO_DATA;

        if (!isTrulyEmpty(value)) {
            if (field.format === "currency" && typeof value === "number") {
                displayValue = formatCurrencyVN(value);
            } else if (field.format === "date" && typeof value === "string") {
                displayValue = formatDateVN(value);
            } else if (typeof value === "object") {
                displayValue = JSON.stringify(value, null, 2);
            } else {
                displayValue = String(value);
            }
        }

        return (
            <div
                className={`grid grid-cols-10 gap-4 px-4 py-3 border-t ${
                    isGray ? "bg-gray-50" : "bg-white"
                }`}
            >
                <div className="col-span-3 font-semibold text-gray-700">
                    {field.label}
                </div>

                <div className="col-span-7 text-gray-600 italic whitespace-pre-wrap">
                    {displayValue}
                </div>
            </div>
        );
    }

    /* ================= EDITABLE ================= */
    return (
        <div
            className={`grid grid-cols-10 gap-4 px-4 py-3 border-t ${
                isGray ? "bg-gray-50" : "bg-white"
            }`}
        >
            <div className="col-span-3 font-semibold text-gray-700">
                {field.label}
                {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </div>

            <div className="col-span-7">
                {/* ===== SELECT ===== */}
                {field.type === "select" ? (
                    <select
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded ${
                            missing ? "border-red-500" : ""
                        }`}
                    >
                        <option value="">-- Chọn --</option>
                        {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ) : field.type === "boolean" ? (
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-4 h-4 accent-green-500"
                    />
                ) : field.type === "textarea" ? (
                    <textarea
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded min-h-[100px] ${
                            missing ? "border-red-500" : ""
                        }`}
                    />
                ) : field.format === "currency" ? (
                    /* ===== GIÁ TIỀN ÉP FORMAT ===== */
                    <input
                        type="text"
                        value={
                            typeof value === "number"
                                ? formatCurrencyVN(value)
                                : ""
                        }
                        onChange={(e) => {
                            const raw = parseCurrencyVN(e.target.value);
                            onChange(isNaN(raw) ? 0 : raw);
                        }}
                        inputMode="numeric"
                        className={`w-full px-3 py-2 border rounded ${
                            missing ? "border-red-500" : ""
                        }`}
                    />
                ) : field.format === "date" ? (
                    /* ===== NGÀY: HIỂN THỊ dd/MM/yyyy + CÓ LỊCH ===== */
                    <div className="relative">
                        {/* input hiển thị */}
                        <input
                            type="text"
                            value={
                                typeof value === "string"
                                    ? formatDateVN(value)
                                    : ""
                            }
                            placeholder="dd/MM/yyyy"
                            readOnly
                            className={`w-full px-3 py-2 border rounded bg-white cursor-pointer ${
                                missing ? "border-red-500" : ""
                            }`}
                        />

                        {/* input date thật để mở calendar */}
                        <input
                            type="date"
                            value={typeof value === "string" ? value : ""}
                            onChange={(e) => onChange(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                ) : (
                    <input
                        type={field.type ?? "text"}
                        value={
                            typeof value === "string" ||
                            typeof value === "number"
                                ? value
                                : ""
                        }
                        onChange={(e) =>
                            onChange(
                                field.type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value
                            )
                        }
                        className={`w-full px-3 py-2 border rounded ${
                            missing ? "border-red-500" : ""
                        }`}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductFieldRow;
