import { ShoppingCart } from "lucide-react"

type Props = {
    cartCount: number
    onViewCart: () => void
}

const HomeMobileCartBar = ({ cartCount, onViewCart }: Props) => {
    return (
        <section className="md:hidden">
            <div className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex-1 text-[12px] font-medium text-slate-600">
                    Giỏ hàng hiện có <span className="font-bold text-slate-900">{cartCount}</span> sản phẩm
                </div>
                <button
                    type="button"
                    onClick={onViewCart}
                    className="relative grid h-9 w-9 place-items-center rounded-[16px] border border-slate-200 bg-white"
                    aria-label="Giỏ hàng"
                >
                    <ShoppingCart className="text-slate-800" size={16} />
                    <span className="absolute -right-2 -top-2 rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        {cartCount}
                    </span>
                </button>
            </div>
        </section>
    )
}

export default HomeMobileCartBar
