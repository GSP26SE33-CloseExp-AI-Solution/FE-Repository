import { useCallback } from "react"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import type { Engine } from "tsparticles-engine"

type UICommonBackgroundProps = {
    className?: string
}

const UICommonBackground: React.FC<UICommonBackgroundProps> = ({ className = "" }) => {
    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine)
    }, [])

    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),radial-gradient(circle_at_bottom,rgba(148,163,184,0.08),transparent_26%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#111827_100%)]" />

            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_28%,rgba(255,255,255,0.02))]" />

            <Particles
                init={particlesInit}
                className="absolute inset-0"
                options={{
                    fullScreen: { enable: false },
                    background: { color: "transparent" },
                    fpsLimit: 60,
                    detectRetina: true,
                    particles: {
                        number: {
                            value: 150,
                            density: {
                                enable: true,
                                area: 1000,
                            },
                        },
                        color: {
                            value: ["#e2e8f0", "#cbd5e1", "#94a3b8"],
                        },
                        opacity: {
                            value: { min: 0.08, max: 0.18 },
                        },
                        size: {
                            value: { min: 1, max: 2.8 },
                        },
                        links: {
                            enable: true,
                            distance: 155,
                            color: "#94a3b8",
                            opacity: 0.08,
                            width: 1,
                        },
                        move: {
                            enable: true,
                            speed: 0.7,
                            direction: "none",
                            random: false,
                            straight: false,
                            outModes: {
                                default: "out",
                            },
                        },
                    },
                    interactivity: {
                        events: {
                            onHover: {
                                enable: true,
                                mode: "grab",
                            },
                            resize: true,
                        },
                        modes: {
                            grab: {
                                distance: 140,
                                links: {
                                    opacity: 0.16,
                                },
                            },
                        },
                    },
                }}
            />
        </div>
    )
}

export default UICommonBackground
