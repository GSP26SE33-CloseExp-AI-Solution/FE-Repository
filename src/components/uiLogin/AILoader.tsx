import { motion } from "framer-motion";

export default function AILoader() {
    return (
        <div className="flex items-center justify-center">
            <motion.div
                className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
        </div>
    );
}
