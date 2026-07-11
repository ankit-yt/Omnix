interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  delay?: number;
  mounted?: boolean;
}

// Shared spring curve — overshoots then settles, feels bouncy not floaty
export const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export const FormInput = ({ label, id, name, delay = 0, mounted = true, ...rest }: FormInputProps) => (
  <div
    style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0px) scale(1)" : "translateY(20px) scale(0.95)",
      transitionProperty: "opacity, transform",
      transitionDuration: "550ms",
      transitionTimingFunction: SPRING,
      transitionDelay: `${delay}ms`,
    }}
    className="space-y-1.5"
  >
    <label htmlFor={id} className="text-xs font-medium text-white/70">
      {label}
    </label>
    <input
      id={id}
      name={name}
      className="h-12 w-full rounded-2xl bg-white/5 px-5 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:bg-white/10 focus:ring-1 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      {...rest}
    />
  </div>
);
