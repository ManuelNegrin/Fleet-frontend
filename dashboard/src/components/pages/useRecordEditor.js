import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";

// The module stays mounted across its list and form routes, preserving filters.
export default function useRecordEditor(listPath, endpoint, { canCreate, canUpdate, emptyForm, toForm }) {
  const { key, state } = useLocation();
  const navigate = useNavigate();
  const createMatch = useMatch(`${listPath}/nuevo`);
  const editMatch = useMatch(`${listPath}/:recordId/editar`);
  const recordId = editMatch?.params.recordId;
  const isForm = Boolean(createMatch || editMatch);
  const allowed = Boolean(recordId ? canUpdate : canCreate);
  const [loaded, setLoaded] = useState(null);
  const [draft, setDraft] = useState(null);
  const activeKey = useRef(null);

  useLayoutEffect(() => {
    activeKey.current = key;
    return () => { activeKey.current = null; };
  }, [key]);

  useEffect(() => {
    if (!recordId || !allowed) return;
    let active = true;
    apiFetch(`${endpoint}/${encodeURIComponent(recordId)}`).then(
      (record) => { if (active) setLoaded({ key, record }); },
      (error) => { if (active) setLoaded({ key, error }); },
    );
    return () => { active = false; };
  }, [allowed, endpoint, key, recordId]);

  const result = recordId && loaded?.key === key ? loaded : null;
  const editing = result?.record || null;
  const form = draft?.key === key ? draft.value : editing ? toForm(editing) : emptyForm;

  const setForm = (next) => {
    setDraft((current) => ({
      key,
      value: typeof next === "function" ? next(current?.key === key ? current.value : form) : next,
    }));
  };

  const open = (id) => {
    const suffix = id ? `${encodeURIComponent(id)}/editar` : "nuevo";
    navigate(`${listPath}/${suffix}`, { state: { recordList: listPath } });
  };

  const close = () => {
    if (activeKey.current !== key) return;
    activeKey.current = null;
    setDraft(null);
    if (state?.recordList === listPath) navigate(-1);
    else navigate(listPath, { replace: true });
  };

  return {
    key, isForm, allowed, recordId, editing, form, setForm, open, close,
    loading: Boolean(recordId && !result),
    error: result?.error,
  };
}
