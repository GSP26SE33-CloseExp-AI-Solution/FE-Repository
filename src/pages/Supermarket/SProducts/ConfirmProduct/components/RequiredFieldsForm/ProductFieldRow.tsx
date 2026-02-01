import React from "react";
import { ProductDraft } from "@/types/product.type";
import { Field } from "./productFormConfig";

interface Props {
    field: Field;
    value: any;
    missing: boolean;
    disabled: boolean;
    onChange: (value: any) => void;
    index: number;
}

const ProductFieldRow: React.FC<Props> = ({
    field,
    value,
    missing,
    disabled,
    onChange,
    index,
}) => {
    const isGray = index % 2 === 1;

    const baseClass = `
        w-full px-3 py-2 border rounded
        focus:outline-none focus:ring-1
        ${missing ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-gray-400"}
        ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
    `;

    return (
        <div className={`grid grid-cols-10 gap-4 px-4 py-3 border-t ${isGray ? "bg-gray-50" : "bg-white"}`}>
            <div className="col-span-2 font-semibold text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>

            <div className="col-span-8">
                {field.key === "description" || field.key === "ingredients" ? (
                    <textarea
                        disabled={disabled}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        rows={3}
                        className={baseClass}
                    />
                ) : (
                    <input
                        disabled={disabled}
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseClass}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductFieldRow;
