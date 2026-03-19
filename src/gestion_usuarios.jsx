import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════
//  CONFIG — Proyecto Turnos
// ════════════════════════════════════════════════════════════
const SUPABASE_URL = "https://lgzndrjklzbtkzkzubld.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnem5kcmprbHpidGt6a3p1YmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDg5NjIsImV4cCI6MjA4OTI4NDk2Mn0.hn2mZbIs8JbScMZxRSCkqGHeen255_w47zavfkV9C2k";

let _token = null;

async function sbAuth(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error_description || d.message || "Credenciales incorrectas");
  _token = d.access_token;
  return d;
}

async function sbLogout() {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${_token}` },
  }).catch(() => {});
  _token = null;
}

function hdrs() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${_token || SUPABASE_ANON_KEY}`,
    Prefer: "return=representation",
  };
}

async function sbSelect(tabla, q = "") {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}${q}`, { headers: hdrs() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function sbRpc(fn, params = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify(params),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || d.hint || JSON.stringify(d));
  return d;
}

async function sbPatch(tabla, id, datos) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${id}`, {
    method: "PATCH",
    headers: hdrs(),
    body: JSON.stringify(datos),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ════════════════════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════════════════════
const COLORES = ["#6366f1","#8b5cf6","#a855f7","#ec4899","#14b8a6","#f59e0b","#ef4444","#10b981","#0ea5e9","#f97316"];
const SERVICIOS_LABELS = ["Psicoterapia","Biodecodificacion","Constelaciones Individuales","Coaching","Primera consulta","Grupo terapeutico"];

// ════════════════════════════════════════════════════════════
//  CSS
// ════════════════════════════════════════════════════════════
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0d0f14;--surface:#161920;--surface2:#1e2230;--border:#2a2f45;
    --accent:#7c6fdb;--accent2:#c084fc;--gold:#f0c060;
    --text:#e8eaf0;--text2:#8b91a8;
    --success:#34d399;--danger:#f87171;--warn:#fbbf24;
    --radius:14px;
  }
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}

  /* LOGIN */
  .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(ellipse 800px 500px at 50% 0%,rgba(124,111,219,.15),transparent);}
  .box{background:var(--surface);border:1px solid var(--border);border-radius:24px;
    padding:48px;width:420px;box-shadow:0 32px 80px rgba(0,0,0,.6);}
  .logo{font-family:'DM Serif Display',serif;font-size:26px;color:var(--accent2);
    text-align:center;margin-bottom:6px;}
  .sub{text-align:center;font-size:13px;color:var(--text2);margin-bottom:32px;}

  /* LAYOUT */
  .app{display:flex;min-height:100vh;}
  .sidebar{width:260px;background:var(--surface);border-right:1px solid var(--border);
    display:flex;flex-direction:column;padding:24px 0;position:fixed;top:0;bottom:0;left:0;z-index:10;}
  .sidebar-logo{padding:0 20px 20px;border-bottom:1px solid var(--border);margin-bottom:12px;}
  .sidebar-logo h1{font-family:'DM Serif Display',serif;font-size:20px;color:var(--accent2);}
  .sidebar-logo p{font-size:11px;color:var(--text2);letter-spacing:2px;text-transform:uppercase;margin-top:4px;}
  .s-user{display:flex;align-items:center;gap:10px;padding:10px 20px;margin-bottom:8px;background:var(--surface2);}
  .s-name{font-size:13px;font-weight:600;}
  .s-role{font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;}
  .nav-sec{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    color:var(--text2);padding:14px 20px 5px;}
  .nav-item{display:flex;align-items:center;gap:12px;padding:11px 20px;cursor:pointer;
    transition:all .2s;color:var(--text2);font-size:14px;font-weight:500;
    border-left:3px solid transparent;}
  .nav-item:hover{background:var(--surface2);color:var(--text);}
  .nav-item.active{background:rgba(124,111,219,.12);color:var(--accent2);border-left-color:var(--accent2);}
  .main{margin-left:260px;flex:1;padding:32px;}
  .ph{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
  .pt{font-family:'DM Serif Display',serif;font-size:28px;}

  /* CARDS */
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
    padding:20px;box-shadow:0 4px 24px rgba(0,0,0,.4);}
  .ct{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    color:var(--text2);margin-bottom:16px;}

  /* BOTONES */
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;
    border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;
    font-weight:500;cursor:pointer;transition:all .2s;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-primary:hover{background:#6b5fd4;transform:translateY(-1px);}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
  .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border);}
  .btn-ghost:hover{background:var(--surface2);color:var(--text);}
  .btn-danger{background:rgba(248,113,113,.15);color:var(--danger);border:1px solid rgba(248,113,113,.3);}
  .btn-success{background:rgba(52,211,153,.15);color:var(--success);border:1px solid rgba(52,211,153,.3);}
  .btn-warn{background:rgba(251,191,36,.15);color:var(--warn);border:1px solid rgba(251,191,36,.3);}
  .btn-sm{padding:6px 12px;font-size:13px;}

  /* TABLA */
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:11px 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;
    text-transform:uppercase;color:var(--text2);border-bottom:1px solid var(--border);}
  td{padding:14px 16px;border-bottom:1px solid var(--border);font-size:14px;}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:rgba(255,255,255,.02);}

  /* BADGE */
  .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;
    font-size:11px;font-weight:700;text-transform:uppercase;}
  .badge-on{background:rgba(52,211,153,.15);color:var(--success);}
  .badge-off{background:rgba(248,113,113,.15);color:var(--danger);}
  .badge-admin{background:rgba(240,192,96,.15);color:var(--gold);}
  .badge-ter{background:rgba(124,111,219,.15);color:var(--accent2);}

  /* MODAL */
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;
    align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(6px);
    animation:fadeIn .2s;}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;
    padding:32px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;
    box-shadow:0 24px 80px rgba(0,0,0,.6);animation:slideUp .25s;}
  .mtitle{font-family:'DM Serif Display',serif;font-size:24px;color:var(--accent2);margin-bottom:22px;}

  /* FORM */
  .fg{margin-bottom:18px;}
  .fl{display:block;font-size:11px;font-weight:700;color:var(--text2);
    text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;}
  .fi,.fs,.fta{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;
    padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;transition:border-color .2s;}
  .fi:focus,.fs:focus,.fta:focus{outline:none;border-color:var(--accent);
    box-shadow:0 0 0 3px rgba(124,111,219,.2);}
  .fta{resize:vertical;min-height:70px;}
  .fr{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .fa{display:flex;gap:12px;justify-content:flex-end;margin-top:22px;}

  /* AVATAR */
  .av{border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-weight:700;flex-shrink:0;}

  /* STATS */
  .sg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;}
  .sc{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);
    padding:20px 24px;position:relative;overflow:hidden;}
  .sc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--c,var(--accent));}
  .sv{font-size:38px;font-weight:700;line-height:1;margin-bottom:6px;color:var(--c,var(--accent));}
  .sl{font-size:12px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;}

  /* PASS INPUT */
  .pass-wrap{position:relative;}
  .pass-wrap .fi{padding-right:44px;}
  .pass-eye{position:absolute;right:14px;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;color:var(--text2);font-size:16px;padding:0;}

  /* CHIPS */
  .chips{display:flex;flex-wrap:wrap;gap:8px;}
  .chip{padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;
    cursor:pointer;border:2px solid transparent;transition:all .2s;}
  .chip.sel{border-color:white;transform:scale(1.05);}

  /* ALERT */
  .alert{padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:16px;}
  .alert-err{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:var(--danger);}
  .alert-ok {background:rgba(52,211,153,.1); border:1px solid rgba(52,211,153,.3); color:var(--success);}

  /* SPINNER */
  .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);
    border-top-color:var(--accent2);border-radius:50%;animation:spin .7s linear infinite;}

  @keyframes fadeIn {from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes spin   {to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
`;

// ════════════════════════════════════════════════════════════
//  INPUT CONTRASEÑA con ojo
// ════════════════════════════════════════════════════════════
function PassInput({ value, onChange, placeholder = "••••••••", required }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pass-wrap">
      <input className="fi" type={show ? "text" : "password"}
        value={value} onChange={onChange} placeholder={placeholder} required={required} />
      <button type="button" className="pass-eye" onClick={() => setShow(s => !s)}>
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  FUERZA DE CONTRASEÑA
// ════════════════════════════════════════════════════════════
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Muy débil", "Débil", "Regular", "Buena", "Fuerte"];
  const colors = ["#f87171", "#f87171", "#fbbf24", "#34d399", "#34d399"];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:4, borderRadius:2,
            background: i < score ? colors[score] : "var(--border)",
            transition: "background .3s" }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[score] }}>{labels[score]}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const auth = await sbAuth(email, pass);
      // Buscar perfil
      const perfil = await sbSelect("terapeutas", `?auth_user_id=eq.${auth.user.id}`);
      if (!perfil?.[0]) throw new Error("Perfil no encontrado. Contactá al administrador.");
      if (!perfil[0].activo) throw new Error("Tu cuenta está desactivada.");
      onLogin(perfil[0]);
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="wrap">
      <div className="box">
        <div className="logo">🌿 Sistema de Turnos</div>
        <div className="sub">Acceso al sistema de gestión terapéutica</div>
        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label className="fl">Email</label>
            <input className="fi" type="email" value={email}
              onChange={e=>{setEmail(e.target.value);setError("");}}
              placeholder="tu@email.com" required autoFocus />
          </div>
          <div className="fg">
            <label className="fl">Contraseña</label>
            <PassInput value={pass} onChange={e=>{setPass(e.target.value);setError("");}} required />
          </div>
          {error && <div className="alert alert-err">⚠ {error}</div>}
          <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}}
            type="submit" disabled={loading}>
            {loading ? <><span className="spinner"/> Verificando...</> : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MODAL NUEVO / EDITAR USUARIO
// ════════════════════════════════════════════════════════════
function ModalUsuario({ usuario, onClose, onGuardado }) {
  const esEdicion = !!usuario;
  const [form, setForm] = useState({
    nombre:       usuario?.nombre        || "",
    email:        usuario?.email         || "",
    password:     "",
    confirmPass:  "",
    rol:          usuario?.rol           || "terapeuta",
    color:        usuario?.color         || "#6366f1",
    especialidades: usuario?.especialidades || [],
    descripcion:  usuario?.descripcion   || "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [ok,      setOk]      = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function toggleEsp(e) {
    setForm(f => ({
      ...f,
      especialidades: f.especialidades.includes(e)
        ? f.especialidades.filter(x => x !== e)
        : [...f.especialidades, e]
    }));
  }

  async function guardar() {
    setError(""); setOk("");
    if (!form.nombre.trim()) return setError("El nombre es requerido.");
    if (!form.email.trim())  return setError("El email es requerido.");
    if (!esEdicion && !form.password) return setError("La contraseña es requerida.");
    if (form.password && form.password !== form.confirmPass)
      return setError("Las contraseñas no coinciden.");
    if (form.password && form.password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres.");

    setLoading(true);
    try {
      if (esEdicion) {
        // Actualizar datos del perfil
        await sbPatch("terapeutas", usuario.id, {
          nombre:        form.nombre,
          rol:           form.rol,
          color:         form.color,
          especialidades:form.especialidades,
          descripcion:   form.descripcion,
        });
        // Cambiar contraseña si se ingresó una nueva
        if (form.password) {
          await sbRpc("cambiar_password_usuario", {
            p_user_id:         usuario.auth_user_id,
            p_nueva_password:  form.password,
          });
        }
        setOk("Usuario actualizado correctamente.");
      } else {
        // Crear nuevo usuario usando la función de BD
        await sbRpc("crear_usuario_sistema", {
          p_email:        form.email,
          p_password:     form.password,
          p_nombre:       form.nombre,
          p_rol:          form.rol,
          p_color:        form.color,
          p_especialidades: form.especialidades,
          p_descripcion:  form.descripcion,
        });
        setOk(`Usuario ${form.nombre} creado correctamente.`);
      }
      setTimeout(() => { onGuardado(); onClose(); }, 1200);
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 className="mtitle" style={{marginBottom:0}}>
            {esEdicion ? "✏️ Editar usuario" : "➕ Nuevo usuario"}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-err">⚠ {error}</div>}
        {ok    && <div className="alert alert-ok">✓ {ok}</div>}

        <div className="fr">
          <div className="fg">
            <label className="fl">Nombre real</label>
            <input className="fi" placeholder="Ej: Carolina Vega" value={form.nombre}
              onChange={e=>set("nombre",e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Email (usuario)</label>
            <input className="fi" type="email" placeholder="carolina@sentir.fun"
              value={form.email} onChange={e=>set("email",e.target.value)}
              disabled={esEdicion} style={esEdicion?{opacity:.6}:{}} />
          </div>
        </div>

        <div className="fr">
          <div className="fg">
            <label className="fl">{esEdicion ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
            <PassInput value={form.password}
              onChange={e=>set("password",e.target.value)}
              placeholder={esEdicion?"Dejar vacío para no cambiar":"Mínimo 6 caracteres"}
              required={!esEdicion} />
            <PasswordStrength password={form.password} />
          </div>
          <div className="fg">
            <label className="fl">Confirmar contraseña</label>
            <PassInput value={form.confirmPass}
              onChange={e=>set("confirmPass",e.target.value)}
              placeholder="Repetir contraseña"
              required={!esEdicion} />
            {form.confirmPass && form.password !== form.confirmPass && (
              <div style={{fontSize:11,color:"var(--danger)",marginTop:6}}>Las contraseñas no coinciden</div>
            )}
          </div>
        </div>

        <div className="fr">
          <div className="fg">
            <label className="fl">Rol en el sistema</label>
            <select className="fs" value={form.rol} onChange={e=>set("rol",e.target.value)}>
              <option value="terapeuta">Terapeuta</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="fg">
            <label className="fl">Color identificador</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingTop:4}}>
              {COLORES.map(c=>(
                <div key={c} onClick={()=>set("color",c)}
                  style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",
                    border:form.color===c?"3px solid white":"3px solid transparent",transition:"all .2s"}}/>
              ))}
            </div>
          </div>
        </div>

        <div className="fg">
          <label className="fl">Especialidades</label>
          <div className="chips">
            {SERVICIOS_LABELS.map(e=>(
              <div key={e} className={`chip ${form.especialidades.includes(e)?"sel":""}`}
                style={{
                  background: form.especialidades.includes(e) ? form.color+"44" : "var(--surface2)",
                  color: form.especialidades.includes(e) ? form.color : "var(--text2)",
                  borderColor: form.especialidades.includes(e) ? form.color : "transparent"
                }}
                onClick={()=>toggleEsp(e)}>
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="fg">
          <label className="fl">Descripción / Bio</label>
          <textarea className="fta" placeholder="Breve descripción del terapeuta..."
            value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} />
        </div>

        {/* Preview del usuario */}
        <div style={{background:"var(--surface2)",borderRadius:12,padding:"14px 16px",
          display:"flex",alignItems:"center",gap:14,marginBottom:4}}>
          <div className="av" style={{width:44,height:44,fontSize:18,
            background:form.color+"33",color:form.color}}>
            {form.nombre?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:15}}>{form.nombre||"Nombre del usuario"}</div>
            <div style={{fontSize:12,color:"var(--text2)"}}>{form.email||"email@dominio.com"} · {form.rol}</div>
          </div>
          <span className={`badge ${form.rol==="admin"?"badge-admin":"badge-ter"}`}
            style={{marginLeft:"auto"}}>{form.rol}</span>
        </div>

        <div className="fa">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={loading}>
            {loading ? <><span className="spinner"/> Guardando...</> : "💾 Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MODAL CAMBIAR MI CONTRASEÑA
// ════════════════════════════════════════════════════════════
function ModalMiPassword({ usuario, onClose }) {
  const [actual,    setActual]    = useState("");
  const [nueva,     setNueva]     = useState("");
  const [confirma,  setConfirma]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [ok,        setOk]        = useState("");

  async function cambiar() {
    setError(""); setOk("");
    if (!actual)  return setError("Ingresá tu contraseña actual.");
    if (!nueva)   return setError("Ingresá la nueva contraseña.");
    if (nueva.length < 6) return setError("La nueva contraseña debe tener al menos 6 caracteres.");
    if (nueva !== confirma) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    try {
      // Verificar contraseña actual intentando login
      await sbAuth(usuario.email, actual);
      // Cambiar contraseña via API Auth
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${_token}` },
        body: JSON.stringify({ password: nueva }),
      });
      if (!r.ok) throw new Error("No se pudo cambiar la contraseña.");
      setOk("¡Contraseña actualizada correctamente!");
      setTimeout(onClose, 1500);
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 className="mtitle" style={{marginBottom:0}}>🔑 Cambiar contraseña</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-err">⚠ {error}</div>}
        {ok    && <div className="alert alert-ok">✓ {ok}</div>}
        <div className="fg">
          <label className="fl">Contraseña actual</label>
          <PassInput value={actual} onChange={e=>setActual(e.target.value)} placeholder="Tu contraseña actual" />
        </div>
        <div className="fg">
          <label className="fl">Nueva contraseña</label>
          <PassInput value={nueva} onChange={e=>setNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
          <PasswordStrength password={nueva} />
        </div>
        <div className="fg">
          <label className="fl">Confirmar nueva contraseña</label>
          <PassInput value={confirma} onChange={e=>setConfirma(e.target.value)} placeholder="Repetir nueva contraseña" />
        </div>
        <div className="fa">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={cambiar} disabled={loading}>
            {loading ? <><span className="spinner"/> Cambiando...</> : "Cambiar contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  PANEL GESTIÓN DE USUARIOS (solo admin)
// ════════════════════════════════════════════════════════════
function GestionUsuarios({ usuarioActual, usuarios, onRecargar }) {
  const [modal,    setModal]    = useState(false);
  const [editando, setEditando] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol,setFiltroRol]= useState("todos");

  const filtrados = usuarios
    .filter(u => filtroRol === "todos" || u.rol === filtroRol)
    .filter(u => !busqueda ||
      u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase())
    );

  async function toggleActivo(u) {
    setLoading(true);
    try {
      await sbPatch("terapeutas", u.id, { activo: !u.activo });
      onRecargar();
    } catch(err) { setError(err.message); }
    setLoading(false);
    setConfirm(null);
  }

  const stats = [
    { label:"Total usuarios",   val:usuarios.length,                          c:"var(--accent)"  },
    { label:"Terapeutas",       val:usuarios.filter(u=>u.rol==="terapeuta").length, c:"var(--accent2)"},
    { label:"Activos",          val:usuarios.filter(u=>u.activo).length,      c:"var(--success)" },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="sg">
        {stats.map((s,i)=>(
          <div key={i} className="sc" style={{"--c":s.c}}>
            <div className="sv">{s.val}</div>
            <div className="sl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros + buscador */}
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <input className="fi" style={{maxWidth:280}} placeholder="🔍 Buscar por nombre o email..."
          value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
        <div style={{display:"flex",gap:6}}>
          {["todos","admin","terapeuta"].map(f=>(
            <button key={f} className={`btn btn-sm ${filtroRol===f?"btn-primary":"btn-ghost"}`}
              onClick={()=>setFiltroRol(f)} style={{textTransform:"capitalize"}}>{f}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" style={{marginLeft:"auto"}}
          onClick={()=>{ setEditando(null); setModal(true); }}>
          ➕ Nuevo usuario
        </button>
      </div>

      {error && <div className="alert alert-err" style={{marginBottom:16}}>⚠ {error}</div>}

      {/* Tabla */}
      <div className="card" style={{padding:0}}>
        <table>
          <thead><tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Especialidades</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr></thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text2)",padding:32}}>
                Sin usuarios para mostrar
              </td></tr>
            )}
            {filtrados.map(u=>(
              <tr key={u.id}>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div className="av" style={{width:40,height:40,fontSize:16,
                      background:u.color+"33",color:u.color}}>
                      {u.nombre?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:600}}>{u.nombre}</div>
                      {u.descripcion && (
                        <div style={{fontSize:11,color:"var(--text2)",maxWidth:180,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {u.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{color:"var(--text2)",fontSize:13}}>{u.email}</td>
                <td>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {(u.especialidades||[]).slice(0,2).map((e,i)=>(
                      <span key={i} style={{background:u.color+"22",color:u.color,
                        padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>
                        {e}
                      </span>
                    ))}
                    {(u.especialidades||[]).length > 2 && (
                      <span style={{fontSize:11,color:"var(--text2)"}}>
                        +{u.especialidades.length-2}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`badge ${u.rol==="admin"?"badge-admin":"badge-ter"}`}>
                    {u.rol}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.activo?"badge-on":"badge-off"}`}>
                    {u.activo?"Activo":"Inactivo"}
                  </span>
                </td>
                <td>
                  <div style={{display:"flex",gap:6}}>
                    <button className="btn btn-warn btn-sm"
                      onClick={()=>{ setEditando(u); setModal(true); }}>
                      ✏️
                    </button>
                    {u.id !== usuarioActual.id && (
                      <button className={`btn btn-sm ${u.activo?"btn-danger":"btn-success"}`}
                        onClick={()=>setConfirm(u)} disabled={loading}>
                        {u.activo ? "🚫" : "✓"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <ModalUsuario
          usuario={editando}
          onClose={()=>{ setModal(false); setEditando(null); }}
          onGuardado={onRecargar}
        />
      )}

      {/* Confirmación desactivar */}
      {confirm && (
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setConfirm(null)}>
          <div className="modal" style={{maxWidth:400}}>
            <h2 className="mtitle">
              {confirm.activo?"🚫 Desactivar usuario":"✓ Activar usuario"}
            </h2>
            <p style={{fontSize:14,color:"var(--text2)",marginBottom:24,lineHeight:1.7}}>
              {confirm.activo
                ? `¿Estás seguro de desactivar a ${confirm.nombre}? No podrá ingresar al sistema.`
                : `¿Activar la cuenta de ${confirm.nombre}?`
              }
            </p>
            <div className="fa">
              <button className="btn btn-ghost" onClick={()=>setConfirm(null)}>Cancelar</button>
              <button className={`btn ${confirm.activo?"btn-danger":"btn-success"}`}
                onClick={()=>toggleActivo(confirm)} disabled={loading}>
                {loading ? <><span className="spinner"/>...</> : (confirm.activo?"Desactivar":"Activar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MI PERFIL
// ════════════════════════════════════════════════════════════
function MiPerfil({ usuario, onActualizado }) {
  const [form,    setForm]    = useState({
    nombre:      usuario.nombre      || "",
    telefono:    usuario.telefono    || "",
    descripcion: usuario.descripcion || "",
    color:       usuario.color       || "#6366f1",
    especialidades: usuario.especialidades || [],
  });
  const [loading, setLoading] = useState(false);
  const [ok,      setOk]      = useState("");
  const [error,   setError]   = useState("");
  const [passModal,setPassModal]=useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  function toggleEsp(e) {
    setForm(f=>({
      ...f,
      especialidades: f.especialidades.includes(e)
        ? f.especialidades.filter(x=>x!==e)
        : [...f.especialidades, e]
    }));
  }

  async function guardar() {
    setLoading(true); setError(""); setOk("");
    try {
      await sbPatch("terapeutas", usuario.id, {
        nombre:        form.nombre,
        telefono:      form.telefono,
        descripcion:   form.descripcion,
        color:         form.color,
        especialidades:form.especialidades,
      });
      setOk("Perfil actualizado correctamente.");
      onActualizado({ ...usuario, ...form });
    } catch(err) { setError(err.message); }
    setLoading(false);
  }

  return (
    <div style={{maxWidth:640}}>
      {/* Encabezado perfil */}
      <div className="card" style={{marginBottom:20,display:"flex",alignItems:"center",gap:20}}>
        <div className="av" style={{width:72,height:72,fontSize:28,
          background:form.color+"33",color:form.color}}>
          {form.nombre?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:20}}>{form.nombre}</div>
          <div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{usuario.email}</div>
          <span className={`badge ${usuario.rol==="admin"?"badge-admin":"badge-ter"}`}
            style={{marginTop:8,display:"inline-flex"}}>
            {usuario.rol}
          </span>
        </div>
        <button className="btn btn-warn btn-sm" style={{marginLeft:"auto"}}
          onClick={()=>setPassModal(true)}>
          🔑 Cambiar contraseña
        </button>
      </div>

      <div className="card">
        <div className="ct">Datos del perfil</div>
        {error && <div className="alert alert-err">⚠ {error}</div>}
        {ok    && <div className="alert alert-ok">✓ {ok}</div>}

        <div className="fr">
          <div className="fg">
            <label className="fl">Nombre real</label>
            <input className="fi" value={form.nombre} onChange={e=>set("nombre",e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Teléfono</label>
            <input className="fi" placeholder="+54 9 ..." value={form.telefono}
              onChange={e=>set("telefono",e.target.value)} />
          </div>
        </div>

        <div className="fg">
          <label className="fl">Descripción / Bio</label>
          <textarea className="fta" value={form.descripcion}
            onChange={e=>set("descripcion",e.target.value)}
            placeholder="Breve descripción de tu práctica..." />
        </div>

        <div className="fg">
          <label className="fl">Especialidades</label>
          <div className="chips">
            {SERVICIOS_LABELS.map(e=>(
              <div key={e} className={`chip ${form.especialidades.includes(e)?"sel":""}`}
                style={{
                  background: form.especialidades.includes(e) ? form.color+"44" : "var(--surface2)",
                  color: form.especialidades.includes(e) ? form.color : "var(--text2)",
                  borderColor: form.especialidades.includes(e) ? form.color : "transparent"
                }}
                onClick={()=>toggleEsp(e)}>
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="fg">
          <label className="fl">Color identificador</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {COLORES.map(c=>(
              <div key={c} onClick={()=>set("color",c)}
                style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",
                  border:form.color===c?"3px solid white":"3px solid transparent",transition:"all .2s"}}/>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={guardar} disabled={loading}>
          {loading ? <><span className="spinner"/> Guardando...</> : "💾 Guardar cambios"}
        </button>
      </div>

      {passModal && (
        <ModalMiPassword usuario={usuario} onClose={()=>setPassModal(false)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function SistemaUsuarios() {
  const [usuario,  setUsuario]  = useState(null);
  const [vista,    setVista]    = useState("usuarios");
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(()=>{
    // Intentar restaurar sesión
    const token = localStorage.getItem("sb_token");
    const uid   = localStorage.getItem("sb_user_id");
    if (token && uid) {
      _token = token;
      sbSelect("terapeutas", `?auth_user_id=eq.${uid}`)
        .then(data => {
          if (data?.[0]?.activo) setUsuario(data[0]);
          else { localStorage.clear(); }
        })
        .catch(()=>localStorage.clear())
        .finally(()=>setCargando(false));
    } else {
      setCargando(false);
    }
  },[]);

  async function cargarUsuarios() {
    try {
      const data = await sbSelect("terapeutas", "?order=nombre.asc");
      setUsuarios(data || []);
    } catch(e) { console.error(e); }
  }

  useEffect(()=>{ if(usuario) cargarUsuarios(); },[usuario]);

  async function handleLogin(u) {
    localStorage.setItem("sb_token",   _token);
    localStorage.setItem("sb_user_id", u.auth_user_id);
    setUsuario(u);
  }

  async function handleLogout() {
    await sbLogout();
    localStorage.removeItem("sb_token");
    localStorage.removeItem("sb_user_id");
    setUsuario(null);
  }

  if (cargando) return (
    <><style>{CSS}</style>
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)"}}>
      <div style={{textAlign:"center"}}>
        <div className="spinner" style={{width:40,height:40,borderWidth:3,margin:"0 auto 16px"}}/>
        <div style={{color:"var(--text2)",fontSize:14}}>Cargando sistema...</div>
      </div>
    </div></>
  );

  if (!usuario) return (
    <><style>{CSS}</style><Login onLogin={handleLogin}/></>
  );

  const esAdmin = usuario.rol === "admin";

  const nav = [
    ...(esAdmin ? [
      { sec:"Administración", id:"usuarios",   icon:"👥", label:"Gestión de usuarios" },
    ] : []),
    { sec: esAdmin ? null : "Mi cuenta", id:"perfil", icon:"👤", label:"Mi perfil" },
  ];

  const titles = { usuarios:"Gestión de usuarios", perfil:"Mi perfil" };

  return (
    <><style>{CSS}</style>
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🌿 Sentir</h1>
          <p>Sistema de Turnos</p>
        </div>

        <div className="s-user">
          <div className="av" style={{width:36,height:36,fontSize:15,
            background:usuario.color+"33",color:usuario.color}}>
            {usuario.nombre?.[0]}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div className="s-name" style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {usuario.nombre}
            </div>
            <div className="s-role">{usuario.rol}</div>
          </div>
        </div>

        {nav.map((item,i)=>(
          <span key={i}>
            {item.sec && <div className="nav-sec">{item.sec}</div>}
            <div className={`nav-item ${vista===item.id?"active":""}`}
              onClick={()=>setVista(item.id)}>
              <span style={{fontSize:17,width:20,textAlign:"center"}}>{item.icon}</span>
              {item.label}
            </div>
          </span>
        ))}

        <div style={{flex:1}}/>
        <div style={{padding:"16px 20px",borderTop:"1px solid var(--border)"}}>
          <button className="btn btn-ghost btn-sm"
            style={{width:"100%",justifyContent:"center"}} onClick={handleLogout}>
            ← Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="ph">
          <h1 className="pt">{titles[vista]}</h1>
        </div>

        {vista === "usuarios" && esAdmin && (
          <GestionUsuarios
            usuarioActual={usuario}
            usuarios={usuarios}
            onRecargar={cargarUsuarios}
          />
        )}

        {vista === "perfil" && (
          <MiPerfil
            usuario={usuario}
            onActualizado={u => setUsuario(u)}
          />
        )}
      </main>
    </div></>
  );
}
