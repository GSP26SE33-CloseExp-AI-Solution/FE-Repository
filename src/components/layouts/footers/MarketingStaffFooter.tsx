import BaseStaffFooter from "@/components/layouts/shared/BaseStaffFooter"

const MarketingFooter = () => {
    return (
        <BaseStaffFooter
            description="Trung tâm marketing và tăng trưởng"
            actions={[
                { label: "Khuyến mãi", href: "/marketing/promotions" },
                { label: "Hiệu quả", href: "/marketing/reports" },
                {
                    label: "Sản phẩm theo DM",
                    href: "/marketing/category-products",
                },
            ]}
        />
    )
}

export default MarketingFooter
