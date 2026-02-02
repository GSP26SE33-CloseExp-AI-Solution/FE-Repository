import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import { useCallback } from "react";

export default function AnimatedBackground() {
    const particlesInit = useCallback(async (engine: any) => {
        await loadSlim(engine);
    }, []);

    return (
        <Particles
            init={particlesInit}
            options={{
                fullScreen: { enable: false },
                background: { color: "transparent" },
                fpsLimit: 60,
                particles: {
                    number: { value: 55, density: { enable: true, area: 800 } },
                    color: { value: "#34d399" }, // emerald pastel
                    opacity: { value: 0.35 },
                    size: { value: { min: 2, max: 4 } },
                    links: {
                        enable: true,
                        distance: 140,
                        color: "#6ee7b7",
                        opacity: 0.2,
                        width: 1,
                    },
                    move: {
                        enable: true,
                        speed: 1.2, // tăng tốc để thấy chuyển động
                        direction: "none",
                        random: false,
                        straight: false,
                        outModes: { default: "out" },
                    },
                },
                interactivity: {
                    events: {
                        onHover: { enable: true, mode: "grab" },
                    },
                    modes: {
                        grab: { distance: 160, links: { opacity: 0.4 } },
                    },
                },
                detectRetina: true,
            }}
            className="absolute inset-0 -z-10"
        />
    );
}
