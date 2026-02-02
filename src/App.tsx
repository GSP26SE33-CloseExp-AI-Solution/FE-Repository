import React from "react";
import AppRouter from "./routes/AppRouter";
import { Toaster } from "react-hot-toast";
import "@/styles/theme.css";

const App: React.FC = () => {
  return (<>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "12px",
          background: "#333",
          color: "#fff",
          fontSize: "14px",
        },
      }}
    />
    <AppRouter />
  </>
  );
};

export default App;
