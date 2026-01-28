import { useProductImages } from "./hooks/useProductImages";
import AddProductHeader from "./components/AddProductHeader";
import ImageUploadCard from "./components/ImageUploadCard";
import ConfirmButton from "./components/ConfirmButton";

const SAddProduct: React.FC = () => {
    const productImages = useProductImages({ maxImages: 5 });

    return (
        <div className="w-full bg-white min-h-screen">
            <AddProductHeader />

            <ImageUploadCard {...productImages} />

            {productImages.images.length > 0 && !productImages.usingCamera && (
                <ConfirmButton />
            )}
        </div>
    );
};

export default SAddProduct;
