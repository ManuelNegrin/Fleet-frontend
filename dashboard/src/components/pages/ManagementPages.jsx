import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/useAuth";
import { apiFetch } from "../../services/api";
import { confirmToast } from "../ConfirmationToast";
import FormField from "../FormField";
import { RecordFilters, RecordFormScreen, RecordListHeader } from "./RecordScreens";
import useRecordEditor from "./useRecordEditor";

const driverStatuses = { active: "Activo", inactive: "Inactivo" };
const ticketStatuses = { active: "Activo", voided: "Anulado" };
const emptyDriver = { fullName: "", document: "", phone: "", licenseExpiresAt: "", status: "active" };
const emptyTicket = { vehicleId: "", tripIds: [], inputMode: "odometer", distanceInput: "", occurredAt: "", liters: "", totalAmount: "", supplier: "", odometer: "", notes: "" };
const emptyTicketFilters = { search: "", vehicleId: "", tripId: "", status: "", dateExact: "", dateFrom: "", dateTo: "" };
const fail = (value) => toast.error(value.message || "No se pudo completar la solicitud.");
const dateValue = (value) => value ? String(value).slice(0, 10) : "";
const driverToForm = (driver) => ({
  fullName: driver.fullName || "", document: driver.document || "", phone: driver.phone || "",
  licenseExpiresAt: dateValue(driver.licenseExpiresAt), status: driver.status || "active",
});
const ticketToForm = (ticket) => ({
  vehicleId: ticket.vehicleId || "", tripIds: ticket.trips?.map(t => t.id) || (ticket.tripId ? [ticket.tripId] : []), inputMode: ticket.inputMode || "odometer", distanceInput: ticket.distanceInput ?? "", occurredAt: dateValue(ticket.occurredAt),
  liters: ticket.liters ?? "", totalAmount: ticket.totalAmount ?? "", supplier: ticket.supplier || "",
  odometer: ticket.odometer ?? "", notes: ticket.notes || "",
});
const displayDate = (value) => {
  const [year, month, day] = dateValue(value).split("-");
  return year ? `${day}/${month}/${year}` : "-";
};

const useCollection = (endpoint, enabled = true) => {
  const [items, setItems] = useState([]);
  const refresh = useCallback(async () => {
    if (!enabled) return;
    try { setItems(await apiFetch(endpoint)); } catch (value) { fail(value); }
  }, [enabled, endpoint]);
  useEffect(() => { refresh(); }, [refresh]);
  return { items, refresh };
};

const DetailLayout = ({ title, backTo, children }) => {
  const navigate = useNavigate();
  return <><div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4"><h1 className="h3 mb-0">{title}</h1><button className="btn btn-outline-primary" onClick={() => navigate(backTo)}>Volver al listado</button></div>{children}</>;
};

