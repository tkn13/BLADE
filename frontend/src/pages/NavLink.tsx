import { NavLink } from "react-router";
import { useAuth } from "../hook/useAuth";
import { Home, Server, ListChecks, LogOut } from "lucide-react";

export function SideNavLink() {
    const { logout } = useAuth();

    const navItem = [
        { to: "/", id: "home", label: "Home", icon: <Home className="w-5 h-5 mr-2" /> },
        { to: "/node", id: "node", label: "Node", icon: <Server className="w-5 h-5 mr-2" /> },
        { to: "/job", id: "job", label: "Job", icon: <ListChecks className="w-5 h-5 mr-2" /> },
    ];

    return (
        <nav
            className="flex flex-col w-56 h-screen bg-slate-950 border-r border-white/10 text-slate-100 p-4"
            style={{ fontFamily: '"Sora", "Poppins", "Trebuchet MS", sans-serif' }}
        >
            <div className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-300">Blade compute</div>
            <div className="mb-6 text-xl font-bold text-slate-100">Dashboard</div>
            <div className="flex flex-col gap-1 flex-1">
                {navItem.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.to}
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
                className="flex items-center px-4 py-2 mt-8 rounded-lg border border-rose-400/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold gap-2 transition-colors duration-150"
            >
                <LogOut className="w-5 h-5 mr-2" /> Logout
            </button>
        </nav>
    );
}