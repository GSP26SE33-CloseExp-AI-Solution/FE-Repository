import axiosClient from "@/utils/axiosClient"
import type {
    AdminApprovalRow,
    AdminDashboardOverview,
    AdminOrder,
    AdminSupermarketItem,
    AdminTimeSlot,
    AdminUser,
    AiPricingHistoryItem,
    ApiResponse,
    AssignDeliveryPayload,
    CollectionPoint,
    ConfirmDeliveryPayload,
    CreateSupermarketPayload,
    CreateUserPayload,
    CustomerConfirmationPayload,
    DashboardOverviewQuery,
    DeliveryActionPayload,
    DeliveryGroupDetail,
    DeliveryGroupListItem,
    DeliveryHistoryItem,
    DeliveryOrderDetail,
    DeliveryStats,
    FeedbackItem,
    InternalStaffRow,
    PackagingActionPayload,
    PackagingOrderDetail,
    PackagingPendingOrderItem,
    PaginationResult,
    PatchUserStatusPayload,
    PromotionItem,
    ReportDeliveryFailurePayload,
    RevenueTrendItem,
    RevenueTrendQuery,
    SlaAlertItem,
    SlaAlertQuery,
    SystemParameter,
    TimeSpanDto,
    UnitItem,
    UpdateCurrentUserProfilePayload,
    UpdateDeliveryAssignmentPayload,
    UpdateSupermarketPayload,
    UpdateSystemParameterPayload,
    UpdateUserPayload,
    UpsertCollectionPointPayload,
    UpsertPromotionPayload,
    UpdatePromotionStatusPayload,
    UpsertTimeSlotPayload,
    UpsertUnitPayload,
    UserImageItem,
} from "@/types/admin.type"

type Query = Record<string, string | number | boolean | undefined | null>

const buildQueryString = (params?: Query) => {
    if (!params) return ""
    const search = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return
        search.append(key, String(value))
    })

    const query = search.toString()
    return query ? `?${query}` : ""
}

const unwrap = <T>(response: ApiResponse<T>): T => response.data

const get = async <T>(url: string) => {
    const response = await axiosClient.get<ApiResponse<T>>(url)
    return unwrap(response.data)
}

const post = async <T, P = unknown>(url: string, payload?: P) => {
    const response = await axiosClient.post<ApiResponse<T>>(url, payload)
    return unwrap(response.data)
}

const put = async <T, P = unknown>(url: string, payload?: P) => {
    const response = await axiosClient.put<ApiResponse<T>>(url, payload)
    return unwrap(response.data)
}

const patch = async <T, P = unknown>(url: string, payload?: P) => {
    const response = await axiosClient.patch<ApiResponse<T>>(url, payload)
    return unwrap(response.data)
}

const remove = async <T>(url: string) => {
    const response = await axiosClient.delete<ApiResponse<T>>(url)
    return unwrap(response.data)
}

const paginateLocal = <T>(
    items: T[],
    params?: {
        pageNumber?: number
        pageSize?: number
    }
): PaginationResult<T> => {
    const page = Math.max(1, params?.pageNumber ?? 1)
    const pageSize = Math.max(1, params?.pageSize ?? 20)
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
        items: items.slice(start, end),
        totalResult: items.length,
        page,
        pageSize,
    }
}