export function DriversPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const drivers = useCollection("/api/choferes");
  const canCreate = hasPermission("drivers.create");
  const canUpdate = hasPermission("drivers.update");
  const canDelete = hasPermission("drivers.delete");
  const editor = useRecordEditor("/choferes", "/api/choferes", {
    canCreate, canUpdate, emptyForm: emptyDriver, toForm: driverToForm,
  });
  const { editing, form, setForm } = editor;
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing) { toast.info("Actualizando chofer..."); await apiFetch(`/api/choferes/${editing.id}`, { method: "PUT", body: form }); toast.success("Chofer actualizado."); }
      else { await apiFetch("/api/choferes", { method: "POST", body: form }); toast.success("Chofer creado."); }
      editor.close(); drivers.refresh();
    } catch (value) { fail(value); }
  };
  const remove = (driver) => confirmToast(`¿Dar de baja a ${driver.fullName}?`, async () => {
    try { await apiFetch(`/api/choferes/${driver.id}`, { method: "DELETE" }); toast.success("Chofer dado de baja."); drivers.refresh(); } catch (value) { fail(value); }
  });
  if (editor.isForm) return (
    <RecordFormScreen editor={editor} createTitle="Nuevo chofer" editTitle="Editar chofer">
      <form className="card card-body shadow-sm" onSubmit={submit}>
      <FormField label="Nombre completo *"><input className="form-control" value={form.fullName} onChange={(event) => set("fullName", event.target.value)} required /></FormField>
      <FormField label="Documento *"><input className="form-control" value={form.document} onChange={(event) => set("document", event.target.value)} required /></FormField>
      <FormField label="Teléfono"><input className="form-control" value={form.phone} onChange={(event) => set("phone", event.target.value)} /></FormField>
      <FormField label="Vencimiento de libreta"><input className="form-control" type="date" value={form.licenseExpiresAt} onChange={(event) => set("licenseExpiresAt", event.target.value)} /></FormField>
      <FormField label="Estado"><select className="form-select" value={form.status} onChange={(event) => set("status", event.target.value)}><option value="active">Activo</option><option value="inactive">Inactivo</option></select></FormField>
        <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary">{editing ? "Guardar cambios" : "Crear chofer"}</button><button type="button" className="btn btn-outline-secondary" onClick={editor.close}>Cancelar</button></div>
      </form>
    </RecordFormScreen>
  );
  return <>
    <RecordListHeader title="Choferes" onRefresh={drivers.refresh} createLabel="Nuevo chofer" onCreate={canCreate ? () => editor.open() : undefined} />
    <div className="card shadow-sm table-responsive"><table className="table mb-0"><thead><tr><th>Nombre</th><th>Documento</th><th>Telefono</th><th>Libreta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{drivers.items.map((driver) => <tr key={driver.id}><td>{driver.fullName}</td><td>{driver.document}</td><td>{driver.phone || "-"}</td><td>{displayDate(driver.licenseExpiresAt)}</td><td>{driverStatuses[driver.status] || driver.status}</td><td className="text-nowrap"><button className="btn btn-sm btn-outline-secondary me-1" onClick={() => navigate(`/choferes/${driver.id}`)}>Detalle</button>{canUpdate && <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editor.open(driver.id)}>Editar</button>}{canDelete && <button className="btn btn-sm btn-outline-danger" onClick={() => remove(driver)}>Baja</button>}</td></tr>)}{!drivers.items.length && <tr><td colSpan="6" className="text-muted">No hay choferes registrados.</td></tr>}</tbody></table></div>
  </>;
}

export function DriverDetailPage() {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  useEffect(() => { apiFetch(`/api/choferes/${id}`).then(setDriver).catch(fail); }, [id]);
  if (!driver) return <div className="card card-body text-muted">Cargando chofer...</div>;
  const rows = [["Documento", driver.document], ["Telefono", driver.phone || "-"], ["Vencimiento de libreta", displayDate(driver.licenseExpiresAt)], ["Estado", driverStatuses[driver.status] || driver.status]];
  return <DetailLayout title="Detalle de chofer" backTo="/choferes"><div className="card shadow-sm"><div className="card-header"><strong>{driver.fullName}</strong></div><div className="card-body"><div className="row g-3">{rows.map(([label, value]) => <div className="col-md-4" key={label}><div className="small text-muted">{label}</div><div>{value}</div></div>)}</div></div></div></DetailLayout>;
}

