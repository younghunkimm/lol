import { useMemo } from "react";
import { LayoutGroup, motion, useIsPresent, useReducedMotion } from "motion/react";
import {
    formatSignedMoney,
    getName,
    getSignedMoneyClass,
} from "../../lib/utils";
import { AnimatedNumber } from "../shared/motion";
import {
    INHOUSE_TEAM,
    INHOUSE_TEAM_LABELS,
    INHOUSE_TEAM_MEMBER_KEYS,
} from "../../constants";

const teams = [
    {
        team: INHOUSE_TEAM.A,
        className: "border-indigo-400/25 bg-indigo-400/10 text-indigo-100",
        chipClassName: "border-indigo-400/20 bg-indigo-400/10",
    },
    {
        team: INHOUSE_TEAM.B,
        className: "border-lime-400/25 bg-lime-400/10 text-lime-100",
        chipClassName: "border-lime-400/20 bg-lime-400/10",
    },
];

function TeamSettlementCard({ team, ids, className, chipClassName, row, animate, friends }) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <strong className="block text-base font-black">
                        {INHOUSE_TEAM_LABELS[team]}
                    </strong>
                    <span className="mt-0.5 block text-xs font-bold text-slate-300">
                        <span className="text-cyan-300">
                            {row?.wins ?? 0}승
                        </span>{" "}
                        <span className="text-rose-300">
                            {row?.losses ?? 0}패
                        </span>
                    </span>
                </div>
                <div className="text-right">
                    <strong
                        className={`block text-base font-black ${getSignedMoneyClass(row?.net ?? 0)}`}
                    >
                        <AnimatedNumber
                            animateInitial
                            enabled={animate}
                            format={formatSignedMoney}
                            value={row?.net ?? 0}
                        />
                    </strong>
                    <span className="mt-0.5 block text-xs font-bold text-slate-400">
                        인당{" "}
                        <AnimatedNumber
                            animateInitial
                            enabled={animate}
                            format={formatSignedMoney}
                            value={Math.round((row?.net ?? 0) / ids.length)}
                        />
                    </span>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
                {ids.map((id) => (
                    <span
                        className={`rounded-full border px-2.5 py-1 text-sm font-bold ${chipClassName}`}
                        key={id}
                    >
                        {getName(friends, id)}
                    </span>
                ))}
            </div>
        </>
    );

    if (!animate) {
        return <section className={`rounded-xl border p-3 ${className}`}>{content}</section>;
    }

    return (
        <motion.section
            className={`rounded-xl border p-3 ${className}`}
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
        </motion.section>
    );
}

export function InhouseSettlementPanel({ rows, ready, session, friends }) {
    const isPresent = useIsPresent();
    const reducedMotion = useReducedMotion();
    const animate = ready && !reducedMotion && isPresent;
    const sortedTeams = useMemo(
        () =>
            teams
                .map((team) => ({
                    ...team,
                    ids: session[INHOUSE_TEAM_MEMBER_KEYS[team.team]],
                    row: rows.find((item) => item.team === team.team),
                }))
                .sort(
                    (a, b) =>
                        (b.row?.net ?? 0) - (a.row?.net ?? 0) ||
                        a.team.localeCompare(b.team),
                ),
        [rows, session],
    );

    return (
        <div className="grid content-start gap-3 rounded-2xl border border-white/10 bg-[#151a23] p-4">
            <h3 className="text-lg font-black">자동 정산</h3>
            {animate ? (
                <LayoutGroup>
                    <div className="grid gap-2">
                        {sortedTeams.map((team) => (
                            <TeamSettlementCard
                                animate
                                friends={friends}
                                key={team.team}
                                {...team}
                            />
                        ))}
                    </div>
                </LayoutGroup>
            ) : (
                <div className="grid gap-2">
                    {sortedTeams.map((team) => (
                        <TeamSettlementCard
                            animate={false}
                            friends={friends}
                            key={team.team}
                            {...team}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
