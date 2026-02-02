import { useState } from "react";

export default function RippleButton({ children, ...props }: any) {
    const [ripples, setRipples] = useState<any[]>([]);

    const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const size = rect.width;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple = { x, y, size, id: Date.now() };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
    };

    return (
        <button
            {...props}
            onClick={(e) => {
                addRipple(e);
                props.onClick?.(e);
            }}
            className="relative overflow-hidden"
        >
            {ripples.map((r) => (
                <span
                    key={r.id}
                    className="absolute bg-white/40 rounded-full animate-ping"
                    style={{
                        width: r.size,
                        height: r.size,
                        top: r.y,
                        left: r.x,
                    }}
                />
            ))}
            {children}
        </button>
    );
}