export const adminService = {
    /* ========================= Dashboard ========================= */

    getDashboardOverview(params?: DashboardOverviewQuery) {
        return get<AdminDashboardOverview>(
            `/admin/dashboard/overview${buildQueryString(params)}`
        )
    },

    getRevenueTrend(params?: RevenueTrendQuery) {
        return get<RevenueTrendItem[]>(
            `/admin/dashboard/revenue-trend${buildQueryString(params)}`
        )
    },

    getSlaAlerts(params?: SlaAlertQuery) {
        return get<SlaAlertItem[]>(`/admin/dashboard/sla-alerts${buildQueryString(params)}`)
    },

    /* ========================= System Config ========================= */

    getTimeSlots() {
        return get<AdminTimeSlot[]>("/admin/system-config/time-slots")
    },

    createTimeSlot(payload: UpsertTimeSlotPayload) {
        return post<AdminTimeSlot, UpsertTimeSlotPayload>(
            "/admin/system-config/time-slots",
            payload
        )
    },

    updateTimeSlot(timeSlotId: string, payload: UpsertTimeSlotPayload) {
        return put<AdminTimeSlot, UpsertTimeSlotPayload>(
            `/admin/system-config/time-slots/${timeSlotId}`,
            payload
        )
    },

    deleteTimeSlot(timeSlotId: string) {
        return remove<boolean>(`/admin/system-config/time-slots/${timeSlotId}`)
    },

    getCollectionPoints() {
        return get<CollectionPoint[]>("/admin/system-config/collection-points")
    },

    createCollectionPoint(payload: UpsertCollectionPointPayload) {
        return post<CollectionPoint, UpsertCollectionPointPayload>(
            "/admin/system-config/collection-points",
            payload
        )
    },

    updateCollectionPoint(collectionId: string, payload: UpsertCollectionPointPayload) {
        return put<CollectionPoint, UpsertCollectionPointPayload>(
            `/admin/system-config/collection-points/${collectionId}`,
            payload
        )
    },

    deleteCollectionPoint(collectionId: string) {
        return remove<boolean>(`/admin/system-config/collection-points/${collectionId}`)
    },

    getSystemParameters() {
        return get<SystemParameter[]>("/admin/system-config/parameters")
    },

    updateSystemParameter(configKey: string, payload: UpdateSystemParameterPayload) {
        return put<SystemParameter, UpdateSystemParameterPayload>(
            `/admin/system-config/parameters/${configKey}`,
            payload
        )
    },

    /* ========================= Catalog ========================= */

    getUnits() {
        return get<UnitItem[]>("/admin/catalog/units")
    },

    createUnit(payload: UpsertUnitPayload) {
        return post<UnitItem, UpsertUnitPayload>("/admin/catalog/units", payload)
    },

    updateUnit(unitId: string, payload: UpsertUnitPayload) {
        return put<UnitItem, UpsertUnitPayload>(`/admin/catalog/units/${unitId}`, payload)
    },

    deleteUnit(unitId: string) {
        return remove<boolean>(`/admin/catalog/units/${unitId}`)
    },

    getPromotions() {
        return get<PromotionItem[]>("/admin/catalog/promotions")
    },

    createPromotion(payload: UpsertPromotionPayload) {
        return post<PromotionItem, UpsertPromotionPayload>(
            "/admin/catalog/promotions",
            payload
        )
    },

    updatePromotion(promotionId: string, payload: UpsertPromotionPayload) {
        return put<PromotionItem, UpsertPromotionPayload>(
            `/admin/catalog/promotions/${promotionId}`,
            payload
        )
    },

    updatePromotionStatus(promotionId: string, status: string) {
        return patch<PromotionItem, UpdatePromotionStatusPayload>(
            `/admin/catalog/promotions/${promotionId}/status`,
            { status }
        )
    },

    deletePromotion(promotionId: string) {
        return remove<boolean>(`/admin/catalog/promotions/${promotionId}`)
    },

    /* ========================= Monitoring ========================= */

    getAiPricingHistory(params?: { pageNumber?: number; pageSize?: number }) {
        return get<PaginationResult<AiPricingHistoryItem>>(
            `/admin/monitoring/ai-pricing-history${buildQueryString(params)}`
        )
    },

    /* ========================= Users ========================= */
    /**
     * Raw API: swagger hiện tại trả AdminUser[]
     */
    listUsersRaw() {
        return get<AdminUser[]>("/Users")
    },

    /**
     * FE wrapper: local filter + local paginate để không phá page hiện tại
     */
    async getUsers(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
        roleId?: number
        status?: number
    }): Promise<PaginationResult<AdminUser>> {
        const users = await this.listUsersRaw()

        const keyword = params?.keyword?.trim().toLowerCase()

        const filtered = users.filter((item) => {
            const matchesKeyword = !keyword
                ? true
                : [
                    item.fullName,
                    item.email,
                    item.phone,
                    item.roleName,
                    item.marketStaffInfo?.supermarket?.name,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword))

            const matchesRole = params?.roleId === undefined ? true : item.roleId === params.roleId
            const matchesStatus = params?.status === undefined ? true : item.status === params.status

            return matchesKeyword && matchesRole && matchesStatus
        })

        return paginateLocal(filtered, params)
    },

    getUserById(userId: string) {
        return get<AdminUser>(`/Users/${userId}`)
    },

    getCurrentUserProfile() {
        return get<AdminUser>("/Users/current-user")
    },

    updateCurrentUserProfile(payload: UpdateCurrentUserProfilePayload) {
        return put<AdminUser, UpdateCurrentUserProfilePayload>("/Users/current-user", payload)
    },

    createUser(payload: CreateUserPayload) {
        return post<AdminUser, CreateUserPayload>("/Users", payload)
    },

    updateUser(userId: string, payload: UpdateUserPayload) {
        return put<AdminUser, UpdateUserPayload>(`/Users/${userId}`, payload)
    },

    deleteUser(userId: string) {
        return remove<boolean>(`/Users/${userId}`)
    },

    patchUserStatus(userId: string, payload: PatchUserStatusPayload) {
        return patch<AdminUser, PatchUserStatusPayload>(`/Users/${userId}/status`, payload)
    },

    async getApprovalRows(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
    }): Promise<PaginationResult<AdminApprovalRow>> {
        const users = await this.getUsers({
            pageNumber: 1,
            pageSize: 99999,
            keyword: params?.keyword,
        })

        const items = users.items
            .filter((item) => item.status === 1)
            .map<AdminApprovalRow>((item) => ({
                id: item.userId,
                userId: item.userId,
                fullName: item.fullName,
                email: item.email,
                phone: item.phone,
                roleName: item.roleName,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                supermarketId: item.marketStaffInfo?.supermarket?.supermarketId,
                supermarketName: item.marketStaffInfo?.supermarket?.name,
                position: item.marketStaffInfo?.position,
            }))

        return paginateLocal(items, params)
    },

    approveUser(userId: string) {
        return this.patchUserStatus(userId, { status: 2 })
    },

    rejectUser(userId: string) {
        return this.patchUserStatus(userId, { status: 3 })
    },

    async getInternalStaffRows(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
    }): Promise<PaginationResult<InternalStaffRow>> {
        const users = await this.getUsers({
            pageNumber: 1,
            pageSize: 99999,
            keyword: params?.keyword,
        })

        const staffRoleIds = [1, 2, 3, 5]

        const items = users.items
            .filter((item) => staffRoleIds.includes(item.roleId))
            .map<InternalStaffRow>((item) => ({
                id: item.userId,
                userId: item.userId,
                fullName: item.fullName,
                email: item.email,
                phone: item.phone,
                roleName: item.roleName,
                roleId: item.roleId,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                department: item.roleName,
                position: item.marketStaffInfo?.position,
                organizationName: item.marketStaffInfo?.supermarket?.name,
            }))

        return paginateLocal(items, params)
    },

    /* ========================= User Images ========================= */

    getCurrentUserImages() {
        return get<UserImageItem[]>("/Users/current-user/images")
    },

    getCurrentUserPrimaryImage() {
        return get<UserImageItem>("/Users/current-user/images/primary")
    },

    setCurrentUserPrimaryImage(imageId: string) {
        return patch<UserImageItem, undefined>(
            `/Users/current-user/images/${imageId}/set-primary`,
            undefined
        )
    },

    deleteCurrentUserImage(imageId: string) {
        return remove<boolean>(`/Users/current-user/images/${imageId}`)
    },

    getUserImages(userId: string) {
        return get<UserImageItem[]>(`/Users/${userId}/images`)
    },

    /* ========================= Orders / Transactions ========================= */

    getOrders(params?: {
        pageNumber?: number
        pageSize?: number
    }) {
        return get<PaginationResult<AdminOrder>>(`/Orders${buildQueryString(params)}`)
    },

    getOrderById(orderId: string) {
        return get<AdminOrder>(`/Orders/${orderId}`)
    },

    getOrderDetails(orderId: string) {
        return get<AdminOrder>(`/Orders/${orderId}/details`)
    },

    getOrderTimeSlots() {
        return get<AdminTimeSlot[]>("/Orders/time-slots")
    },

    getOrderCollectionPoints() {
        return get<CollectionPoint[]>("/Orders/collection-points")
    },

    /* ========================= Feedbacks ========================= */

    listFeedbacksRaw() {
        return get<FeedbackItem[]>("/feedback")
    },

    getFeedbacks(params?: {
        pageNumber?: number
        pageSize?: number
    }) {
        return this.listFeedbacksRaw().then((items) => paginateLocal(items, params))
    },

    getFeedbackById(feedbackId: string) {
        return get<FeedbackItem>(`/feedback/${feedbackId}`)
    },

    getFeedbacksByOrderId(orderId: string) {
        return get<FeedbackItem[]>(`/feedback/order/${orderId}`)
    },

    deleteFeedback(feedbackId: string) {
        return remove<boolean>(`/feedback/${feedbackId}`)
    },

    /* ========================= Supermarkets ========================= */

    getSupermarkets(params?: {
        pageNumber?: number
        pageSize?: number
    }) {
        return get<PaginationResult<AdminSupermarketItem>>(
            `/Supermarkets${buildQueryString(params)}`
        )
    },

    getSupermarketById(supermarketId: string) {
        return get<AdminSupermarketItem>(`/Supermarkets/${supermarketId}`)
    },

    createSupermarket(payload: CreateSupermarketPayload) {
        return post<AdminSupermarketItem, CreateSupermarketPayload>("/Supermarkets", payload)
    },

    updateSupermarket(supermarketId: string, payload: UpdateSupermarketPayload) {
        return put<AdminSupermarketItem, UpdateSupermarketPayload>(
            `/Supermarkets/${supermarketId}`,
            payload
        )
    },

    deleteSupermarket(supermarketId: string) {
        return remove<boolean>(`/Supermarkets/${supermarketId}`)
    },

    getAvailableSupermarkets() {
        return get<AdminSupermarketItem[]>("/Supermarkets/available")
    },

    searchSupermarkets(query: string) {
        return get<AdminSupermarketItem[]>(
            `/Supermarkets/search${buildQueryString({ query })}`
        )
    },

    /* ========================= Delivery Groups ========================= */

    getDeliveryGroups(params?: {
        deliveryDate?: string
        pageNumber?: number
        pageSize?: number
        status?: string
    }) {
        return get<PaginationResult<DeliveryGroupListItem>>(
            `/delivery/groups${buildQueryString({
                DeliveryDate: params?.deliveryDate,
                PageNumber: params?.pageNumber,
                PageSize: params?.pageSize,
                status: params?.status,
            })}`
        )
    },

    getAvailableDeliveryGroups(params?: { deliveryDate?: string }) {
        return get<DeliveryGroupListItem[]>(
            `/delivery/groups/available${buildQueryString({
                deliveryDate: params?.deliveryDate,
            })}`
        )
    },

    getMyDeliveryGroups(params?: {
        deliveryDate?: string
        pageNumber?: number
        pageSize?: number
        status?: string
    }) {
        return get<PaginationResult<DeliveryGroupListItem>>(
            `/delivery/groups/my${buildQueryString({
                DeliveryDate: params?.deliveryDate,
                PageNumber: params?.pageNumber,
                PageSize: params?.pageSize,
                status: params?.status,
            })}`
        )
    },

    getDeliveryGroupById(groupId: string) {
        return get<DeliveryGroupDetail>(`/delivery/groups/${groupId}`)
    },

    assignDeliveryGroup(groupId: string, payload: AssignDeliveryPayload) {
        return post<DeliveryGroupDetail, AssignDeliveryPayload>(
            `/delivery/groups/${groupId}/assign`,
            payload
        )
    },

    updateDeliveryGroupAssignment(groupId: string, payload: UpdateDeliveryAssignmentPayload) {
        return put<DeliveryGroupDetail, UpdateDeliveryAssignmentPayload>(
            `/delivery/groups/${groupId}/assignment`,
            payload
        )
    },

    acceptDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/delivery/groups/${groupId}/accept`,
            payload
        )
    },

    startDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/delivery/groups/${groupId}/start`,
            payload
        )
    },

    completeDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/delivery/groups/${groupId}/complete`,
            payload
        )
    },

    cancelDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/delivery/groups/${groupId}/cancel`,
            payload
        )
    },

    /* ========================= Delivery Orders ========================= */

    getDeliveryOrderById(orderId: string) {
        return get<DeliveryOrderDetail>(`/delivery/orders/${orderId}`)
    },

    confirmDelivered(orderId: string, payload?: ConfirmDeliveryPayload) {
        return post<DeliveryOrderDetail, ConfirmDeliveryPayload>(
            `/delivery/orders/${orderId}/confirm-delivery`,
            payload
        )
    },

    reportDeliveryFailure(orderId: string, payload: ReportDeliveryFailurePayload) {
        return post<DeliveryOrderDetail, ReportDeliveryFailurePayload>(
            `/delivery/orders/${orderId}/report-failure`,
            payload
        )
    },

    confirmCustomerReceived(orderId: string, payload?: CustomerConfirmationPayload) {
        return post<DeliveryOrderDetail, CustomerConfirmationPayload>(
            `/delivery/orders/${orderId}/customer-confirmation`,
            payload
        )
    },

    getDeliveryHistory(params?: {
        fromDate?: string
        toDate?: string
        pageNumber?: number
        pageSize?: number
        status?: string
    }) {
        return get<PaginationResult<DeliveryHistoryItem>>(
            `/delivery/history${buildQueryString(params)}`
        )
    },

    getDeliveryStats() {
        return get<DeliveryStats[]>("/delivery/stats")
    },

    /* ========================= Packaging ========================= */

    getPackagingPendingOrders(params?: {
        pageNumber?: number
        pageSize?: number
    }) {
        return get<PaginationResult<PackagingPendingOrderItem>>(
            `/Packaging/orders/pending${buildQueryString(params)}`
        )
    },

    getPackagingOrderDetail(orderId: string) {
        return get<PackagingOrderDetail>(`/Packaging/orders/${orderId}`)
    },

    collectPackagingOrder(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/Packaging/orders/${orderId}/collect`,
            payload
        )
    },

    packagePackagingOrder(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/Packaging/orders/${orderId}/package`,
            payload
        )
    },

    markPackagingReady(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/Packaging/orders/${orderId}/confirm`,
            payload
        )
    },

    /* ========================= Helpers ========================= */

    timeSpanToClockText(value?: TimeSpanDto | null) {
        if (!value) return "--"

        const hh = String(value.hours ?? 0).padStart(2, "0")
        const mm = String(value.minutes ?? 0).padStart(2, "0")
        return `${hh}:${mm}`
    },
}
