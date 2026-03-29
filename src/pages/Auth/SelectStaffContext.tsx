import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { useAuthContext } from "@/contexts/AuthContext"
import { selectStaffContextApi } from "@/services/auth.service"
import { showError, showSuccess } from "@/utils/toast"
import Logo from "@/assets/logo.png"

/**
 * Shared login: nhiều mã nhân viên trên cùng tài khoản — nhập mã để cấp JWT có supermarket_staff_id.
 */
const SelectStaffContext = () => {
    const navigate = useNavigate()
    const { loginSuccess } = useAuthContext()
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) {
            showError("Vui lòng nhập mã nhân viên")
            return
        }
        setLoading(true)
        try {
            const session = await selectStaffContextApi(code.trim())
            loginSuccess(session)
            showSuccess("Đã xác nhận mã nhân viên")
            navigate("/redirect", { replace: true })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Thất bại"
            showError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="eco-animated-bg min-h-screen flex items-center justify-center px-4 py-10">
            <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 space-y-6 border border-white/40">
                <div className="text-center space-y-2">
                    <img src={Logo} alt="CloseExp AI" className="w-14 h-14 mx-auto" />
                    <h1 className="text-xl font-bold text-gray-800">Chọn mã nhân viên</h1>
                    <p className="text-sm text-gray-500">
                        Tài khoản này có nhiều mã làm việc. Nhập mã được quản lý cấp để tiếp tục.
                    </p>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">Mã nhân viên</label>
                        <input
                            type="password"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-green-400 outline-none"
                            placeholder="Nhập mã"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                Đang xác nhận…
                            </span>
                        ) : (
                            "Tiếp tục"
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default SelectStaffContext
