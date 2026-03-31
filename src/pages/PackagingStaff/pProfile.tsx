import BaseProfilePage from "@/components/profile/BaseProfilePage"
import { PROFILE_ROLE_CONFIG } from "@/constants/profileRoleConfig"

const PackageProfile = () => {
    return <BaseProfilePage config={PROFILE_ROLE_CONFIG.packaging} />
}

export default PackageProfile
