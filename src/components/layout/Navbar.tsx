export const Navbar = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-6 flex flex-col gap-1.5">
    <h1 className="text-2xl font-bold tracking-tight text-[#1e3a5f] md:text-[1.75rem]">{title}</h1>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
);
