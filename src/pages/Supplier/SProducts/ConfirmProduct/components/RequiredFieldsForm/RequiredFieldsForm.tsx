import React from "react";
import { sections } from "./productFormConfig";
import ProductFieldRow from "./ProductFieldRow";
import { ProductFormModel } from "@/types/productForm.model";

interface RequiredFieldsFormProps {
    product: ProductFormModel;
    onChange: (
        updater:
            | ProductFormModel
            | ((prev: ProductFormModel) => ProductFormModel)
    ) => void;
    onResetAll: () => void;
    onResetSection: (fields: (keyof ProductFormModel)[]) => void;
    locked?: boolean;
}

const EDITABLE_AFTER_VERIFY: (keyof ProductFormModel)[] = [];

const RequiredFieldsForm: React.FC<RequiredFieldsFormProps> = ({
    product,
    onChange,
    onResetAll,
    onResetSection,
    locked = false,
}) => {
    const update = <K extends keyof ProductFormModel>(
        key: K,
        value: ProductFormModel[K]
    ) => {
        onChange((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const isMissing = (key: keyof ProductFormModel, required?: boolean) => {
        if (!required) return false;
        const value = product[key];
        return value === null || value === undefined || value === "";
    };

    const canEdit = (key: keyof ProductFormModel) => {
        if (!locked) return true;
        return EDITABLE_AFTER_VERIFY.includes(key);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    Thông tin sản phẩm
                </h2>

                <button
                    type="button"
                    onClick={onResetAll}
                    className="text-sm text-red-600 hover:underline"
                >
                    Reset dữ liệu
                </button>
            </div>

            {sections.map((section) => {
                if (!section.fields.length) return null;

                const confidence =
                    section.confidenceKey &&
                    typeof product[section.confidenceKey] === "number"
                        ? (product[section.confidenceKey] as number)
                        : null;

                return (
                    <div
                        key={section.title}
                        className="border rounded-lg overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold">
                                    {section.title}
                                </span>

                                {confidence !== null && (
                                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                        Độ tin cậy AI: {Math.round(confidence * 100)}%
                                    </span>
                                )}
                            </div>

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

                        {section.fields.map((field, index) => (
                            <ProductFieldRow
                                key={String(field.key)}
                                field={field}
                                value={product[field.key]}
                                missing={isMissing(field.key, field.required)}
                                disabled={!canEdit(field.key)}
                                index={index}
                                onChange={(value) => update(field.key, value)}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export default RequiredFieldsForm;
