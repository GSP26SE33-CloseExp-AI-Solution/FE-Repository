import axios from "axios"

import axiosClient from "@/utils/axiosClient"
import type { ApiResponse } from "@/types/api.types"
import type {
    AdminApprovalRow,
    AdminDashboardOverview,
    AdminOrder,
    AdminOrdersQuery,
    AdminRegisterInternalPayload,
    AdminSupermarketItem,
    AdminTimeSlot,
    AdminUser,
    AiPricingHistoryItem,
    AssignDeliveryGroupPayload,
    CategoryItem,
    CollectionPoint,
    CreateSupermarketPayload,
    CreateUserPayload,
    DashboardOverviewQuery,
    DeliveryCalendarDaySummary,
    DeliveryCalendarMonthSummary,
    DeliveryCalendarSlotSummary,
    DeliveryGroupDetail,
    DeliveryGroupSummary,
    DeliveryGroupsQuery,
    DeliveryStaffBoardItem,
    DraftDeliveryGroupsQuery,
    GenerateDraftDeliveryGroupsPayload,
    MoveOrderItemsToDraftGroupPayload,
    MoveOrderItemsToDraftGroupResult,
    PackagingActionPayload,
    PackagingOrderDetail,
    PackagingPendingOrderItem,
    PaginationResult,
    PatchUserStatusPayload,
    PendingSupermarketApplication,
    PromotionItem,
    RejectSupermarketApplicationPayload,
    RevenueTrendItem,
    RevenueTrendQuery,
    SlaAlertItem,
    SlaAlertQuery,
    SystemParameter,
    TimeSpanDto,
    UpdateCurrentUserProfilePayload,
    UpdatePromotionStatusPayload,
    UpdateSupermarketPayload,
    UpdateSystemParameterPayload,
    UpdateUserPayload,
    UpsertCategoryPayload,
    UpsertCollectionPointPayload,
    UpsertPromotionPayload,
    UpsertTimeSlotPayload,
    UpsertUnitPayload,
    UnitItem,
    UserImageItem,
} from "@/types/admin.type"

type QueryValue = string | number | boolean | undefined | null
type Query = Record<string, QueryValue>

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

const extractApiErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as any

        let apiMessage = ""

        if (typeof responseData?.message === "string" && responseData.message.trim()) {
            apiMessage = responseData.message.trim()
        } else if (Array.isArray(responseData?.errors)) {
            apiMessage = responseData.errors.filter(Boolean).join(", ")
        } else if (
            responseData?.errors &&
            typeof responseData.errors === "object"
        ) {
            apiMessage = Object.values(responseData.errors)
                .flatMap((value) =>
                    Array.isArray(value) ? value : [String(value)]
                )
                .filter(Boolean)
                .join(", ")
        } else if (typeof responseData?.errors === "string") {
            apiMessage = responseData.errors
        }

        console.error("admin.service axios error:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
            params: error.config?.params,
            requestData: error.config?.data,
        })

        return apiMessage || fallback
    }

    console.error("admin.service unknown error:", error)
    return fallback
}

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

const isApiResponseShape = <T,>(value: unknown): value is ApiResponse<T> =>
    isObject(value) &&
    "success" in value &&
    "message" in value &&
    "data" in value

const unwrapResponse = <T,>(response: { data?: unknown } | ApiResponse<T>): T => {
    const payload =
        isObject(response) && "data" in response ? response.data : response

    if (!isApiResponseShape<T>(payload)) {
        throw new Error("Không nhận được dữ liệu phản hồi từ máy chủ")
    }

    if (payload.success === false) {
        let errorMessage = ""

        if (Array.isArray(payload.errors)) {
            errorMessage = payload.errors.filter(Boolean).join(", ")
        } else if (payload.errors && typeof payload.errors === "object") {
            errorMessage = Object.values(payload.errors as Record<string, unknown>)
                .flatMap((value) =>
                    Array.isArray(value) ? value : [String(value)]
                )
                .filter(Boolean)
                .join(", ")
        } else if (typeof payload.errors === "string") {
            errorMessage = payload.errors
        }

        throw new Error(
            errorMessage || payload.message || "Yêu cầu không thành công"
        )
    }

    return payload.data
}

const get = async <T,>(url: string, fallback = "Không thể tải dữ liệu") => {
    try {
        const response = await axiosClient.get<ApiResponse<T>>(url)
        return unwrapResponse<T>(response)
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, fallback))
    }
}

