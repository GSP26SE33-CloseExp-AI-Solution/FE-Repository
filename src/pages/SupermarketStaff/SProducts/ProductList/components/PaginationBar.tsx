import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
    currentPage: number;
    totalPages: number;
    goPrev: () => void;
    goNext: () => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
    currentPage,
    totalPages,
    goPrev,
    goNext,
}) => {
    return (
        <div className="w-full h-[60px] bg-[#FAFAFA] border border-gray-200 border-t-0 rounded-b-lg flex items-center justify-center">
            <div className="flex items-center gap-8">
                {/* Prev */}
                <button
                    onClick={goPrev}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                    <ChevronLeft size={20} strokeWidth={2} />
                </button>

                {/* Page number */}
                <span className="text-[20px] font-semibold text-gray-700">
                    Trang {currentPage}
                </span>

                {/* Next */}
                <button
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                >
                    <ChevronRight size={20} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
};

export default PaginationBar;
