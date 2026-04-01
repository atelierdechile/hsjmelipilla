import { useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";

const initialBeds = [
  { id: "101", servicio: "UCI", estado: "ocupada", nivel: "alta", paciente: "Juan Perez" },
  { id: "102", servicio: "Cirugia", estado: "disponible", nivel: "media", paciente: "-" },
  { id: "103", servicio: "Pediatria", estado: "limpieza", nivel: "baja", paciente: "-" },
  { id: "104", servicio: "Maternidad", estado: "disponible", nivel: "media", paciente: "-" },
];

export function CamasPage() {
  const [beds, setBeds] = useState(initialBeds);
  const [selectedBed, setSelectedBed] = useState(null);
  const [form, setForm] = useState({ nombre: "", edad: "", peso: "", nivel: "media", cama: "" });

  const stats = useMemo(() => {
    const disponibles = beds.filter((item) => item.estado === "disponible").length;
    const ocupadas = beds.filter((item) => item.estado === "ocupada").length;
    const limpieza = beds.filter((item) => item.estado === "limpieza").length;
    const ocupacion = beds.length ? Math.round((ocupadas / beds.length) * 100) : 0;
    return { disponibles, ocupadas, limpieza, ocupacion };
  }, [beds]);

  const availableBeds = beds.filter((item) => item.estado === "disponible");

  const updateBed = (id, changes) => {
    setBeds((current) => current.map((bed) => (bed.id === id ? { ...bed, ...changes } : bed)));
    setSelectedBed(null);
  };

  const saveIngreso = () => {
    if (!form.nombre || !form.edad || !form.peso || !form.cama) return;
    updateBed(form.cama, { estado: "ocupada", nivel: form.nivel, paciente: `${form.nombre} (${form.edad} anos, ${form.peso}kg)` });
    setForm({ nombre: "", edad: "", peso: "", nivel: "media", cama: "" });
  };

  return (
    <AppShell title="Gestion de Camas" actions={<button className="btn small primary" type="button" onClick={() => setSelectedBed({ id: "new" })}>+ Nuevo Ingreso</button>}>
      <section className="kpi-grid">
        <div className="kpi-card"><span>Disponibles</span><h2 id="kpiDisponibles">{stats.disponibles}</h2></div>
        <div className="kpi-card"><span>Ocupadas</span><h2 id="kpiOcupadas">{stats.ocupadas}</h2></div>
        <div className="kpi-card"><span>Limpieza</span><h2 id="kpiLimpieza">{stats.limpieza}</h2></div>
        <div className="kpi-card"><span>Ocupacion</span><h2 id="kpiOcupacion">{stats.ocupacion}%</h2></div>
        <div className="kpi-card"><span>Estadia Prom.</span><h2 id="kpiEstadia">{stats.ocupadas ? "4.2 dias" : "0 dias"}</h2></div>
      </section>

      <section className="card">
        <div className="card-header"><h3>Estado de camas</h3></div>
        <table>
          <thead><tr><th>ID</th><th>Servicio</th><th>Estado</th><th>Nivel</th><th>Paciente</th><th>Acciones</th></tr></thead>
          <tbody>
            {beds.map((bed) => <tr key={bed.id}><td>{bed.id}</td><td><span className="badge-servicio">{bed.servicio}</span></td><td><span className={`tag ${bed.estado === "ocupada" ? "red" : bed.estado === "limpieza" ? "orange" : "green"}`}>{bed.estado}</span></td><td><span className={`nivel ${bed.nivel}`}>{bed.nivel}</span></td><td>{bed.paciente}</td><td><button className="btn small secondary" type="button" onClick={() => setSelectedBed(bed)}>Gestionar</button></td></tr>)}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>Mapa visual de camas</h3>
        <div className="mapa-camas" id="mapaCamas">
          {beds.map((bed) => <button key={bed.id} type="button" className={`cama ${bed.estado}`} onClick={() => setSelectedBed(bed)}><div className="cama-id">{bed.id}</div><div className="cama-servicio">{bed.servicio}</div></button>)}
        </div>
      </section>

      {selectedBed ? (
        <div className="modal-overlay active">
          <div className="modal-content">
            <div className="modal-header"><h3>{selectedBed.id === "new" ? "Nuevo ingreso" : `Cama ${selectedBed.id}`}</h3><button className="close-btn" type="button" onClick={() => setSelectedBed(null)}>X</button></div>
            <div className="modal-body">
              {selectedBed.id === "new" || selectedBed.estado === "disponible" ? (
                <>
                  <label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                  <label>Edad</label><input type="number" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} />
                  <label>Peso</label><input type="number" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} />
                  <label>Nivel</label><select value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select>
                  <label>Cama</label><select value={form.cama} onChange={(e) => setForm({ ...form, cama: e.target.value })}><option value="">Selecciona una cama</option>{(selectedBed.id === "new" ? availableBeds : [selectedBed]).map((bed) => <option key={bed.id} value={bed.id}>{`Cama ${bed.id} - ${bed.servicio}`}</option>)}</select>
                </>
              ) : (
                <>
                  <p><strong>Servicio:</strong> {selectedBed.servicio}</p>
                  <p><strong>Estado:</strong> {selectedBed.estado}</p>
                  <p><strong>Nivel:</strong> {selectedBed.nivel}</p>
                  <p><strong>Paciente:</strong> {selectedBed.paciente}</p>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setSelectedBed(null)}>Cerrar</button>
              {selectedBed.id === "new" || selectedBed.estado === "disponible" ? <button className="btn primary" type="button" onClick={saveIngreso}>Guardar</button> : null}
              {selectedBed.estado === "ocupada" ? <button className="btn primary" type="button" onClick={() => updateBed(selectedBed.id, { estado: "disponible", paciente: "-" })}>Dar alta</button> : null}
              {selectedBed.estado === "ocupada" ? <button className="btn secondary" type="button" onClick={() => updateBed(selectedBed.id, { estado: "limpieza", paciente: "-" })}>Limpieza</button> : null}
              {selectedBed.estado === "limpieza" ? <button className="btn primary" type="button" onClick={() => updateBed(selectedBed.id, { estado: "disponible", paciente: "-" })}>Disponible</button> : null}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
