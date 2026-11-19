import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import { apiFetch } from "../../services/api";
import { confirmToast } from "../ConfirmationToast";
import FormField from "../FormField";
import { RecordFormScreen, RecordListHeader } from "./RecordScreens";
import useRecordEditor from "./useRecordEditor";

const labels = { active: "Activo", inactive: "Inactivo" };
const emptyCustomer = { name: "", taxId: "", contactName: "", phone: "", email: "", address: "", status: "active" };
const customerToForm = (customer) => ({
  name: customer.name || "", taxId: customer.taxId || "", contactName: customer.contactName || "",
  phone: customer.phone || "", email: customer.email || "", address: customer.address || "",
  status: customer.status || "active",
});
const fail = (value) => toast.error(value.message || "No se pudo completar la solicitud.");

const useCustomers = () => {
  const [items, setItems] = useState([]);
  const refresh = useCallback(async () => {
    try { setItems(await apiFetch("/api/clientes")); } catch (value) { fail(value); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { items, refresh };
};

export function CustomersPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const customers = useCustomers();
  const canCreate = hasPermission("customers.create");
  const canUpdate = hasPermission("customers.update");
  const canDelete = hasPermission("customers.delete");
  const editor = useRecordEditor("/clientes", "/api/clientes", {
    canCreate, canUpdate, emptyForm: emptyCustomer, toForm: customerToForm,
  });
  const { editing, form, setForm } = editor;
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (customer) => editor.open(customer.id);
  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing) { toast.info("Actualizando cliente..."); await apiFetch(`/api/clientes/${editing.id}`, { method: "PUT", body: form }); toast.success("Cliente actualizado."); }
      else { await apiFetch("/api/clientes", { method: "POST", body: form }); toast.success("Cliente creado."); }
      editor.close(); customers.refresh();
    } catch (value) { fail(value); }
  };
  const deactivate = (customer) => confirmToast(`¿Dar de baja a ${customer.name}?`, async () => {
    try { await apiFetch(`/api/clientes/${customer.id}`, { method: "DELETE" }); toast.success("Cliente dado de baja."); customers.refresh(); } catch (value) { fail(value); }
  });
  if (editor.isForm) return (
    <RecordFormScreen editor={editor} createTitle="Nuevo cliente" editTitle="Editar cliente">
      <form className="card card-body shadow-sm" onSubmit={submit}>
        <FormField label="Nombre o razón social *"><input className="form-control" value={form.name} onChange={(event) => set("name", event.target.value)} required /></FormField>
        <FormField label="RUT / identificación fiscal"><input className="form-control" value={form.taxId} onChange={(event) => set("taxId", event.target.value)} /></FormField>
        <FormField label="Contacto"><input className="form-control" value={form.contactName} onChange={(event) => set("contactName", event.target.value)} /></FormField>
        <FormField label="Teléfono"><input className="form-control" value={form.phone} onChange={(event) => set("phone", event.target.value)} /></FormField>
        <FormField label="Correo electrónico"><input className="form-control" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} /></FormField>
        <FormField label="Dirección"><input className="form-control" value={form.address} onChange={(event) => set("address", event.target.value)} /></FormField>
        <FormField label="Estado"><select className="form-select" value={form.status} onChange={(event) => set("status", event.target.value)}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></FormField>
        <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary">{editing ? "Guardar cambios" : "Crear cliente"}</button><button type="button" className="btn btn-outline-secondary" onClick={editor.close}>Cancelar</button></div>
      </form>
    </RecordFormScreen>
  );
  return <>
    <RecordListHeader title="Clientes" onRefresh={customers.refresh} createLabel="Nuevo cliente" onCreate={canCreate ? () => editor.open() : undefined} />
    <div className="card shadow-sm table-responsive"><table className="table mb-0"><thead><tr><th>Cliente</th><th>RUT</th><th>Contacto</th><th>Telefono</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{customers.items.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.taxId || "-"}</td><td>{customer.contactName || "-"}</td><td>{customer.phone || "-"}</td><td>{labels[customer.status] || customer.status}</td><td className="text-nowrap"><button className="btn btn-sm btn-outline-secondary me-1" onClick={() => navigate(`/clientes/${customer.id}`)}>Detalle</button>{canUpdate && <button className="btn btn-sm btn-outline-primary me-1" onClick={() => edit(customer)}>Editar</button>}{canDelete && customer.status === "active" && <button className="btn btn-sm btn-outline-danger" onClick={() => deactivate(customer)}>Baja</button>}</td></tr>)}{!customers.items.length && <tr><td colSpan="6" className="text-muted">No hay clientes registrados.</td></tr>}</tbody></table></div>
  </>;
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  useEffect(() => { apiFetch(`/api/clientes/${id}`).then(setCustomer).catch(fail); }, [id]);
  if (!customer) return <div className="card card-body text-muted">Cargando cliente...</div>;
  const rows = [["RUT / identificacion fiscal", customer.taxId || "-"], ["Contacto", customer.contactName || "-"], ["Telefono", customer.phone || "-"], ["Email", customer.email || "-"], ["Direccion", customer.address || "-"], ["Estado", labels[customer.status] || customer.status]];
  return <><div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4"><h1 className="h3 mb-0">Detalle de cliente</h1><button className="btn btn-outline-primary" onClick={() => navigate("/clientes")}>Volver a clientes</button></div><div className="row g-4"><div className="col-lg-8"><div className="card shadow-sm"><div className="card-header"><strong>{customer.name}</strong></div><div className="card-body"><div className="row g-3">{rows.map(([label, value]) => <div className="col-md-6" key={label}><div className="small text-muted">{label}</div><div>{value}</div></div>)}</div></div></div></div><div className="col-lg-4"><div className="card shadow-sm"><div className="card-header">Viajes</div><div className="card-body"><div className="mb-3"><div className="small text-muted">Viajes totales</div><div className="display-6">{customer.metrics?.totalTrips ?? 0}</div></div><div><div className="small text-muted">Viajes del mes actual</div><div className="display-6">{customer.metrics?.currentMonthTrips ?? 0}</div></div></div></div></div></div></>;
}
