import React from "react";
import { ProductDraft } from "@/types/product.type";
import { sections, Field } from "./productFormConfig";
import ProductFieldRow from "./ProductFieldRow";

interface RequiredFieldsFormProps {
    product: ProductDraft;
    onChange: React.Dispatch<React.SetStateAction<ProductDraft>>;
    onResetAll: () => void;
    onResetSection: (fields: (keyof ProductDraft)[]) => void;
    locked?: boolean;
}

const RequiredFieldsForm: React.FC<RequiredFieldsFormProps> = ({
    product,
    onChange,
    onResetAll,
    onResetSection,
    locked = false,
}) => {
    const update = (key: keyof ProductDraft, value: any) => {
        onChange((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const isMissing = (field: Field) => {
        if (!field.required) return false;
        const value = product[field.key];
        return value === "" || value === null || value === undefined;
    };

    const EDITABLE_FIELDS_AFTER_AI: (keyof ProductDraft)[] = ["qty", "salePrice"];

    const canEditField = (key: keyof ProductDraft, locked: boolean) => {
        if (!locked) return true;
        return EDITABLE_FIELDS_AFTER_AI.includes(key);
    };

    return (
        <div className="space-y-4">
            {/* ===== Header bên trên form ===== */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    Thông tin sản phẩm
                </h2>

                <button
                    type="button"
                    onClick={onResetAll}
                    className="text-sm text-red-600 hover:underline"
                >
                    Reset toàn bộ dữ liệu từ AI
                </button>
            </div>

            {/* ===== Sections ===== */}
            {sections.map((section) => (
                <div
                    key={section.title}
                    className="border rounded-lg overflow-hidden"
                >
                    {/* Section title */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
                        <span className="font-semibold">{section.title}</span>

                        <button
                            type="button"
                            onClick={() =>
                                onResetSection(section.fields.map((f) => f.key))
                            }
                            className="text-sm text-red-300 hover:underline"
                        >
                            Reset nhóm
                        </button>
                    </div>

                    {/* Fields */}
                    {section.fields.map((field, index) => {
                        const missing = isMissing(field);
                        const disabled = !canEditField(field.key, locked);

                        return (
                            <ProductFieldRow
                                key={field.key}
                                field={field}
                                value={product[field.key]}
                                missing={missing}
                                disabled={disabled}
                                index={index}
                                onChange={(value) =>
                                    update(
                                        field.key,
                                        field.key === "qty" || field.key.includes("Price")
                                            ? Number(value)
                                            : value
                                    )
                                }
                            />
                        );
                    })}

                </div>
            ))}
        </div>


    );
};

export default RequiredFieldsForm;
