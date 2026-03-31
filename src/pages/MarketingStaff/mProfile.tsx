import BaseProfilePage from "@/components/profile/BaseProfilePage"
import { PROFILE_ROLE_CONFIG } from "@/constants/profileRoleConfig"

const MarketingProfile = () => {
    return <BaseProfilePage config={PROFILE_ROLE_CONFIG.marketing} />
}

export default MarketingProfile
