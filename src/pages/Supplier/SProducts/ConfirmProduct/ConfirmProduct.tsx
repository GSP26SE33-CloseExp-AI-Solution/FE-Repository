import React, { useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import AddProductHeader from "../AddProduct/components/AddProductHeader";
import ProductImagesPreview from "./components/ProductImagesPreview";
import RequiredFieldsForm from "./components/RequiredFieldsForm/RequiredFieldsForm";
import ActionButtons from "./components/ActionButtons";

import { ProductState } from "@/types/aiProduct.type";
import { productToForm, formToProduct } from "@/mappers/productForm.mapper";
import { ProductFormModel } from "@/types/productForm.model";
import { validateProduct } from "./utils/validateProduct";
import { productService } from "@/services/product.service";
import { useAuth } from "@/hooks/useAuth";

const ConfirmProduct: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // 🔥 NHẬN DRAFT TỪ AddProduct huhuhuhu
    const draftProduct = (location.state as any)?.draftProduct;

    console.log("🧪 DRAFT IN CONFIRM PAGE", {
        name: draftProduct?.name,
        lookupName: draftProduct?.barcodeLookupInfo?.productName,
        brand: draftProduct?.brand,
        lookupBrand: draftProduct?.barcodeLookupInfo?.brand,
        full: draftProduct,
    });

    const initialForm = useMemo<ProductFormModel | null>(() => {
        return draftProduct ? productToForm(draftProduct) : null;
    }, [draftProduct]);

    const [product, setProduct] = useState<ProductFormModel | null>(initialForm);

    const initialProductRef = useRef<ProductFormModel | null>(initialForm);

    /* ================= images preview ================= */
    const imagesToPreview = useMemo(() => {
        if (!product) return [];

        if (product.productImages?.length) {
            return product.productImages.map((img) => img.imageUrl);
        }

        if ((product as any).mainImageUrl) {
            return [(product as any).mainImageUrl];
        }

        return [];
    }, [product]);

    /* ================= validation ================= */
    const { isValid, missingFields } = useMemo(() => {
        if (!product) return { isValid: false, missingFields: [] };

        const payload = formToProduct(product);
        return validateProduct(payload);
    }, [product]);

    /* ================= reset ================= */
    const handleResetAll = () => {
        if (initialProductRef.current) {
            setProduct({ ...initialProductRef.current });
        }
    };

    const resetSection = (fields: (keyof ProductFormModel)[]) => {
        if (!initialProductRef.current) return;

        setProduct((prev) => {
            if (!prev) return prev;

            const updated = { ...prev };
            fields.forEach((key) => {
                (updated as any)[key] =
                    (initialProductRef.current as any)[key];
            });

            return updated;
        });
    };

    /* ================= actions ================= */
    const handleBack = () => navigate(-1);

    const handleSubmit = async () => {
        if (!product) return;

        if (!isValid) {
            toast.error(`Còn thiếu ${missingFields.length} trường bắt buộc`);
            return;
        }

        if (!user?.userId) {
            toast.error("Không xác định được người xác nhận");
            return;
        }

        try {
            const payload = {
                name: product.name!,
                brand: product.brand!,
                category: product.category!,
                barcode: product.barcode!,
                originalPrice: product.originalPrice!,
                expiryDate: new Date(product.expiryDate!).toISOString(),
                manufactureDate: product.manufactureDate
                    ? new Date(product.manufactureDate).toISOString()
                    : null,
                isFreshFood: !!product.isFreshFood,
                verifiedBy: user.userId,
            };

            console.log("🧪 VERIFY PAYLOAD", payload);

            const res = await productService.verify(
                product.productId,
                payload
            );

            toast.success("Xác nhận sản phẩm thành công");

            navigate(`/supplier/products/${res.data.data.productId}/pricing`);
        } catch (err) {
            console.error("❌ VERIFY PRODUCT FAILED", err);
            toast.error("Xác nhận sản phẩm thất bại");
        }
    };

    /* ================= empty ================= */
    if (!product) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Không có dữ liệu AI để xác nhận sản phẩm
            </div>
        );
    }

    const locked = product.status === ProductState.Verified;

    return (
        <div className="w-full min-h-screen bg-white">
            <AddProductHeader />

            <div className="px-6 py-4">
                <div className="grid grid-cols-10 gap-6">
                    <div className="col-span-3">
                        <ProductImagesPreview images={imagesToPreview} />
                    </div>

                    <div className="col-span-7 space-y-6">
                        <RequiredFieldsForm
                            product={product}
                            onChange={(updater) => {
                                setProduct((prev) => {
                                    if (!prev) return prev;
                                    return typeof updater === "function"
                                        ? updater(prev)
                                        : updater;
                                });
                            }}
                            onResetAll={handleResetAll}
                            onResetSection={resetSection}
                            locked={locked}
                        />

                        <ActionButtons
                            step="review"
                            onBack={handleBack}
                            onSaveDraft={() =>
                                toast.success("Đã lưu nháp sản phẩm")
                            }
                            onSubmit={handleSubmit}
                            disabled={!isValid}
                            missingCount={missingFields.length}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmProduct;
