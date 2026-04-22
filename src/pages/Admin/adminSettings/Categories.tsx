import { useMemo, useState } from "react"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"

import type {
    CategoryItem,
    UpsertCategoryPayload,
} from "@/types/admin.type"
import { adminService } from "@/services/admin.service"
import { showError, showSuccess } from "@/utils/toast"

import { logApiError, logApiSuccess } from "./Shared"

type Props = {
    loading: boolean
    categories: CategoryItem[]
    parentCategories: CategoryItem[]
    onRefresh: () => Promise<void>
}

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE"
type LevelFilter = "ALL" | "ROOT" | "CHILD"
type GroupFilter = "ALL" | "FRESH" | "NORMAL"

const EMPTY_CATEGORY_FORM: UpsertCategoryPayload = {
    parentCatId: "",
    isFreshFood: false,
    name: "",
    description: "",
    catIconUrl: "",
    isActive: true,
}

const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"

const selectClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"

const inlineInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-900"

const normalizeText = (value?: string | null) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim()

const compareText = (left?: string | null, right?: string | null) =>
    (left ?? "").localeCompare(right ?? "", "vi", {
        sensitivity: "base",
        numeric: true,
    })

const normalizeCategoryPayload = (
    source: UpsertCategoryPayload
): UpsertCategoryPayload => ({
    parentCatId: source.parentCatId?.trim() || undefined,
    isFreshFood: Boolean(source.isFreshFood),
    name: source.name.trim(),
    description: source.description?.trim() || "",
    catIconUrl: source.catIconUrl?.trim() || "",
    isActive: Boolean(source.isActive),
})

const getCategoryStatusLabel = (isActive?: boolean) =>
    isActive ? "Đang hoạt động" : "Ngưng hoạt động"

const getCategoryStatusClass = (isActive?: boolean) =>
    isActive
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"

const getGroupLabel = (isFreshFood?: boolean) =>
    isFreshFood ? "Nhóm tươi sống" : "Nhóm thông thường"

const getGroupClass = (isFreshFood?: boolean) =>
    isFreshFood
        ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
        : "bg-violet-50 text-violet-700 ring-1 ring-violet-200"

const validateCategoryPayload = (payload: UpsertCategoryPayload) => {
    if (!payload.name.trim()) {
        return "Vui lòng nhập tên danh mục"
    }

    return null
}

