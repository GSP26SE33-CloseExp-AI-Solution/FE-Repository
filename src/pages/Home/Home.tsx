import React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Home Page</h1>
      <p className="text-gray-600 mt-2">
        Welcome to Close Expired Products Platform
      </p>

      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  )
}

export default Home
