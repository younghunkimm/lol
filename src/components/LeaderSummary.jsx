export function LeaderSummary({ leaders }) {
    return (
        <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            {leaders.map((leader) => {
                const isPositive = leader.label === "최다 승자" || leader.label === "최다 수령자";

                return (
                    <article
                        className={`rounded-2xl border p-3 shadow-sm shadow-black/20 sm:p-4 ${
                            isPositive ? "border-cyan-400/20 bg-cyan-400/10" : "border-violet-400/20 bg-violet-400/10"
                        }`}
                        key={leader.label}
                    >
                        <span className={`block text-[11px] font-extrabold sm:text-xs ${isPositive ? "text-cyan-300" : "text-violet-300"}`}>
                            {leader.label}
                        </span>
                        <strong className="mt-1 block truncate text-lg font-black text-slate-50 sm:text-xl">
                            {leader.value}
                        </strong>
                        <em
                            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-sm font-black not-italic ${
                                isPositive ? "bg-cyan-400/15 text-cyan-100" : "bg-violet-400/15 text-violet-100"
                            }`}
                        >
                            {leader.metric}
                        </em>
                    </article>
                );
            })}
        </section>
    );
}

