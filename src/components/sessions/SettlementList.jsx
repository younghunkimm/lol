import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { formatSignedMoney, getSignedMoneyClass } from "../../lib/utils";
import { AnimatedNumber } from "../shared/motion";

const rowClassName =
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5";

function SettlementRow({ row, animate }) {
    const content = (
        <>
            <div className="min-w-0">
                <span className="block truncate text-sm font-extrabold text-slate-200">
                    {row.name}
                </span>
                <span className="mt-0.5 block text-xs font-bold text-slate-400">
                    <span className="text-cyan-300">{row.wins}승</span>{" "}
                    <span className="text-rose-300">{row.losses}패</span>
                </span>
            </div>
            <strong
                className={`text-base font-black ${getSignedMoneyClass(row.net)}`}
            >
                <AnimatedNumber
                    animateInitial
                    enabled={animate}
                    format={formatSignedMoney}
                    value={row.net}
                />
            </strong>
        </>
    );

    if (!animate) {
        return <div className={rowClassName}>{content}</div>;
    }

    return (
        <motion.div
            className={rowClassName}
            layout="position"
            transition={{
                layout: {
                    type: "spring",
                    stiffness: 420,
                    damping: 30,
                    mass: 0.7,
                },
            }}
        >
            {content}
        </motion.div>
    );
}

export function SettlementList({ rows, ready }) {
    const reducedMotion = useReducedMotion();
    const animate = ready && !reducedMotion;

    const rowElements = rows.map((row) => (
        <SettlementRow animate={animate} key={row.id} row={row} />
    ));

    return animate ? <LayoutGroup>{rowElements}</LayoutGroup> : rowElements;
}
