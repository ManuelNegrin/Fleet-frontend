import { createElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./toast.css";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Login from "./components/auth/Login";
import ProtectedRoute from "./components/auth/ProtectedRoutes";
import Layout from "./components/layout/Layout";
import { DashboardPage } from "./components/pages/OperationsPages";
import { ProfilePage, UserAdministrationPage } from "./components/pages/AdministrationPages";
import { TripsPage, WorkOrderDetailPage, WorkOrdersPage } from "./components/pages/TripAndWorkshopPages";
import { TripDetailPage, VehicleDetailPage, VehiclesPage } from "./components/pages/FleetPages";
import { DriverDetailPage, DriversPage, FuelTicketDetailPage, FuelTicketsPage } from "./components/pages/ManagementPages";
import { CustomerDetailPage, CustomersPage } from "./components/pages/CustomerPages";

function PlatformRedirect() {
  const { logout } = useAuth();
  const url = import.meta.env.VITE_PLATFORM_CONSOLE_URL;
  if (url) { window.location.replace(url); return null; }
  return <main className="login-page"><div className="login-card shadow"><h1 className="h4">Consola de plataforma</h1><p>La cuenta es superadministradora. Configura VITE_PLATFORM_CONSOLE_URL para abrir la consola independiente.</p><button className="btn btn-outline-primary" onClick={logout}>Salir</button></div></main>;
}

function HomePage() {
  const { hasPermission } = useAuth();
  if (hasPermission("dashboard.read")) return <DashboardPage />;
  if (hasPermission("vehicles.read")) return <Navigate to="/vehiculos" replace />;
  if (hasPermission("work_orders.read")) return <Navigate to="/taller" replace />;
  return <Navigate to="/login" replace />;
}

const modules = [
  ["viajes", "trips.read", TripsPage, TripDetailPage],
  ["clientes", "customers.read", CustomersPage, CustomerDetailPage],
  ["vehiculos", "vehicles.read", VehiclesPage, VehicleDetailPage],
  ["choferes", "drivers.read", DriversPage, DriverDetailPage],
  ["combustible", "fuel_tickets.read", FuelTicketsPage, FuelTicketDetailPage],
  ["taller", "work_orders.read", WorkOrdersPage, WorkOrderDetailPage],
  ["admin", "users.manage", UserAdministrationPage],
];

export default function App() {
  return <><ToastContainer position="top-center" className="app-toast-center" newestOnTop pauseOnFocusLoss={false} /><AuthProvider><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/platform" element={<PlatformRedirect />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {modules.map(([path, permission, Page, Detail]) => (
          <Route key={path} element={<ProtectedRoute permission={permission} />}>
            <Route path={path} element={createElement(Page)}>
              {/* The module renders the selected screen and keeps its list state. */}
              <Route path="nuevo" element={null} />
              <Route path=":recordId/editar" element={null} />
            </Route>
            {Detail && <Route path={`${path}/:id`} element={<Detail />} />}
          </Route>
        ))}
        <Route path="perfil" element={<ProfilePage />} />
      </Route>
    </Route>
    <Route path="*" element={<Login />} />
  </Routes></AuthProvider></>;
}
