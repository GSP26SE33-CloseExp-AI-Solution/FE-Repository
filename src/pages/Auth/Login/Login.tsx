import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import Logo from "@/assets/logo.png";

const Login = () => {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const session = await login(email, password);
            if (!session) return;

            showSuccess("Chào mừng bạn quay lại!");

            setTimeout(() => {
                navigate("/supermarket/dashboard", { replace: true });
            }, 500);

        } catch {
        }
    };

    return (
        <div className="eco-animated-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

            {/* Ánh sáng AI phía sau */}
            <div className="bg-glow" />

            {/* Card đăng nhập */}
            <div className="relative z-10 w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl rounded-2xl p-8 space-y-6 border border-white/40 animate-[fadeInUp_0.6s_ease-out]">

                <div className="text-center space-y-2">
                    <img src={Logo} alt="CloseExp AI" className="w-14 h-14 mx-auto transition duration-300 hover:scale-105" />
                    <h1 className="text-2xl font-bold text-gray-800">
                        Nền tảng CloseExp AI
                    </h1>
                    <p className="text-sm text-gray-500">
                        Quản lý thông minh, mua sắm tiện lợi
                    </p>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">

                    {/* Email */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="toilaban@email.com"
                                className="w-full mt-1 pl-9 pr-4 py-2 border rounded-lg
                                focus:ring-2 focus:ring-green-300 focus:border-green-400
                                focus:shadow-[0_0_0_4px_rgba(34,197,94,0.15)]
                                transition-all duration-200 outline-none"
                            />
                        </div>
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label className="text-sm font-medium text-gray-600">Mật khẩu</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full mt-1 pl-9 pr-10 py-2 border rounded-lg
                                focus:ring-2 focus:ring-green-300 focus:border-green-400
                                focus:shadow-[0_0_0_4px_rgba(34,197,94,0.15)]
                                transition-all duration-200 outline-none"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-gradient-to-r from-green-400 to-emerald-500
                            hover:from-green-500 hover:to-emerald-600
                            text-white font-semibold py-2.5 rounded-lg shadow-md
                            transition-all duration-300 active:scale-95 disabled:opacity-60
                            ${loading ? "btn-shimmer" : ""}`}
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="w-full border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
                    >
                        Tạo tài khoản mới
                    </button>
                </form>

                <p className="text-xs text-center text-gray-400">
                    © {new Date().getFullYear()} CloseExp AI Việt Nam
                </p>
            </div>
        </div>
    );
};

export default Login;
