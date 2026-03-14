import React from "react"

const PackageFooter: React.FC = () => {
    return (
        <footer className="w-full mt-auto border-t border-white/40 bg-white/60 backdrop-blur-xl text-xs text-gray-500">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
                <p>
                    © {new Date().getFullYear()} CloseExp AI Việt Nam — Trung tâm đóng gói và điều phối
                </p>

                <div className="flex items-center gap-5">
                    <a href="#" className="hover:text-green-600 transition">
                        Điều khoản
                    </a>
                    <a href="#" className="hover:text-green-600 transition">
                        Chính sách
                    </a>
                    <a href="#" className="hover:text-green-600 transition">
                        Trung tâm trợ giúp
                    </a>
                </div>
            </div>
        </footer>
    )
}

export default PackageFooter