export function FuelTicketsPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const tickets = useCollection("/api/consumos");
  const vehicles = useCollection("/api/vehiculos", hasPermission("vehicles.read"));
  const trips = useCollection("/api/viajes", hasPermission("trips.read"));
  const [filters, setFilters] = useState(emptyTicketFilters);
  const canCreate = hasPermission("fuel_tickets.create");
  const canUpdate = hasPermission("fuel_tickets.update");
  const editor = useRecordEditor("/combustible", "/api/consumos", {
    canCreate, canUpdate, emptyForm: emptyTicket, toForm: ticketToForm,
  });
  const { editing, form, setForm } = editor;
  const [suggestions, setSuggestions] = useState(null);
  const [tripSearch, setTripSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const editingId = editing?.id;
  useEffect(() => {
    let active = true;
    setSuggestions(null);
    if (form.vehicleId && form.occurredAt) {
      const query = new URLSearchParams({ vehicleId: form.vehicleId, date: form.occurredAt, ...(editingId ? { excludeTicketId: editingId } : {}) });
      apiFetch(`/api/consumos/trip-suggestions?${query}`).then(value => { if (active) setSuggestions(value); }).catch(value => { if (active) fail(value); });
    }
    return () => { active = false; };
  }, [form.vehicleId, form.occurredAt, editingId]);
  const suggestedIds = new Set(suggestions?.trips.map(t => t.id) || []);
  const selectedIds = form.tripIds || [];
  const selectableTrips = [...(suggestions?.trips || []), ...trips.items.filter(t => !suggestedIds.has(t.id) &&
    (selectedIds.includes(t.id) || (tripSearch && t.truckVehicleId === form.vehicleId && t.status !== "cancelled" && `${t.rotation} ${t.origin} ${t.destination}`.toLowerCase().includes(tripSearch.toLowerCase()))))];
  const filteredTickets = useMemo(() => tickets.items.filter((ticket) => {
    const searchable = `${ticket.vehicle?.licensePlate || ""} ${ticket.supplier || ""} ${ticket.notes || ""}`.toLowerCase();
    const occurredAt = dateValue(ticket.occurredAt);
    if (filters.search && !searchable.includes(filters.search.toLowerCase())) return false;
    if (filters.vehicleId && ticket.vehicleId !== filters.vehicleId) return false;
    if (filters.tripId && !(ticket.trips || []).some(t => t.id === filters.tripId) && ticket.tripId !== filters.tripId) return false;
    if (filters.status && ticket.status !== filters.status) return false;
    if (filters.dateExact && occurredAt !== filters.dateExact) return false;
    if (!filters.dateExact && filters.dateFrom && occurredAt < filters.dateFrom) return false;
    if (!filters.dateExact && filters.dateTo && occurredAt > filters.dateTo) return false;
    return true;
  }), [tickets.items, filters]);
  const refresh = async () => { await Promise.all([tickets.refresh(), vehicles.refresh(), trips.refresh()]); };
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const body = () => ({ ...form, tripIds: selectedIds, liters: Number(form.liters), totalAmount: Number(form.totalAmount), odometer: form.inputMode === "odometer" ? Number(form.odometer) : null, distanceInput: form.inputMode === "distance" ? Number(form.distanceInput) : null });
  const submit = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (editing) { toast.info("Actualizando ticket de combustible..."); await apiFetch(`/api/consumos/${editing.id}`, { method: "PUT", body: body() }); toast.success("Ticket actualizado."); }
      else { await apiFetch("/api/consumos", { method: "POST", body: body() }); toast.success("Ticket creado."); }
      editor.close(); refresh();
    } catch (value) { fail(value); } finally { setSaving(false); savingRef.current = false; }
  };
  const voidTicket = (ticket) => confirmToast("¿Anular este ticket de combustible?", async () => {
    try { await apiFetch(`/api/consumos/${ticket.id}`, { method: "DELETE" }); toast.success("Ticket anulado."); refresh(); } catch (value) { fail(value); }
  });
  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  if (editor.isForm) return (
    <RecordFormScreen editor={editor} createTitle="Nuevo ticket" editTitle="Editar ticket">
      <form className="card card-body shadow-sm" onSubmit={submit}>
      {editing && <div className="alert alert-warning">Editar un ticket recalcula el kilometraje y los consumos posteriores del camión. Las cargas representan tanque lleno.</div>}
      <FormField label="Camión *"><select className="form-select" value={form.vehicleId} onChange={(event) => setForm(current => ({ ...current, vehicleId: event.target.value, tripIds: [] }))} required><option value="">Seleccionar camión</option>{vehicles.items.filter(v => v.type === "truck").map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate}</option>)}</select></FormField>
      <FormField label="Fecha del ticket *"><input className="form-control" type="date" value={form.occurredAt} onChange={(event) => set("occurredAt", event.target.value)} required /></FormField>
      <fieldset className="border rounded p-3 mb-3"><legend className="float-none w-auto fs-6 px-1">Viajes realizados con este combustible</legend>
        <p className="small text-muted">{suggestions ? `Desde ${suggestions.from ? displayDate(suggestions.from) : "la primera referencia"} hasta ${displayDate(suggestions.to)}. Confirma los viajes; no se asignan automáticamente.` : "Selecciona camión y fecha para obtener sugerencias."}</p>
        <input className="form-control mb-2" aria-label="Agregar otro viaje" placeholder="Agregar otro viaje: buscar virada, origen o destino" value={tripSearch} onChange={e => setTripSearch(e.target.value)} />
        <label className="form-check mb-2"><input type="checkbox" className="form-check-input" checked={!selectedIds.length} onChange={() => set("tripIds", [])} /><span className="form-check-label">Sin viaje asociado</span></label>
        {selectableTrips.map(trip => <label key={trip.id} className="form-check mb-2"><input type="checkbox" className="form-check-input" checked={selectedIds.includes(trip.id)} onChange={e => set("tripIds", e.target.checked ? [...selectedIds, trip.id] : selectedIds.filter(id => id !== trip.id))} /><span className="form-check-label"><strong>{trip.rotation ? `Virada ${trip.rotation} · ` : ""}</strong>{trip.origin} → {trip.destination}<br /><small>{displayDate(trip.departureAt)} — {displayDate(trip.unloadingAt)} {trip.suggestion === "review_date" ? "· Revisar fecha" : ""}{trip.truckVehicleId !== form.vehicleId ? " · Revisar camión: asociación histórica" : ""}</small></span></label>)}
        {selectedIds.length > 1 && <p className="small text-muted mb-0">El promedio del intervalo se mostrará como compartido en estos viajes. No se duplicará en el histórico del camión.</p>}
      </fieldset>
      <FormField label="Litros *"><input className="form-control" type="number" step="0.001" min="0.001" value={form.liters} onChange={(event) => set("liters", event.target.value)} required /></FormField>
      <FormField label="Importe total *"><input className="form-control" type="number" step="0.01" min="0" value={form.totalAmount} onChange={(event) => set("totalAmount", event.target.value)} required /></FormField>
      <FormField label="Proveedor *"><input className="form-control" value={form.supplier} onChange={(event) => set("supplier", event.target.value)} required /></FormField>
      <FormField label="Forma de registrar los kilómetros"><select className="form-select" value={form.inputMode} onChange={e => set("inputMode", e.target.value)}><option value="odometer">Lectura de odómetro</option><option value="distance">Kilómetros recorridos desde la carga anterior</option></select></FormField>
      {form.inputMode === "distance" ? <FormField label="Km recorridos desde la carga anterior *"><input className="form-control" type="number" step="1" min="0" value={form.distanceInput} onChange={e => set("distanceInput", e.target.value)} required /></FormField> : <FormField label="Odómetro (km) *"><input className="form-control" type="number" step="1" min="0" value={form.odometer} onChange={e => set("odometer", e.target.value)} required /></FormField>}
      <p className="small text-muted">Siempre tanque lleno. El primer ticket sin lectura establece 0 km (puedes ingresar 0) y sirve de referencia; el consumo se calcula a partir del siguiente.</p>
      <FormField label="Notas"><textarea className="form-control" value={form.notes} onChange={(event) => set("notes", event.target.value)} /></FormField>
        <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary" disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear ticket"}</button><button type="button" className="btn btn-outline-secondary" onClick={editor.close}>Cancelar</button></div>
      </form>
    </RecordFormScreen>
  );
  return <>
    <RecordListHeader title="Combustible" onRefresh={refresh} createLabel="Nuevo ticket" onCreate={canCreate ? () => editor.open() : undefined} />
    <RecordFilters><div className="row g-2">
      <div className="col-md-6"><FormField label="Buscar ticket"><input className="form-control" placeholder="Vehículo, proveedor o nota" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} /></FormField></div>
      <div className="col-md-3"><FormField label="Vehículo"><select className="form-select" value={filters.vehicleId} onChange={(event) => setFilter("vehicleId", event.target.value)}><option value="">Todos los vehículos</option>{vehicles.items.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate}</option>)}</select></FormField></div>
      <div className="col-md-3"><FormField label="Estado"><select className="form-select" value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="">Todos los estados</option><option value="active">Activo</option><option value="voided">Anulado</option></select></FormField></div>
      <div className="col-md-6"><FormField label="Viaje"><select className="form-select" value={filters.tripId} onChange={(event) => setFilter("tripId", event.target.value)}><option value="">Todos los viajes</option>{trips.items.map((trip) => <option key={trip.id} value={trip.id}>{trip.origin} - {trip.destination}</option>)}</select></FormField></div>
      <div className="col-md-2"><FormField label="Fecha"><input className="form-control" type="date" value={filters.dateExact} onChange={(event) => setFilter("dateExact", event.target.value)} /></FormField></div>
      <div className="col-md-2"><FormField label="Desde"><input className="form-control" type="date" disabled={Boolean(filters.dateExact)} value={filters.dateFrom} onChange={(event) => setFilter("dateFrom", event.target.value)} /></FormField></div>
      <div className="col-md-2"><FormField label="Hasta"><input className="form-control" type="date" disabled={Boolean(filters.dateExact)} value={filters.dateTo} onChange={(event) => setFilter("dateTo", event.target.value)} /></FormField></div>
    </div><button className="btn btn-sm btn-outline-secondary mt-3 align-self-start" onClick={() => setFilters(emptyTicketFilters)}>Limpiar filtros</button></RecordFilters>
    <div className="card shadow-sm table-responsive"><table className="table mb-0"><thead><tr><th>Vehiculo</th><th>Fecha</th><th>Litros</th><th>Importe</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filteredTickets.map((ticket) => <tr key={ticket.id}><td>{ticket.vehicle?.licensePlate || "-"}</td><td>{displayDate(ticket.occurredAt)}</td><td>{ticket.liters}</td><td>{ticket.totalAmount}</td><td>{ticketStatuses[ticket.status] || ticket.status}</td><td className="text-nowrap"><button className="btn btn-sm btn-outline-secondary me-1" onClick={() => navigate(`/combustible/${ticket.id}`)}>Detalle</button>{canUpdate && ticket.status === "active" && <><button className="btn btn-sm btn-outline-primary me-1" onClick={() => editor.open(ticket.id)}>Editar</button><button className="btn btn-sm btn-outline-danger" onClick={() => voidTicket(ticket)}>Anular</button></>}</td></tr>)}{!filteredTickets.length && <tr><td colSpan="6" className="text-muted">No hay tickets que coincidan con los filtros.</td></tr>}</tbody></table></div>
  </>;
}

