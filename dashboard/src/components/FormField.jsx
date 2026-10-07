export default function FormField({ label, children }) {
  return <label className="d-block mb-3">
    <span className="form-label small fw-semibold d-block mb-1">{label}</span>
    {children}
  </label>;
}