const post = async <T, P = unknown>(
    url: string,
    payload?: P,
    fallback = "Không thể gửi dữ liệu"
) => {
    try {
        const response = await axiosClient.post<ApiResponse<T>>(url, payload)
        return unwrapResponse<T>(response)
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, fallback))
    }
}

const put = async <T, P = unknown>(
    url: string,
    payload?: P,
    fallback = "Không thể cập nhật dữ liệu"
) => {
    try {
        const response = await axiosClient.put<ApiResponse<T>>(url, payload)
        return unwrapResponse<T>(response)
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, fallback))
    }
}

const patch = async <T, P = unknown>(
    url: string,
    payload?: P,
    fallback = "Không thể cập nhật dữ liệu"
) => {
    try {
        const response = await axiosClient.patch<ApiResponse<T>>(url, payload)
        return unwrapResponse<T>(response)
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, fallback))
    }
}

const remove = async <T,>(url: string, fallback = "Không thể xóa dữ liệu") => {
    try {
        const response = await axiosClient.delete<ApiResponse<T>>(url)
        return unwrapResponse<T>(response)
    } catch (error) {
        throw new Error(extractApiErrorMessage(error, fallback))
    }
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

const fetchAllPages = async <T,>(
    fetchPage: (pageNumber: number, pageSize: number) => Promise<PaginationResult<T>>,
    pageSize = 100
): Promise<T[]> => {
    const allItems: T[] = []
    let pageNumber = 1
    let totalResult = 0

    do {
        const result = await fetchPage(pageNumber, pageSize)
        const items = result.items ?? []

        allItems.push(...items)
        totalResult = result.totalResult ?? allItems.length

        if (!items.length) break

        pageNumber += 1
    } while (allItems.length < totalResult)

    return allItems
}

const normalizeStatus = (value?: string) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "")

