import BaseStaffFooter from "@/components/layouts/shared/BaseStaffFooter"

const PackageFooter = () => {
    return (
        <BaseStaffFooter
            description="Trung tâm đóng gói và điều phối"
            actions={[
                { label: "Đơn chờ" },
                { label: "Thu gom" },
                { label: "Hoàn tất" },
            ]}
        />
    )
}

export default PackageFooter
