import React from "react"
import { useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuthContext()

  const handleLogout = async () => {
    console.log("🖱️ [UI] Logout button clicked")
    await logout()
  }

  const goToLogin = () => {
    console.log("➡️ [UI] Go to login page")
    navigate("/login")
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p className="text-gray-600">
        Welcome to Close Expired Products Platform
      </p>

      <div className="flex gap-3">
        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg
                     hover:bg-red-600 transition"
        >
          Logout
        </button>

        {/* GO TO LOGIN */}
        <button
          onClick={goToLogin}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg
                     hover:bg-gray-300 transition"
        >
          Đi tới Login
        </button>
      </div>
    </div>
  )
}

export default Home
