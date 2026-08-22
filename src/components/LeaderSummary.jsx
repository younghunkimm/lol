export function LeaderSummary({ leaders }) {
    return (
        <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
            {leaders.map((leader) => {
                const isPositive = leader.positive;

                return (
                    <article
                        className={`flex flex-col justify-between items-start gap-2 rounded-2xl border p-3 shadow-sm shadow-black/20 sm:p-4 ${leader.borderColor} ${leader.bgColor}`}
                        key={leader.label}
                    >
                        <span
                            className={`block text-[11px] font-extrabold sm:text-xs ${leader.textColor}`}
                        >
                            {leader.label}
                        </span>
                        <strong className="block w-full text-lg font-black leading-tight text-slate-50 sm:text-xl">
                            {Array.isArray(leader.value)
                                ? leader.value.map((name) => (
                                      <span
                                          className="block truncate"
                                          key={name}
                                      >
                                          {name}
                                      </span>
                                  ))
                                : leader.value}
                        </strong>
                        <em
                            className={`inline-flex rounded-full px-2.5 py-1 text-sm font-black not-italic ${leader.borderColor} ${leader.bgColor}`}
                        >
                            {leader.metric}
                        </em>
                    </article>
                );
            })}
        </section>
    );
}
