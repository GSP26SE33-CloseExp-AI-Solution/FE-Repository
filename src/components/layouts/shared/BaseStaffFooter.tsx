type FooterAction = {
    label: string
    href?: string
}

type BaseStaffFooterProps = {
    description: string
    actions?: FooterAction[]
}

const BaseStaffFooter = ({
    description,
    actions = [],
}: BaseStaffFooterProps) => {
    return (
        <footer className="w-full mt-auto border-t border-white/40 bg-white/60 backdrop-blur-xl text-xs text-gray-500">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
                <p>
                    © {new Date().getFullYear()} CloseExp AI Việt Nam — {description}
                </p>

                <div className="flex items-center gap-5">
                    {actions.map((item) => (
                        <a
                            key={item.label}
                            href={item.href ?? "#"}
                            className="hover:text-green-600 transition"
                        >
                            {item.label}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    )
}

export default BaseStaffFooter
