import { useState, useEffect } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"

import { useAuth } from "@/hooks/useAuth"
import { useAuthContext } from "@/contexts/AuthContext"
import { showError, showSuccess } from "@/utils/toast"
import Logo from "@/assets/logo.png"

const Login = () => {
    const { login, googleLogin, loading } = useAuth()
    const { user, initialized } = useAuthContext()
    const navigate = useNavigate()
    const location = useLocation()
    const redirectTo = location.state?.redirectTo || "/redirect"

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (initialized && user) {
            navigate(redirectTo, { replace: true })
        }
    }, [initialized, user, navigate, redirectTo])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (!email.trim() || !password.trim()) {
            showError("Vui lòng nhập đầy đủ email và mật khẩu")
            return
        }

        try {
            await login(email.trim(), password)
            showSuccess("Đăng nhập thành công")
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Đăng nhập thất bại"
            showError(message)
        }
    }

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (loading) return

        const idToken = credentialResponse.credential

        if (!idToken) {
            showError("Không lấy được thông tin đăng nhập từ Google")
            return
        }

        try {
            await googleLogin({ idToken })
            showSuccess("Đăng nhập Google thành công")
        } catch (error) {
            console.error("google login error", error)
            const message =
                error instanceof Error ? error.message : "Đăng nhập Google thất bại"
            showError(message)
        }
    }

    const handleGoogleError = () => {
        showError("Đăng nhập Google thất bại")
    }

    return (
        <div className="eco-animated-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
            <div className="bg-glow" />

            <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 space-y-6 border border-white/40 animate-[fadeInUp_0.6s_ease-out]">
                <div className="text-center">
                    <Link
                        to="/"
                        className="group inline-flex flex-col items-center"
                    >
                        <div className="mx-auto h-20 w-28 overflow-hidden">
                            <img
                                src={Logo}
                                alt="CloseExp AI"
                                className="h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                            />
                        </div>

                        <h1 className="mt-2 text-2xl font-bold text-gray-800 transition-all duration-300 group-hover:text-emerald-600 group-hover:drop-shadow-[0_2px_10px_rgba(16,185,129,0.18)]">
                            Nền tảng CloseExp AI
                        </h1>

                        <p className="mt-1 text-sm text-gray-500 transition-all duration-300 group-hover:text-gray-600">
                            Quản lý thông minh, mua sắm tiện lợi
                        </p>
                    </Link>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Email
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                placeholder="banlatoi@email.com"
                                className="w-full mt-1 pl-9 pr-4 py-2 border rounded-lg
                                           focus:ring-2 focus:ring-green-300
                                           focus:border-green-400 outline-none transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">
                            Mật khẩu
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={16}
                            />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="w-full mt-1 pl-9 pr-10 py-2 border rounded-lg
                                           focus:ring-2 focus:ring-green-300
                                           focus:border-green-400 outline-none transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
                        >
                            Quên mật khẩu?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-500
                                   text-white font-semibold py-2.5 rounded-lg shadow-md
                                   transition-all duration-300 active:scale-95
                                   disabled:opacity-70"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                Đang đăng nhập...
                            </span>
                        ) : (
                            "Đăng nhập"
                        )}
                    </button>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap={false}
                            theme="outline"
                            size="large"
                            text="signin_with"
                            shape="pill"
                            width="320"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        disabled={loading}
                        className="w-full border border-gray-200 text-gray-600
                                   font-medium py-2.5 rounded-lg hover:bg-gray-50
                                   transition disabled:opacity-50"
                    >
                        Tạo tài khoản mới
                    </button>
                </form>

                <p className="text-xs text-center text-gray-400">
                    © {new Date().getFullYear()} CloseExp AI Việt Nam
                </p>
            </div>
        </div>
    )
}

export default Login
