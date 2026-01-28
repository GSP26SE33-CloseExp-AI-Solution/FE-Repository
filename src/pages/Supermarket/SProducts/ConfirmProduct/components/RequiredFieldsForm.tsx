import React from "react";
import { ProductDraft } from "../../data/products";
import { sections, Field } from "./productFormConfig";

interface RequiredFieldsFormProps {
    product: ProductDraft;
    onChange: React.Dispatch<React.SetStateAction<ProductDraft>>;
    onResetAll: () => void;
    onResetSection: (fields: (keyof ProductDraft)[]) => void;
}

const RequiredFieldsForm: React.FC<RequiredFieldsFormProps> = ({
    product,
    onChange,
    onResetAll,
    onResetSection,
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
                        const isGray = index % 2 === 1;
                        const missing = isMissing(field);

                        return (
                            <div
                                key={field.key}
                                className={`grid grid-cols-10 gap-4 px-4 py-3 border-t ${isGray ? "bg-gray-50" : "bg-white"
                                    }`}
                            >
                                {/* Label */}
                                <div className="col-span-2 font-semibold text-gray-700">
                                    {field.label}
                                    {field.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="col-span-8">
                                    {field.key === "description" ||
                                        field.key === "ingredients" ? (
                                        <textarea
                                            value={product[field.key] ?? ""}
                                            onChange={(e) =>
                                                update(field.key, e.target.value)
                                            }
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded resize-none
                            focus:outline-none focus:ring-1
                            ${missing
                                                    ? "border-red-500 focus:ring-red-400"
                                                    : "border-gray-300 focus:ring-gray-400"
                                                }
                        `}
                                        />
                                    ) : (
                                        <input
                                            value={product[field.key] ?? ""}
                                            onChange={(e) =>
                                                update(
                                                    field.key,
                                                    field.key === "qty" ||
                                                        field.key.includes("Price")
                                                        ? Number(e.target.value)
                                                        : e.target.value
                                                )
                                            }
                                            className={`w-full px-3 py-2 border rounded
                            focus:outline-none focus:ring-1
                            ${missing
                                                    ? "border-red-500 focus:ring-red-400"
                                                    : "border-gray-300 focus:ring-gray-400"
                                                }
                        `}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default RequiredFieldsForm;
