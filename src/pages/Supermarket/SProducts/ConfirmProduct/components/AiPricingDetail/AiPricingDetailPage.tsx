import ProductInfoCard from "./components/ProductInfoCard";
import AiSuggestCard from "./components/AiSuggestCard";
import MarketCompareTable from "./components/MarketCompareTable";

const AiPricingDetailPage = () => {
    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                    A.I gợi ý giá
                </h1>

                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-100 text-sm"
                >
                    Quay lại
                </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-3 gap-6">

                {/* Left */}
                <div className="col-span-2 space-y-6">
                    <ProductInfoCard />
                    <MarketCompareTable />
                </div>

                {/* Right */}
                <div className="col-span-1">
                    <AiSuggestCard />
                </div>

            </div>
        </div>
    );
};

export default AiPricingDetailPage;
