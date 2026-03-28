import BaseStaffFooter from "@/components/layouts/shared/BaseStaffFooter"

const AdminFooter = () => {
    return (
        <BaseStaffFooter
            description="Trung tâm quản trị hệ thống"
            actions={[
                { label: "Điều khoản" },
                { label: "Chính sách" },
                { label: "Trung tâm trợ giúp" },
            ]}
        />
    )
}

export default AdminFooter
