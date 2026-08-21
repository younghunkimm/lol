export const panelClass = "rounded-2xl border border-white/10 bg-[#151a23] p-4 shadow-sm shadow-black/20 md:p-5";
export const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0f141d] px-3.5 py-2.5 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10";
export const buttonClass =
    "rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-300";

export function Button({ className = "", children, ...props }) {
    return (
        <button className={`${buttonClass} ${className}`.trim()} {...props}>
            {children}
        </button>
    );
}

export function DangerButton({ className = "", children, ...props }) {
    return (
        <button
            className={`rounded-xl bg-rose-400/10 px-4 py-2.5 text-sm font-black text-rose-300 transition hover:bg-rose-400/15 ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}

export function TextInput({ className = "", ...props }) {
    return <input className={`${inputClass} ${className}`.trim()} {...props} />;
}

export function Panel({ className = "", children }) {
    return <section className={`${panelClass} ${className}`.trim()}>{children}</section>;
}

export function Alert({ children }) {
    if (!children) {
        return null;
    }

    return (
        <div
            className="mb-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-200"
            role="alert"
        >
            {children}
        </div>
    );
}

export function EmptyState({ children }) {
    return <p className="rounded-2xl bg-white/[0.04] p-5 text-center text-sm font-bold text-slate-400">{children}</p>;
}