export function FuelTicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  useEffect(() => { apiFetch(`/api/consumos/${id}`).then(setTicket).catch(fail); }, [id]);
  if (!ticket) return <div className="card card-body text-muted">Cargando ticket...</div>;
  const rows = [["Vehículo", ticket.vehicle?.licensePlate || "-"], ["Viajes", ticket.trips?.map(t => `${t.rotation ? `Virada ${t.rotation} · ` : ""}${t.origin} - ${t.destination}${t.FuelTicketTrip?.needsReview ? " (Revisar camión)" : ""}`).join("; ") || "Sin viaje asociado"], ["Fecha", displayDate(ticket.occurredAt)], ["Litros", ticket.liters], ["Importe total", ticket.totalAmount], ["Proveedor", ticket.supplier], ["Modo", ticket.inputMode === "distance" ? "Km recorridos" : "Odómetro"], ["Valor ingresado", ticket.inputMode === "distance" ? ticket.distanceInput : ticket.odometer], ["Kilometraje acumulado", `${ticket.accumulatedOdometer ?? "-"}${ticket.mileageEstimated ? " (estimado)" : ""}`], ["Distancia del intervalo", ticket.distanceKm ?? "Primera referencia"], ["Consumo del intervalo", ticket.distanceKm > 0 ? `${(ticket.distanceKm / Number(ticket.liters)).toFixed(2)} km/l${ticket.trips?.length > 1 ? " (compartido)" : ""}` : "Sin datos suficientes"], ["Estado", ticketStatuses[ticket.status] || ticket.status]];
  return <DetailLayout title="Detalle de ticket" backTo="/combustible"><div className="card shadow-sm"><div className="card-body"><div className="row g-3">{rows.map(([label, value]) => <div className="col-md-4" key={label}><div className="small text-muted">{label}</div><div>{value}</div></div>)}<div className="col-12"><div className="small text-muted">Notas</div><div>{ticket.notes || "Sin notas."}</div></div></div></div></div></DetailLayout>;
}
