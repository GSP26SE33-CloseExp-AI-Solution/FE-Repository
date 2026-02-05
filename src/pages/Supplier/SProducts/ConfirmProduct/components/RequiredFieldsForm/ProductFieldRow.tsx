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
            if (typeof value === "object") {
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
                {field.type === "boolean" ? (
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
