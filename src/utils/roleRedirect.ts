export const getRedirectByRole = (roleId?: number): string => {
    switch (roleId) {
        case 1:
            return "/admin"
        case 2:
            return "/staff"
        case 3:
            return "/marketing"
        case 4:
            return "/supplier/dashboard"
        case 5:
            return "/delivery"
        case 6:
            return "/vendor"
        default:
            return "/"
    }
}

export const getRedirectByRoleSafe = (roleId?: number) => {
    if (!roleId) return "/login"
    return getRedirectByRole(roleId)
}
