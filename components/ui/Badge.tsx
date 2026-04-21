type Variant = "red" | "yellow" | "green" | "gray";

const variantClass: Record<Variant, string> = {
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
  gray: "bg-gray-100 text-gray-600",
};

export function Badge({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClass[variant]}`}
    >
      {children}
    </span>
  );
}
