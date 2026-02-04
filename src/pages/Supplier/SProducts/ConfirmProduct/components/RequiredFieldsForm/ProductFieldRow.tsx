import React from "react";
import { Product } from "@/types/aiProduct.type";
import { Field } from "./productFormConfig";

interface Props {
    field: Field;
    value: Product[keyof Product];
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
        ${missing
            ? "border-red-500 focus:ring-red-400"
            : "border-gray-300 focus:ring-gray-400"
        }
        ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
    `;

    const inputType = field.type ?? "text";

    const renderInput = () => {
        /* boolean */
        if (typeof value === "boolean") {
            return (
                <input
                    type="checkbox"
                    checked={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.checked)}
                />
            );
        }

        /* number / text / date */
        return (
            <input
                type={inputType}
                disabled={disabled}
                value={value ?? ""}
                onChange={(e) =>
                    onChange(
                        inputType === "number"
                            ? Number(e.target.value)
                            : e.target.value
                    )
                }
                className={baseClass}
            />
        );
    };

    return (
        <div
            className={`grid grid-cols-10 gap-4 px-4 py-3 border-t ${isGray ? "bg-gray-50" : "bg-white"
                }`}
        >
            {/* Label */}
            <div className="col-span-3 font-semibold text-gray-700">
                {field.label}
                {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </div>

            {/* Input */}
            <div className="col-span-7">{renderInput()}</div>
        </div>
    );
};

export default ProductFieldRow;
