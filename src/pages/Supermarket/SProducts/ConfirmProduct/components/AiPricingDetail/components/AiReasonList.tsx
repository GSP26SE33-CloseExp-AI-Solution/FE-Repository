interface Props {
    reasons: string[];
}

const AiReasonList: React.FC<Props> = ({ reasons }) => {
    return (
        <ul className="space-y-2 text-sm">
            {reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                    <span>✅</span>
                    <span>{r}</span>
                </li>
            ))}
        </ul>
    );
};

export default AiReasonList;
