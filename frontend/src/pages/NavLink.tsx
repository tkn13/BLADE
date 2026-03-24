import { NavLink } from "react-router";
import { useAuth } from "../hook/useAuth";
import { Home, Server, ListChecks, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export function SideNavLink() {
    const { logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const navItem = [
        { to: "/", id: "home", label: "Home", icon: <Home className="w-5 h-5 mr-2" /> },
        { to: "/node", id: "node", label: "Node", icon: <Server className="w-5 h-5 mr-2" /> },
        { to: "/job", id: "job", label: "Job", icon: <ListChecks className="w-5 h-5 mr-2" /> },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed left-4 top-4 z-40 inline-flex items-center justify-center rounded-lg border border-white/20 bg-slate-900/90 p-2 text-slate-100 backdrop-blur lg:hidden"
                aria-label={isOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={isOpen}
                aria-controls="side-navigation"
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {isOpen ? (
                <button
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close navigation overlay"
                />
            ) : null}

            <nav
                id="side-navigation"
                className={`fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-white/10 bg-slate-950 p-4 text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
                style={{ fontFamily: '"Sora", "Poppins", "Trebuchet MS", sans-serif' }}
            >
                <div className="mb-6 flex items-center gap-3">
                    <img src="/logo.svg" alt="Blade logo" className="h-9 w-9 rounded-md object-contain" />
                    <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">Blade compute</div>
                        <div className="text-xl font-bold text-slate-100">Dashboard</div>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                    {navItem.map((item) => (
                        <NavLink
                            key={item.id}
                            to={item.to}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 rounded-lg transition-colors duration-150 text-sm font-medium gap-2
                                ${isActive ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30" : "text-slate-300 hover:bg-white/5 hover:text-cyan-300 border border-transparent"}`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </div>
                <button
                    onClick={logout}
                    className="mt-8 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-2 font-semibold text-rose-300 transition-colors duration-150 hover:bg-rose-500/20"
                >
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </button>
            </nav>
        </>
    );
}