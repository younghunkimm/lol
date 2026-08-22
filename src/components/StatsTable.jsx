import { formatMoney, getNetClass, getWinRateClass } from "../utils";
import { AnimatedList, AnimatedNumber } from "./motion";
import { EmptyState, Panel } from "./ui";

export function StatsTable({ stats }) {
    return (
        <Panel>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight">
                    개인별 승률
                </h2>
                <span className="text-sm font-extrabold text-slate-400">
                    전체 세션 기준
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-xs font-black text-slate-300">
                            <th className="px-3 py-3">프로게이머</th>
                            <th className="px-3 py-3">손익</th>
                            <th className="px-3 py-3">승률</th>
                            <th className="px-3 py-3">승</th>
                            <th className="px-3 py-3">패</th>
                            <th className="px-3 py-3">손해</th>
                            <th className="px-3 py-3">이득</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatedList
                            as="tr"
                            className={(_, index) =>
                                `border-b border-white/5 text-sm font-bold text-slate-300 ${
                                    index % 2 === 0
                                        ? "bg-[#151a23]"
                                        : "bg-white/[0.03]"
                                }`
                            }
                            getKey={(row) => row.id}
                            items={stats}
                            renderItem={(row) => (
                                <>
                                <td className="px-3 py-3">{row.name}</td>
                                <td
                                    className={`px-3 py-3 font-black ${getNetClass(row.net)}`}
                                >
                                    <AnimatedNumber
                                        format={formatMoney}
                                        value={row.net}
                                    />
                                </td>
                                <td
                                    className={`px-3 py-3 font-black ${getWinRateClass(row.winRate)}`}
                                >
                                    <AnimatedNumber
                                        format={(value) => `${value}%`}
                                        value={row.winRate}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <AnimatedNumber
                                        format={String}
                                        value={row.wins}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <AnimatedNumber
                                        format={String}
                                        value={row.losses}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <AnimatedNumber
                                        format={formatMoney}
                                        value={row.paid}
                                    />
                                </td>
                                <td className="px-3 py-3">
                                    <AnimatedNumber
                                        format={formatMoney}
                                        value={row.received}
                                    />
                                </td>
                                </>
                            )}
                        />
                    </tbody>
                </table>
                {!stats.length && (
                    <EmptyState>
                        프로게이머를 추가하면 통계가 표시됩니다.
                    </EmptyState>
                )}
            </div>
        </Panel>
    );
}