const AdminSettingsCategories = ({
    loading,
    categories,
    parentCategories,
    onRefresh,
}: Props) => {
    const [newCategory, setNewCategory] =
        useState<UpsertCategoryPayload>(EMPTY_CATEGORY_FORM)

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
    const [editCategory, setEditCategory] =
        useState<UpsertCategoryPayload>(EMPTY_CATEGORY_FORM)

    const [searchKeyword, setSearchKeyword] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
    const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL")
    const [groupFilter, setGroupFilter] = useState<GroupFilter>("ALL")

    const activeCount = useMemo(
        () => categories.filter((item) => item.isActive).length,
        [categories]
    )

    const rootCount = useMemo(
        () => categories.filter((item) => !item.parentCatId).length,
        [categories]
    )

    const freshCount = useMemo(
        () => categories.filter((item) => item.isFreshFood).length,
        [categories]
    )

    const parentOptions = useMemo(
        () => [...parentCategories].sort((a, b) => compareText(a.name, b.name)),
        [parentCategories]
    )

    const parentLookup = useMemo(() => {
        const map = new Map<string, CategoryItem>()
        categories.forEach((item) => map.set(item.categoryId, item))
        return map
    }, [categories])

    const filteredCategories = useMemo(() => {
        const keyword = normalizeText(searchKeyword)

        return [...categories]
            .filter((item) => {
                if (statusFilter === "ACTIVE" && !item.isActive) return false
                if (statusFilter === "INACTIVE" && item.isActive) return false

                if (levelFilter === "ROOT" && item.parentCatId) return false
                if (levelFilter === "CHILD" && !item.parentCatId) return false

                if (groupFilter === "FRESH" && !item.isFreshFood) return false
                if (groupFilter === "NORMAL" && item.isFreshFood) return false

                if (!keyword) return true

                const haystacks = [
                    item.name,
                    item.parentName,
                    item.description,
                    item.catIconUrl,
                ]
                    .map((value) => normalizeText(value))
                    .filter(Boolean)

                return haystacks.some((value) => value.includes(keyword))
            })
            .sort((a, b) => {
                const parentCompare = compareText(
                    a.parentName || "Danh mục gốc",
                    b.parentName || "Danh mục gốc"
                )
                if (parentCompare !== 0) return parentCompare
                return compareText(a.name, b.name)
            })
    }, [categories, searchKeyword, statusFilter, levelFilter, groupFilter])

    const resetEditing = () => {
        setEditingCategoryId(null)
        setEditCategory(EMPTY_CATEGORY_FORM)
    }

    const getParentLabel = (item: CategoryItem) => {
        if (!item.parentCatId) return "Danh mục gốc"
        return item.parentName || parentLookup.get(item.parentCatId)?.name || "--"
    }

    const handleCreateCategory = async () => {
        const payload = normalizeCategoryPayload(newCategory)
        const validationError = validateCategoryPayload(payload)

        if (validationError) {
            showError(validationError)
            return
        }

        try {
            logApiSuccess("handleCreateCategory - request", payload)
            const res = await adminService.createCategory(payload)
            logApiSuccess("handleCreateCategory - response", payload, res)

            showSuccess("Đã tạo danh mục")
            setNewCategory(EMPTY_CATEGORY_FORM)
            await onRefresh()
        } catch (error) {
            logApiError("handleCreateCategory", error, payload)
            showError("Không thể tạo danh mục")
        }
    }

    const handleStartEdit = (item: CategoryItem) => {
        setEditingCategoryId(item.categoryId)
        setEditCategory({
            parentCatId: item.parentCatId ?? "",
            isFreshFood: Boolean(item.isFreshFood),
            name: item.name ?? "",
            description: item.description ?? "",
            catIconUrl: item.catIconUrl ?? "",
            isActive: Boolean(item.isActive),
        })
    }

    const handleUpdateCategory = async (categoryId: string) => {
        const payload = normalizeCategoryPayload(editCategory)
        const validationError = validateCategoryPayload(payload)

        if (validationError) {
            showError(validationError)
            return
        }

        try {
            logApiSuccess("handleUpdateCategory - request", { categoryId, payload })
            const res = await adminService.updateCategory(categoryId, payload)
            logApiSuccess(
                "handleUpdateCategory - response",
                { categoryId, payload },
                res
            )

            showSuccess("Đã cập nhật danh mục")
            resetEditing()
            await onRefresh()
        } catch (error) {
            logApiError("handleUpdateCategory", error, { categoryId, payload })
            showError("Không thể cập nhật danh mục")
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        try {
            logApiSuccess("handleDeleteCategory - request", { categoryId })
            const res = await adminService.deleteCategory(categoryId)
            logApiSuccess("handleDeleteCategory - response", { categoryId }, res)

            showSuccess("Đã xóa danh mục")
            await onRefresh()
        } catch (error) {
            logApiError("handleDeleteCategory", error, { categoryId })
            showError("Không thể xóa danh mục")
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Danh mục</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Quản lý cấu trúc danh mục cha con cho toàn hệ thống.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-500">Tổng số</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {categories.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-500">Đang hoạt động</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {activeCount}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-500">Danh mục gốc</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {rootCount}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-500">Nhóm tươi sống</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                        {freshCount}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                    <Plus size={16} className="text-slate-700" />
                    <h3 className="text-base font-semibold text-slate-900">
                        Tạo danh mục mới
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <input
                        value={newCategory.name ?? ""}
                        onChange={(e) =>
                            setNewCategory((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                        placeholder="Tên danh mục, ví dụ: Rau củ"
                        className={inputClass}
                    />

                    <select
                        value={newCategory.parentCatId ?? ""}
                        onChange={(e) =>
                            setNewCategory((prev) => ({
                                ...prev,
                                parentCatId: e.target.value,
                            }))
                        }
                        className={selectClass}
                    >
                        <option value="">Không có, tạo danh mục gốc</option>
                        {parentOptions.map((item) => (
                            <option key={item.categoryId} value={item.categoryId}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={newCategory.isFreshFood ? "fresh" : "normal"}
                        onChange={(e) =>
                            setNewCategory((prev) => ({
                                ...prev,
                                isFreshFood: e.target.value === "fresh",
                            }))
                        }
                        className={selectClass}
                    >
                        <option value="fresh">Nhóm tươi sống</option>
                        <option value="normal">Nhóm thông thường</option>
                    </select>

                    <select
                        value={newCategory.isActive ? "active" : "inactive"}
                        onChange={(e) =>
                            setNewCategory((prev) => ({
                                ...prev,
                                isActive: e.target.value === "active",
                            }))
                        }
                        className={selectClass}
                    >
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Ngưng hoạt động</option>
                    </select>

                    <div className="md:col-span-2 xl:col-span-2">
                        <input
                            value={newCategory.description ?? ""}
                            onChange={(e) =>
                                setNewCategory((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            placeholder="Mô tả ngắn"
                            className={inputClass}
                        />
                    </div>

                    <input
                        value={newCategory.catIconUrl ?? ""}
                        onChange={(e) =>
                            setNewCategory((prev) => ({
                                ...prev,
                                catIconUrl: e.target.value,
                            }))
                        }
                        placeholder="Đường dẫn ảnh hoặc icon"
                        className={inputClass}
                    />

                    <button
                        onClick={() => void handleCreateCategory()}
                        className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        Tạo danh mục
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Tìm theo tên, mô tả, danh mục cha"
                            className="w-full rounded-2xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-900"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as StatusFilter)
                        }
                        className={selectClass}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="INACTIVE">Ngưng hoạt động</option>
                    </select>

                    <select
                        value={levelFilter}
                        onChange={(e) =>
                            setLevelFilter(e.target.value as LevelFilter)
                        }
                        className={selectClass}
                    >
                        <option value="ALL">Tất cả cấp</option>
                        <option value="ROOT">Danh mục gốc</option>
                        <option value="CHILD">Danh mục con</option>
                    </select>

                    <select
                        value={groupFilter}
                        onChange={(e) =>
                            setGroupFilter(e.target.value as GroupFilter)
                        }
                        className={selectClass}
                    >
                        <option value="ALL">Tất cả loại</option>
                        <option value="FRESH">Nhóm tươi sống</option>
                        <option value="NORMAL">Nhóm thông thường</option>
                    </select>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                    Hiển thị {filteredCategories.length} danh mục
                </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full table-fixed text-sm">
                    <colgroup>
                        <col className="w-[18%]" />
                        <col className="w-[17%]" />
                        <col className="w-[14%]" />
                        <col className="w-[14%]" />
                        <col className="w-[21%]" />
                        <col className="w-[16%]" />
                    </colgroup>

                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Tên danh mục</th>
                            <th className="px-4 py-3 text-left font-medium">Danh mục cha</th>
                            <th className="px-4 py-3 text-left font-medium">Loại</th>
                            <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                            <th className="px-4 py-3 text-left font-medium">Mô tả</th>
                            <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredCategories.map((item) => {
                            const isEditing = editingCategoryId === item.categoryId

                            return (
                                <tr
                                    key={item.categoryId}
                                    className="border-t border-slate-200 align-top"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        {isEditing ? (
                                            <input
                                                value={editCategory.name ?? ""}
                                                onChange={(e) =>
                                                    setEditCategory((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                className={inlineInputClass}
                                            />
                                        ) : (
                                            <div className="min-w-0">
                                                <p className="truncate">{item.name}</p>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-slate-600">
                                        {isEditing ? (
                                            <select
                                                value={editCategory.parentCatId ?? ""}
                                                onChange={(e) =>
                                                    setEditCategory((prev) => ({
                                                        ...prev,
                                                        parentCatId: e.target.value,
                                                    }))
                                                }
                                                className={inlineInputClass}
                                            >
                                                <option value="">Không có, danh mục gốc</option>
                                                {parentOptions
                                                    .filter(
                                                        (parent) =>
                                                            parent.categoryId !==
                                                            item.categoryId
                                                    )
                                                    .map((parent) => (
                                                        <option
                                                            key={parent.categoryId}
                                                            value={parent.categoryId}
                                                        >
                                                            {parent.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        ) : (
                                            <span className="truncate block">
                                                {getParentLabel(item)}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <select
                                                value={
                                                    editCategory.isFreshFood
                                                        ? "fresh"
                                                        : "normal"
                                                }
                                                onChange={(e) =>
                                                    setEditCategory((prev) => ({
                                                        ...prev,
                                                        isFreshFood:
                                                            e.target.value === "fresh",
                                                    }))
                                                }
                                                className={inlineInputClass}
                                            >
                                                <option value="fresh">
                                                    Nhóm tươi sống
                                                </option>
                                                <option value="normal">
                                                    Nhóm thông thường
                                                </option>
                                            </select>
                                        ) : (
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getGroupClass(
                                                    item.isFreshFood
                                                )}`}
                                            >
                                                {getGroupLabel(item.isFreshFood)}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
                                        {isEditing ? (
                                            <select
                                                value={
                                                    editCategory.isActive
                                                        ? "active"
                                                        : "inactive"
                                                }
                                                onChange={(e) =>
                                                    setEditCategory((prev) => ({
                                                        ...prev,
                                                        isActive:
                                                            e.target.value === "active",
                                                    }))
                                                }
                                                className={inlineInputClass}
                                            >
                                                <option value="active">
                                                    Đang hoạt động
                                                </option>
                                                <option value="inactive">
                                                    Ngưng hoạt động
                                                </option>
                                            </select>
                                        ) : (
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getCategoryStatusClass(
                                                    item.isActive
                                                )}`}
                                            >
                                                {getCategoryStatusLabel(item.isActive)}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-slate-500">
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <input
                                                    value={editCategory.description ?? ""}
                                                    onChange={(e) =>
                                                        setEditCategory((prev) => ({
                                                            ...prev,
                                                            description:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Mô tả ngắn"
                                                    className={inlineInputClass}
                                                />
                                                <input
                                                    value={editCategory.catIconUrl ?? ""}
                                                    onChange={(e) =>
                                                        setEditCategory((prev) => ({
                                                            ...prev,
                                                            catIconUrl:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    placeholder="Đường dẫn ảnh hoặc icon"
                                                    className={inlineInputClass}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="line-clamp-2 text-sm text-slate-600">
                                                    {item.description || "--"}
                                                </p>
                                                {item.catIconUrl ? (
                                                    <p className="truncate text-xs text-slate-400">
                                                        {item.catIconUrl}
                                                    </p>
                                                ) : null}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={resetEditing}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <X size={14} />
                                                        Hủy
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            void handleUpdateCategory(
                                                                item.categoryId
                                                            )
                                                        }
                                                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                                    >
                                                        Lưu
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            handleStartEdit(item)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        <Pencil size={14} />
                                                        Sửa
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            void handleDeleteCategory(
                                                                item.categoryId
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} />
                                                        Xóa
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {!loading && filteredCategories.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-10 text-center text-slate-500"
                                >
                                    Chưa có danh mục phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AdminSettingsCategories
