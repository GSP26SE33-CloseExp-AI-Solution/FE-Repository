import BaseStaffFooter from "@/components/layouts/shared/BaseStaffFooter"

const MarketingFooter = () => {
    return (
        <BaseStaffFooter
            description="Trung tâm marketing và tăng trưởng"
            actions={[
                { label: "Chiến dịch" },
                { label: "Khuyến mãi" },
                { label: "Hiệu quả" },
            ]}
        />
    )
}

export default MarketingFooter
