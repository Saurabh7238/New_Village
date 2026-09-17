import Link from "next/link";

const variants = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-300",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
  quiet: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
};

const baseClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60";

export default function Button({ children, variant = "primary", className = "", href, ...props }) {
  const classes = `${baseClass} ${variants[variant] || variants.primary} ${className}`;
  if (href) return <Link href={href} className={classes} {...props}>{children}</Link>;
  return <button className={classes} {...props}>{children}</button>;
}
