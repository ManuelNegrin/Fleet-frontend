export function RecordListHeader({ title, onRefresh, createLabel, onCreate }) {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
      <h1 className="h3 mb-0">{title}</h1>
      <div className="d-flex flex-wrap gap-2">
        {onCreate && <button type="button" className="btn btn-primary" onClick={onCreate}>{createLabel}</button>}
        <button type="button" className="btn btn-outline-primary" onClick={onRefresh}>Actualizar</button>
      </div>
    </div>
  );
}

export function RecordFormScreen({ editor, createTitle, editTitle, children }) {
  return (
    <section className="record-form">
      <h1 className="h3 mb-4">{editor.recordId ? editTitle : createTitle}</h1>
      {!editor.allowed || editor.error ? (
        <>
          <div className="alert alert-danger" role="alert">
            {editor.allowed ? editor.error.message : "No tienes permiso para realizar esta acción."}
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={editor.close}>Volver al listado</button>
        </>
      ) : editor.loading ? (
        <>
          <p role="status">Cargando registro…</p>
          <button type="button" className="btn btn-outline-secondary" onClick={editor.close}>Volver al listado</button>
        </>
      ) : children}
    </section>
  );
}
import { useId, useState } from "react";


export function RecordFilters({ children }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return (
    <div className="mb-3">
      <button
        type="button"
        className="btn btn-outline-secondary d-md-none"
        aria-controls={id}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Ocultar filtros" : "Mostrar filtros"}
      </button>
      <div id={id} className={expanded ? "mt-2 mt-md-0" : "d-none d-md-block"}>
        <div className="card card-body shadow-sm">{children}</div>
      </div>
    </div>
  );
}
