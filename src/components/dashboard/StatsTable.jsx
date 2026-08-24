import { formatSignedMoney, getNetClass, getWinRateClass } from "../../lib/utils";
import { LayoutGroup, motion, useIsPresent, useReducedMotion } from "motion/react";
import { AnimatedNumber } from "../shared/motion";
import { CardHeader, EmptyState, Panel } from "../shared/ui";

const rankStyles = [
    "border-amber-300/30 bg-amber-300/15 text-amber-200",
    "border-slate-300/25 bg-slate-300/10 text-slate-200",
    "border-orange-400/25 bg-orange-400/10 text-orange-200",
];

function RankBadge({ rank }) {
    const isRanked = Number.isInteger(rank);
    const isPodium = isRanked && rank <= 3;

    return (
        <span
            aria-label={isRanked ? `${rank}위` : "순위 없음"}
            className={`grid size-9 shrink-0 place-items-center rounded-xl border text-sm font-black tabular-nums ${
                isPodium
                    ? rankStyles[rank - 1]
                    : "border-white/10 bg-white/[0.04] text-slate-400"
            }`}
        >
            {isRanked ? rank : "-"}
        </span>
    );
}

const rankingRowClass =
    "grid grid-cols-[auto_minmax(0,1fr)_minmax(0,7rem)] items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.035] p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-4";

function RankingRow({ row, rank, animate, layoutDependency }) {
    const totalGames = row.totalGames ?? row.wins + row.losses;
    const content = (
        <>
            <RankBadge rank={totalGames ? rank : null} />
            <div className="min-w-0">
                <strong className="block truncate text-sm font-black text-slate-100 sm:text-base">
                    {row.name}
                </strong>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-slate-400">
                    <span className="text-cyan-300">{row.wins}승</span>
                    <span className="text-rose-300">{row.losses}패</span>
                </span>
            </div>
            <div className="min-w-0 text-right">
                <strong
                    className={`block break-all text-base font-black tabular-nums sm:text-lg ${getNetClass(row.net)}`}
                >
                    <AnimatedNumber
                        animateInitial
                        format={formatSignedMoney}
                        value={row.net}
                    />
                </strong>
                <span className="mt-1 block text-xs font-black text-slate-500">
                    승률 {" "}
                    <span className={getWinRateClass(row.winRate)}>
                        <AnimatedNumber
                            animateInitial
                            format={(value) => `${value}%`}
                            value={row.winRate}
                        />
                    </span>
                </span>
            </div>
        </>
    );

    if (!animate) {
        return <div className={rankingRowClass}>{content}</div>;
    }

    return (
        <motion.div
            className={rankingRowClass}
            layout="position"
            layoutDependency={layoutDependency}
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

function RankingList({ stats }) {
    const isPresent = useIsPresent();
    const reducedMotion = useReducedMotion();
    const animate = !reducedMotion && isPresent;
    const layoutDependency = stats.map((row) => row.id).join("|");
    const rows = stats.map((row, index) => (
        <RankingRow
            animate={animate}
            key={row.id}
            layoutDependency={layoutDependency}
            rank={index + 1}
            row={row}
        />
    ));

    return animate ? <LayoutGroup>{rows}</LayoutGroup> : rows;
}

export function StatsTable({ stats }) {
    return (
        <Panel>
            <CardHeader
                className="mb-4"
                meta={
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-black text-slate-300">
                        전체 세션 기준
                    </span>
                }
                title="게임 랭킹"
            />
            {stats.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                    <RankingList stats={stats} />
                </div>
            ) : (
                <EmptyState>프로게이머를 추가하면 랭킹이 표시됩니다.</EmptyState>
            )}
        </Panel>
    );
}
