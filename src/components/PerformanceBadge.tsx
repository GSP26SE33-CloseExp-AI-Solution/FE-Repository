interface PerformanceBadgeProps {
    value: number; // 0 -> 1 hoặc 0 -> 100
}

const getColor = (percent: number) => {
    if (percent >= 80) {
        return {
            bg: "bg-[rgba(46,204,113,0.2)]",
            text: "text-[rgba(46,204,113,0.8)]",
            label: "A",
        };
    }
    if (percent >= 60) {
        return {
            bg: "bg-[rgba(243,156,18,0.2)]",
            text: "text-[rgba(243,156,18,0.8)]",
            label: "B",
        };
    }
    if (percent >= 40) {
        return {
            bg: "bg-[rgba(241,196,15,0.2)]",
            text: "text-[rgba(241,196,15,0.8)]",
            label: "C",
        };
    }
    return {
        bg: "bg-[rgba(231,76,60,0.2)]",
        text: "text-[rgba(231,76,60,0.8)]",
        label: "D",
    };
};

const PerformanceBadge: React.FC<PerformanceBadgeProps> = ({ value }) => {
    const percent = value <= 1 ? Math.round(value * 100) : Math.round(value);
    const color = getColor(percent);

    return (
        <div
            className={`inline-flex items-center justify-center px-4 h-10 rounded-full ${color.bg}`}
        >
            <span className={`text-[20px] font-medium ${color.text}`}>
                {color.label} {percent}%
            </span>
        </div>
    );
};

export default PerformanceBadge;
