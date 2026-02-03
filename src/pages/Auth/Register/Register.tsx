import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { Eye, EyeOff, User, Mail, Phone, Lock, Loader2 } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { showSuccess, showError } from "@/utils/toast"
import { isAuthenticated } from "@/utils/authStorage"
import { getRedirectByRole } from "@/utils/roleRedirect"

import Logo from "@/assets/logo.png"

const Register = () => {
    const navigate = useNavigate()
    const { register, loading } = useAuth()

    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    if (isAuthenticated()) {
        return <Navigate to="/" replace />
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        try {
            const session = await register({
                fullName,
                email,
                phone,
                password,
            })

            if (!session) return

            console.log("✅ REGISTER SESSION:", session)

            showSuccess("Đăng ký thành công!")

            const path = getRedirectByRole(session.user.roleId)

            navigate(path, { replace: true })
        } catch (err: any) {
            showError(err?.message || "Đăng ký thất bại")
        }
    }

    return (
        <div className="eco-animated-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <div className="bg-glow" />

            <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 space-y-6 border border-white/40">

                <div className="text-center space-y-2">
                    <img src={Logo} alt="CloseExp AI" className="w-14 h-14 mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản</h1>
                    <p className="text-sm text-gray-500">Tham gia hệ thống CloseExp AI</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">

                    <Input icon={<User size={16} />} label="Họ và tên" value={fullName} setValue={setFullName} />
                    <Input icon={<Mail size={16} />} label="Email" type="email" value={email} setValue={setEmail} />
                    <Input icon={<Phone size={16} />} label="Số điện thoại" value={phone} setValue={setPhone} />

                    <div>
                        <label className="text-sm font-medium text-gray-600">Mật khẩu</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full mt-1 pl-9 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold py-2.5 rounded-lg"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                Đang xử lý...
                            </span>
                        ) : "Đăng ký"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50"
                    >
                        Quay lại đăng nhập
                    </button>
                </form>
            </div>
        </div>
    )
}

const Input = ({ icon, label, type = "text", value, setValue }: any) => (
    <div>
        <label className="text-sm font-medium text-gray-600">{label}</label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
            <input
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full mt-1 pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300"
            />
        </div>
    </div>
)

export default Register;