const toDateKey = (value?: string) => {
    if (!value) return ""

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return String(value).slice(0, 10)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

const toUtcStartOfDay = (value?: string) => {
    if (!value) return undefined

    const dateKey = toDateKey(value)
    if (!dateKey) return undefined

    return `${dateKey}T00:00:00.000Z`
}

const toMonthMeta = (dateKey: string) => {
    const [yearText, monthText] = dateKey.split("-")
    const year = Number(yearText || 0)
    const month = Number(monthText || 0)

    return {
        year,
        month,
        monthKey: year && month ? `${year}-${String(month).padStart(2, "0")}` : "",
    }
}

export const adminService = {
    /* ========================= Dashboard ========================= */

    getDashboardOverview(params?: DashboardOverviewQuery) {
        return get<AdminDashboardOverview>(
            `/admin/dashboard/overview${buildQueryString({
                fromUtc: params?.fromUtc,
                toUtc: params?.toUtc,
            })}`,
            "Không thể tải tổng quan dashboard"
        )
    },

    getRevenueTrend(params?: RevenueTrendQuery) {
        return get<RevenueTrendItem[]>(
            `/admin/dashboard/revenue-trend${buildQueryString({
                days: params?.days,
            })}`,
            "Không thể tải biểu đồ doanh thu"
        )
    },

    getSlaAlerts(params?: SlaAlertQuery) {
        return get<SlaAlertItem[]>(
            `/admin/dashboard/sla-alerts${buildQueryString({
                thresholdMinutes: params?.thresholdMinutes,
                top: params?.top,
            })}`,
            "Không thể tải cảnh báo SLA"
        )
    },

    /* ========================= System Config ========================= */

    getTimeSlots() {
        return get<AdminTimeSlot[]>(
            "/admin/system-config/time-slots",
            "Không thể tải danh sách khung giờ"
        )
    },

    createTimeSlot(payload: UpsertTimeSlotPayload) {
        console.log("adminService.createTimeSlot payload:", payload)
        return post<AdminTimeSlot, UpsertTimeSlotPayload>(
            "/admin/system-config/time-slots",
            payload,
            "Không thể tạo khung giờ"
        )
    },

    updateTimeSlot(timeSlotId: string, payload: UpsertTimeSlotPayload) {
        console.log("adminService.updateTimeSlot payload:", {
            timeSlotId,
            payload,
        })
        return put<AdminTimeSlot, UpsertTimeSlotPayload>(
            `/admin/system-config/time-slots/${timeSlotId}`,
            payload,
            "Không thể cập nhật khung giờ"
        )
    },

    deleteTimeSlot(timeSlotId: string) {
        return remove<boolean>(
            `/admin/system-config/time-slots/${timeSlotId}`,
            "Không thể xóa khung giờ"
        )
    },

    getCollectionPoints() {
        return get<CollectionPoint[]>(
            "/admin/system-config/collection-points",
            "Không thể tải danh sách điểm tập kết"
        )
    },

    createCollectionPoint(payload: UpsertCollectionPointPayload) {
        console.log("adminService.createCollectionPoint payload:", payload)
        return post<CollectionPoint, UpsertCollectionPointPayload>(
            "/admin/system-config/collection-points",
            payload,
            "Không thể tạo điểm tập kết"
        )
    },

    updateCollectionPoint(
        collectionId: string,
        payload: UpsertCollectionPointPayload
    ) {
        console.log("adminService.updateCollectionPoint payload:", {
            collectionId,
            payload,
        })
        return put<CollectionPoint, UpsertCollectionPointPayload>(
            `/admin/system-config/collection-points/${collectionId}`,
            payload,
            "Không thể cập nhật điểm tập kết"
        )
    },

    deleteCollectionPoint(collectionId: string) {
        return remove<boolean>(
            `/admin/system-config/collection-points/${collectionId}`,
            "Không thể xóa điểm tập kết"
        )
    },

    getSystemParameters() {
        return get<SystemParameter[]>(
            "/admin/system-config/parameters",
            "Không thể tải tham số hệ thống"
        )
    },

    updateSystemParameter(
        configKey: string,
        payload: UpdateSystemParameterPayload
    ) {
        console.log("adminService.updateSystemParameter payload:", {
            configKey,
            payload,
        })
        return put<SystemParameter, UpdateSystemParameterPayload>(
            `/admin/system-config/parameters/${configKey}`,
            payload,
            "Không thể cập nhật tham số hệ thống"
        )
    },

    /* ========================= Categories ========================= */

    getCategories(includeInactive = true) {
        return get<CategoryItem[]>(
            `/Categories${buildQueryString({ includeInactive })}`,
            "Không thể tải danh sách danh mục"
        )
    },

    getParentCategories(includeInactive = true) {
        return get<CategoryItem[]>(
            `/Categories/parents${buildQueryString({ includeInactive })}`,
            "Không thể tải danh mục cha"
        )
    },

    getCategoryById(categoryId: string) {
        return get<CategoryItem>(
            `/Categories/${categoryId}`,
            "Không thể tải chi tiết danh mục"
        )
    },

    createCategory(payload: UpsertCategoryPayload) {
        console.log("adminService.createCategory payload:", payload)
        return post<CategoryItem, UpsertCategoryPayload>(
            "/Categories",
            payload,
            "Không thể tạo danh mục"
        )
    },

    updateCategory(categoryId: string, payload: UpsertCategoryPayload) {
        console.log("adminService.updateCategory payload:", {
            categoryId,
            payload,
        })
        return put<string, UpsertCategoryPayload>(
            `/Categories/${categoryId}`,
            payload,
            "Không thể cập nhật danh mục"
        )
    },

    deleteCategory(categoryId: string) {
        return remove<string>(
            `/Categories/${categoryId}`,
            "Không thể xóa danh mục"
        )
    },

    /* ========================= Catalog ========================= */

    getUnits() {
        return get<UnitItem[]>(
            "/admin/catalog/units",
            "Không thể tải danh sách đơn vị"
        )
    },

    createUnit(payload: UpsertUnitPayload) {
        console.log("adminService.createUnit payload:", payload)
        return post<UnitItem, UpsertUnitPayload>(
            "/admin/catalog/units",
            payload,
            "Không thể tạo đơn vị"
        )
    },

    updateUnit(unitId: string, payload: UpsertUnitPayload) {
        console.log("adminService.updateUnit payload:", { unitId, payload })
        return put<UnitItem, UpsertUnitPayload>(
            `/admin/catalog/units/${unitId}`,
            payload,
            "Không thể cập nhật đơn vị"
        )
    },

    deleteUnit(unitId: string) {
        return remove<boolean>(
            `/admin/catalog/units/${unitId}`,
            "Không thể xóa đơn vị"
        )
    },

    getPromotions() {
        return get<PromotionItem[]>(
            "/admin/catalog/promotions",
            "Không thể tải danh sách khuyến mãi"
        )
    },

    createPromotion(payload: UpsertPromotionPayload) {
        console.log("adminService.createPromotion payload:", payload)
        return post<PromotionItem, UpsertPromotionPayload>(
            "/admin/catalog/promotions",
            payload,
            "Không thể tạo khuyến mãi"
        )
    },

    updatePromotion(promotionId: string, payload: UpsertPromotionPayload) {
        console.log("adminService.updatePromotion payload:", { promotionId, payload })
        return put<PromotionItem, UpsertPromotionPayload>(
            `/admin/catalog/promotions/${promotionId}`,
            payload,
            "Không thể cập nhật khuyến mãi"
        )
    },

    updatePromotionStatus(promotionId: string, status: string) {
        console.log("adminService.updatePromotionStatus payload:", {
            promotionId,
            status,
        })
        return patch<PromotionItem, UpdatePromotionStatusPayload>(
            `/admin/catalog/promotions/${promotionId}/status`,
            { status },
            "Không thể cập nhật trạng thái khuyến mãi"
        )
    },

    /* ========================= Monitoring ========================= */

    getAiPricingHistory(params?: { pageNumber?: number; pageSize?: number }) {
        return get<PaginationResult<AiPricingHistoryItem>>(
            `/admin/monitoring/ai-pricing-history${buildQueryString({
                pageNumber: params?.pageNumber,
                pageSize: params?.pageSize,
            })}`,
            "Không thể tải lịch sử giá AI"
        )
    },

    /* ========================= Users ========================= */

    listUsersRaw() {
        return get<AdminUser[]>("/users", "Không thể tải danh sách người dùng")
    },

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
                    .some((value) =>
                        String(value).toLowerCase().includes(keyword)
                    )

            const matchesRole =
                params?.roleId === undefined ? true : item.roleId === params.roleId

            const matchesStatus =
                params?.status === undefined ? true : item.status === params.status

            return matchesKeyword && matchesRole && matchesStatus
        })

        return paginateLocal(filtered, params)
    },

    getUserById(userId: string) {
        return get<AdminUser>(`/users/${userId}`, "Không thể tải chi tiết người dùng")
    },

    getCurrentUserProfile() {
        return get<AdminUser>("/users/current-user", "Không thể tải hồ sơ hiện tại")
    },

    updateCurrentUserProfile(payload: UpdateCurrentUserProfilePayload) {
        console.log("adminService.updateCurrentUserProfile payload:", payload)
        return put<AdminUser, UpdateCurrentUserProfilePayload>(
            "/users/current-user",
            payload,
            "Không thể cập nhật hồ sơ"
        )
    },

    createUser(payload: CreateUserPayload) {
        console.log("adminService.createUser payload:", payload)
        return post<AdminUser, CreateUserPayload>(
            "/users",
            payload,
            "Không thể tạo người dùng"
        )
    },

    registerInternalStaff(payload: AdminRegisterInternalPayload) {
        console.log("adminService.registerInternalStaff payload:", payload)
        return post<null, AdminRegisterInternalPayload>(
            "/auth/admin/register-internal",
            payload,
            "Không thể tạo tài khoản nhân viên nội bộ"
        )
    },

    updateUser(userId: string, payload: UpdateUserPayload) {
        console.log("adminService.updateUser payload:", { userId, payload })
        return put<AdminUser, UpdateUserPayload>(
            `/users/${userId}`,
            payload,
            "Không thể cập nhật người dùng"
        )
    },

    deleteUser(userId: string) {
        return remove<boolean>(`/users/${userId}`, "Không thể xóa người dùng")
    },

    patchUserStatus(userId: string, payload: PatchUserStatusPayload) {
        console.log("adminService.patchUserStatus payload:", { userId, payload })
        return patch<AdminUser, PatchUserStatusPayload>(
            `/users/${userId}/status`,
            payload,
            "Không thể cập nhật trạng thái người dùng"
        )
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

    /* ========================= User Images ========================= */

    getCurrentUserImages() {
        return get<UserImageItem[]>(
            "/users/current-user/images",
            "Không thể tải ảnh hiện tại"
        )
    },

    getCurrentUserPrimaryImage() {
        return get<UserImageItem>(
            "/users/current-user/images/primary",
            "Không thể tải ảnh đại diện"
        )
    },

    setCurrentUserPrimaryImage(imageId: string) {
        return patch<boolean, undefined>(
            `/users/current-user/images/${imageId}/set-primary`,
            undefined,
            "Không thể đặt ảnh đại diện"
        )
    },

    deleteCurrentUserImage(imageId: string) {
        return remove<boolean>(
            `/users/current-user/images/${imageId}`,
            "Không thể xóa ảnh"
        )
    },

    getUserImages(userId: string) {
        return get<UserImageItem[]>(
            `/users/${userId}/images`,
            "Không thể tải ảnh user"
        )
    },

    /* ========================= Orders ========================= */

    getOrders(params?: AdminOrdersQuery) {
        return get<PaginationResult<AdminOrder>>(
            `/admin/orders${buildQueryString({
                PageNumber: params?.pageNumber,
                PageSize: params?.pageSize,
                FromUtc: params?.fromUtc,
                ToUtc: params?.toUtc,
                Status: params?.status,
                DeliveryType: params?.deliveryType,
                UserId: params?.userId,
                TimeSlotId: params?.timeSlotId,
                CollectionId: params?.collectionId,
                DeliveryGroupId: params?.deliveryGroupId,
                UnassignedOnly: params?.unassignedOnly,
                Search: params?.search,
                SortBy: params?.sortBy,
                SortDir: params?.sortDir,
            })}`,
            "Không thể tải danh sách đơn hàng"
        )
    },

    /* ========================= Supermarkets ========================= */

    getSupermarkets(params?: {
        pageNumber?: number
        pageSize?: number
    }) {
        return get<PaginationResult<AdminSupermarketItem>>(
            `/supermarkets${buildQueryString(params)}`,
            "Không thể tải danh sách siêu thị"
        )
    },

    getSupermarketById(supermarketId: string) {
        return get<AdminSupermarketItem>(
            `/supermarkets/${supermarketId}`,
            "Không thể tải chi tiết siêu thị"
        )
    },

    createSupermarket(payload: CreateSupermarketPayload) {
        console.log("adminService.createSupermarket payload:", payload)
        return post<AdminSupermarketItem, CreateSupermarketPayload>(
            "/supermarkets",
            payload,
            "Không thể tạo siêu thị"
        )
    },

    updateSupermarket(supermarketId: string, payload: UpdateSupermarketPayload) {
        console.log("adminService.updateSupermarket payload:", {
            supermarketId,
            payload,
        })
        return put<AdminSupermarketItem, UpdateSupermarketPayload>(
            `/supermarkets/${supermarketId}`,
            payload,
            "Không thể cập nhật siêu thị"
        )
    },

    deleteSupermarket(supermarketId: string) {
        return remove<boolean>(
            `/supermarkets/${supermarketId}`,
            "Không thể xóa siêu thị"
        )
    },

    getAvailableSupermarkets() {
        return get<AdminSupermarketItem[]>(
            "/supermarkets/available",
            "Không thể tải siêu thị khả dụng"
        )
    },

    searchSupermarkets(query: string) {
        return get<AdminSupermarketItem[]>(
            `/supermarkets/search${buildQueryString({ query })}`,
            "Không thể tìm siêu thị"
        )
    },

    /* ========================= Supermarket Applications ========================= */

    getPendingSupermarketApplications() {
        return get<PendingSupermarketApplication[]>(
            "/admin/supermarkets/applications/pending",
            "Không thể tải hồ sơ siêu thị chờ duyệt"
        )
    },

    approveSupermarketApplication(supermarketId: string) {
        return post<string>(
            `/admin/supermarkets/applications/${supermarketId}/approve`,
            undefined,
            "Không thể duyệt hồ sơ siêu thị"
        )
    },

    rejectSupermarketApplication(
        supermarketId: string,
        payload: RejectSupermarketApplicationPayload
    ) {
        return post<string, RejectSupermarketApplicationPayload>(
            `/admin/supermarkets/applications/${supermarketId}/reject`,
            payload,
            "Không thể từ chối hồ sơ siêu thị"
        )
    },

    /* ========================= Delivery ========================= */

    getDeliveryGroups(params?: DeliveryGroupsQuery) {
        return get<PaginationResult<DeliveryGroupSummary>>(
            `/delivery/groups${buildQueryString({
                DeliveryDate: params?.deliveryDate
                    ? toUtcStartOfDay(params.deliveryDate)
                    : undefined,
                PageNumber: params?.pageNumber,
                PageSize: params?.pageSize,
                status: params?.status,
            })}`,
            "Không thể tải danh sách nhóm giao"
        )
    },

    getDraftDeliveryGroups(params?: DraftDeliveryGroupsQuery) {
        return get<PaginationResult<DeliveryGroupSummary>>(
            `/delivery/groups/drafts${buildQueryString({
                DeliveryDate: params?.deliveryDate
                    ? toUtcStartOfDay(params.deliveryDate)
                    : undefined,
                TimeSlotId: params?.timeSlotId,
                CollectionId: params?.collectionId,
                PageNumber: params?.pageNumber,
                PageSize: params?.pageSize,
            })}`,
            "Không thể tải danh sách nhóm draft"
        )
    },

    generateDraftDeliveryGroups(payload: GenerateDraftDeliveryGroupsPayload) {
        const normalizedPayload: GenerateDraftDeliveryGroupsPayload = {
            ...payload,
            deliveryDate: payload.deliveryDate
                ? toUtcStartOfDay(payload.deliveryDate)
                : undefined,
        }

        console.log("adminService.generateDraftDeliveryGroups payload:", normalizedPayload)

        return post<DeliveryGroupSummary[], GenerateDraftDeliveryGroupsPayload>(
            "/delivery/groups/drafts/generate",
            normalizedPayload,
            "Không thể tạo nhóm draft"
        )
    },

    confirmDraftDeliveryGroup(deliveryGroupId: string) {
        return post<DeliveryGroupDetail>(
            `/delivery/groups/${deliveryGroupId}/confirm`,
            undefined,
            "Không thể xác nhận nhóm draft"
        )
    },

    assignDeliveryGroup(deliveryGroupId: string, payload: AssignDeliveryGroupPayload) {
        console.log("adminService.assignDeliveryGroup payload:", {
            deliveryGroupId,
            payload,
        })
        return post<DeliveryGroupDetail, AssignDeliveryGroupPayload>(
            `/delivery/groups/${deliveryGroupId}/assign`,
            payload,
            "Không thể phân công shipper"
        )
    },

    updateDeliveryGroupAssignment(
        deliveryGroupId: string,
        payload: AssignDeliveryGroupPayload
    ) {
        console.log("adminService.updateDeliveryGroupAssignment payload:", {
            deliveryGroupId,
            payload,
        })
        return put<DeliveryGroupDetail, AssignDeliveryGroupPayload>(
            `/delivery/groups/${deliveryGroupId}/assignment`,
            payload,
            "Không thể cập nhật phân công shipper"
        )
    },

    moveOrderItemsToDraftGroup(payload: MoveOrderItemsToDraftGroupPayload) {
        console.log("adminService.moveOrderItemsToDraftGroup payload:", payload)
        return put<MoveOrderItemsToDraftGroupResult, MoveOrderItemsToDraftGroupPayload>(
            "/delivery/order-items/draft-group",
            payload,
            "Không thể chuyển item giữa các nhóm draft"
        )
    },

    getDeliveryGroupDetail(groupId: string) {
        return get<DeliveryGroupDetail>(
            `/delivery/groups/${groupId}`,
            "Không thể tải chi tiết nhóm giao"
        )
    },

    async getDeliveryCalendarDays(params?: {
        deliveryDate?: string
        pageNumber?: number
        pageSize?: number
        status?: string
    }): Promise<DeliveryCalendarDaySummary[]> {
        const [draftItems, groupItems] = await Promise.all([
            fetchAllPages<DeliveryGroupSummary>((pageNumber, pageSize) =>
                this.getDraftDeliveryGroups({
                    deliveryDate: params?.deliveryDate,
                    pageNumber,
                    pageSize,
                })
            ),
            fetchAllPages<DeliveryGroupSummary>((pageNumber, pageSize) =>
                this.getDeliveryGroups({
                    deliveryDate: params?.deliveryDate,
                    pageNumber,
                    pageSize,
                    status: params?.status,
                })
            ),
        ])

        const uniqueMap = new Map<string, DeliveryGroupSummary>()

            ;[...draftItems, ...groupItems].forEach((item) => {
                if (!uniqueMap.has(item.deliveryGroupId)) {
                    uniqueMap.set(item.deliveryGroupId, item)
                }
            })

        const groups = Array.from(uniqueMap.values())

        console.log("adminService.getDeliveryCalendarDays merged:", {
            deliveryDate: params?.deliveryDate,
            normalizedDeliveryDate: params?.deliveryDate
                ? toUtcStartOfDay(params.deliveryDate)
                : undefined,
            draftCount: draftItems.length,
            groupCount: groupItems.length,
            totalUnique: groups.length,
            bySlot: groups.reduce<Record<string, number>>((acc, group) => {
                const key = group.timeSlotDisplay || group.timeSlotId || "unknown"
                acc[key] = (acc[key] ?? 0) + 1
                return acc
            }, {}),
        })

        return this.groupDeliveryGroupsByDate(groups)
    },

    async getDeliveryCalendarSlotsByDate(
        date: string
    ): Promise<DeliveryCalendarSlotSummary[]> {
        const days = await this.getDeliveryCalendarDays({
            deliveryDate: date,
        })

        const selectedDay = days.find((item) => item.date === toDateKey(date))
        if (!selectedDay) return []

        return this.groupDeliveryGroupsByTimeSlot(selectedDay.groups)
    },

    async getDeliveryCalendarMonth(params?: {
        month: number
        year: number
    }): Promise<DeliveryCalendarMonthSummary> {
        const { month, year } = params ?? {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        }

        const monthText = String(month).padStart(2, "0")
        const startDate = `${year}-${monthText}-01`
        const end = new Date(year, month, 0)
        const endDate = `${year}-${monthText}-${String(end.getDate()).padStart(2, "0")}`

        const days = await this.getDeliveryCalendarDays()

        const filteredDays = days.filter(
            (item) => item.date >= startDate && item.date <= endDate
        )

        return {
            monthKey: `${year}-${monthText}`,
            year,
            month,
            days: filteredDays,
        }
    },

    /* ========================= Packaging ========================= */

    getPackagingPendingOrders(params?: {
        pageNumber?: number
        pageSize?: number
    }) {
        return get<PaginationResult<PackagingPendingOrderItem>>(
            `/Packaging/orders/pending${buildQueryString({
                pageNumber: params?.pageNumber,
                pageSize: params?.pageSize,
            })}`,
            "Không thể tải đơn chờ đóng gói"
        )
    },

    getPackagingOrderDetail(orderId: string) {
        return get<PackagingOrderDetail>(
            `/Packaging/orders/${orderId}`,
            "Không thể tải chi tiết đơn đóng gói"
        )
    },

    collectPackagingOrder(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/Packaging/orders/${orderId}/collect`,
            payload,
            "Không thể cập nhật bước thu gom"
        )
    },

    packagePackagingOrder(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/Packaging/orders/${orderId}/package`,
            payload,
            "Không thể hoàn tất đóng gói"
        )
    },

    confirmPackagingOrder(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/Packaging/orders/${orderId}/confirm`,
            payload,
            "Không thể xác nhận bắt đầu đóng gói"
        )
    },

    /* ========================= Helpers ========================= */

    timeSpanToClockText(value?: TimeSpanDto | null) {
        if (!value) return "--"

        const hh = String(value.hours ?? 0).padStart(2, "0")
        const mm = String(value.minutes ?? 0).padStart(2, "0")
        return `${hh}:${mm}`
    },

    toTimeSpanTicks(value: string) {
        const normalized = value.trim()
        if (!normalized) return 0

        const [hoursText, minutesText] = normalized.split(":")
        const hours = Number(hoursText || 0)
        const minutes = Number(minutesText || 0)

        return (hours * 60 * 60 + minutes * 60) * 10_000_000
    },

    toTimeSlotPayload(startHHmm: string, endHHmm: string): UpsertTimeSlotPayload {
        return {
            startTime: {
                ticks: this.toTimeSpanTicks(startHHmm),
            },
            endTime: {
                ticks: this.toTimeSpanTicks(endHHmm),
            },
        }
    },

    getDeliveryStaffUsers() {
        return this.getUsers({
            pageNumber: 1,
            pageSize: 99999,
            roleId: 5,
        })
    },

    async getDeliveryStaffBoard(params?: {
        keyword?: string
        status?: number
    }): Promise<DeliveryStaffBoardItem[]> {
        const [usersResult, allGroups, allDraftGroups] = await Promise.all([
            this.getUsers({
                pageNumber: 1,
                pageSize: 99999,
                roleId: 5,
                status: params?.status,
                keyword: params?.keyword,
            }),
            fetchAllPages<DeliveryGroupSummary>((pageNumber, pageSize) =>
                this.getDeliveryGroups({
                    pageNumber,
                    pageSize,
                })
            ),
            fetchAllPages<DeliveryGroupSummary>((pageNumber, pageSize) =>
                this.getDraftDeliveryGroups({
                    pageNumber,
                    pageSize,
                })
            ),
        ])

        return usersResult.items.map((user) => {
            const assignedGroups = allGroups.filter(
                (group) => group.deliveryStaffId === user.userId
            )

            const draftGroups = allDraftGroups.filter(
                (group) => group.deliveryStaffId === user.userId
            )

            const getLatestAssignedDate = () => {
                const dates = assignedGroups
                    .map((group) => group.deliveryDate)
                    .filter(Boolean)
                    .map((value) => new Date(String(value)).getTime())
                    .filter((value) => !Number.isNaN(value))

                if (!dates.length) return undefined
                return new Date(Math.max(...dates)).toISOString()
            }

            return {
                deliveryStaffId: user.userId,
                deliveryStaffName: user.fullName,
                email: user.email,
                phone: user.phone,
                status: user.status,
                totalAssignedGroups: assignedGroups.length,
                draftGroups: draftGroups.length,
                activeGroups: assignedGroups.filter((group) => {
                    const status = normalizeStatus(group.status)
                    return (
                        status === "assigned" ||
                        status === "pending" ||
                        status === "confirmed" ||
                        status === "intransit"
                    )
                }).length,
                completedGroups: assignedGroups.filter(
                    (group) => normalizeStatus(group.status) === "completed"
                ).length,
                failedGroups: assignedGroups.filter(
                    (group) => normalizeStatus(group.status) === "failed"
                ).length,
                inTransitGroups: assignedGroups.filter(
                    (group) => normalizeStatus(group.status) === "intransit"
                ).length,
                pendingGroups: assignedGroups.filter((group) => {
                    const status = normalizeStatus(group.status)
                    return status === "pending" || status === "confirmed"
                }).length,
                latestAssignedGroupDate: getLatestAssignedDate(),
            }
        })
    },

    groupDeliveryGroupsByDate(groups: DeliveryGroupSummary[]): DeliveryCalendarDaySummary[] {
        const dayMap = new Map<string, DeliveryCalendarDaySummary>()

        groups.forEach((group) => {
            const dateKey = toDateKey(group.deliveryDate)
            if (!dateKey) return

            if (!dayMap.has(dateKey)) {
                dayMap.set(dateKey, {
                    date: dateKey,
                    totalGroups: 0,
                    totalDraftGroups: 0,
                    totalPendingGroups: 0,
                    totalAssignedGroups: 0,
                    totalInTransitGroups: 0,
                    totalCompletedGroups: 0,
                    totalFailedGroups: 0,
                    totalUnassignedGroups: 0,
                    totalOrders: 0,
                    groups: [],
                })
            }

            const day = dayMap.get(dateKey)!
            const status = normalizeStatus(group.status)
            const isUnassigned = !(group.deliveryStaffId || group.deliveryStaffName)

            day.totalGroups += 1
            day.totalOrders += group.totalOrders ?? 0
            day.groups.push(group)

            if (status === "draft") day.totalDraftGroups += 1
            if (status === "pending" || status === "confirmed") day.totalPendingGroups += 1
            if (status === "assigned") day.totalAssignedGroups += 1
            if (status === "intransit") day.totalInTransitGroups += 1
            if (status === "completed") day.totalCompletedGroups += 1
            if (status === "failed") day.totalFailedGroups += 1
            if (isUnassigned) day.totalUnassignedGroups += 1
        })

        return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    },

    groupDeliveryGroupsByTimeSlot(
        groups: DeliveryGroupSummary[]
    ): DeliveryCalendarSlotSummary[] {
        const slotMap = new Map<string, DeliveryCalendarSlotSummary>()

        groups.forEach((group) => {
            const key = group.timeSlotId || group.timeSlotDisplay || "unknown"
            const label = group.timeSlotDisplay || "Chưa có khung giờ"
            const isUnassigned = !(group.deliveryStaffId || group.deliveryStaffName)

            if (!slotMap.has(key)) {
                slotMap.set(key, {
                    timeSlotId: group.timeSlotId,
                    timeSlotDisplay: label,
                    totalGroups: 0,
                    totalOrders: 0,
                    unassignedGroups: 0,
                    groups: [],
                })
            }

            const slot = slotMap.get(key)!
            slot.totalGroups += 1
            slot.totalOrders += group.totalOrders ?? 0
            if (isUnassigned) slot.unassignedGroups += 1
            slot.groups.push(group)
        })

        return Array.from(slotMap.values()).sort((a, b) =>
            a.timeSlotDisplay.localeCompare(b.timeSlotDisplay, "vi")
        )
    },

    getMonthMetaFromDateKey(dateKey: string) {
        return toMonthMeta(dateKey)
    },

    toDateKey(value?: string) {
        return toDateKey(value)
    },

    async getBlockingCustomerOrders(userId: string): Promise<AdminOrder[]> {
        const result = await this.getOrders({
            pageNumber: 1,
            pageSize: 100,
            userId,
            sortBy: "OrderDate",
            sortDir: "desc",
        })

        const blockingStatuses = new Set([
            "pending",
            "paid",
            "readytoship",
            "deliveredwaitconfirm",
        ])

        return (result.items ?? []).filter((order) =>
            blockingStatuses.has(normalizeStatus(order.status))
        )
    },
}
