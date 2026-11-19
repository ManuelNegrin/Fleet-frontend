import { useEffect, useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const links = [
  ["/", "Resumen", "dashboard.read"],
  ["/viajes", "Viajes", "trips.read"],
  ["/clientes", "Clientes", "customers.read"],
  ["/vehiculos", "Vehículos", "vehicles.read"],
  ["/choferes", "Choferes", "drivers.read"],
  ["/combustible", "Combustible", "fuel_tickets.read"],
  ["/taller", "Órdenes de taller", "work_orders.read"],
  ["/admin", "Administración", "users.manage"],
  ["/perfil", "Mi perfil", null],
];

function Navigation({ onSelect }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <div className="small text-white-50 mb-3">{user?.fullName}</div>
      <nav aria-label="Navegación principal" className="nav nav-pills flex-column gap-1 mb-3">
        {links
          .filter(
            ([, , permission]) => !permission || hasPermission(permission),
          )
          .map(([to, text]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onSelect}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {text}
            </NavLink>
          ))}
      </nav>
      <button
        type="button"
        className="btn btn-outline-light mt-auto"
        onClick={() => {
          onSelect?.();
          logout();
          navigate("/login", { replace: true });
        }}
      >
        Salir
      </button>
    </>
  );
}

export default function SideBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const onBreakpointChange = (event) => { if (event.matches) setMenuOpen(false); };
    desktop.addEventListener("change", onBreakpointChange);
    return () => desktop.removeEventListener("change", onBreakpointChange);
  }, []);

  return (
    <>
      <aside className="sidebar d-none d-md-flex p-3">
        <div className="sidebar-brand">FIXORIS</div>
        <Navigation />
      </aside>
      <header className="mobile-header d-flex d-md-none align-items-center justify-content-between gap-3 px-3">
        <span className="sidebar-brand mb-0">FIXORIS</span>
        <button
          type="button"
          className="btn btn-outline-light mobile-menu-button"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span aria-hidden="true">☰</span> Menú
        </button>
      </header>
      <Offcanvas
        id="mobile-navigation"
        className="mobile-navigation d-md-none"
        aria-labelledby="mobile-navigation-title"
        show={menuOpen}
        onHide={closeMenu}
      >
        <Offcanvas.Header closeButton closeLabel="Cerrar menú" closeVariant="white">
          <Offcanvas.Title id="mobile-navigation-title">Menú</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          <Navigation onSelect={closeMenu} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
