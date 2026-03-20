import { useState, useEffect, useCallback } from "react";
import {
  authLogin, authLogout, authRestoreSession, authCambiarPassword,
  getSesiones, crearSesion, actualizarSesion,
  getServicios, getTerapeutas, getClientes, getPerfilUsuario,
  dbSelect, dbInsert, dbUpdate, dbDelete
} from "../supabase.js";

const COLORES_PRESET = ["#6366f1","#8b5cf6","#a855f7","#ec4899","#14b8a6","#f59e0b","#ef4444","#10b981","#0ea5e9","#f97316"];
const DIAS   = ["Dom","Lun","Mar","Mie","Jue","Vie","Sab"];
const MESES  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const formatHora  = d  => new Date(d).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
const formatFecha = d  => { const x=new Date(d); return `${DIAS[x.getDay()]} ${x.getDate()} ${MESES[x.getMonth()]}`; };
const addMinutes  = (d,m) => new Date(new Date(d).getTime()+m*60000);
const calcFin     = (h,m) => h ? addMinutes(new Date(`2000-01-01T${h}`),m).toTimeString().slice(0,5) : "";

// ── DATOS MOCK ────────────────────────────────────────────
const USUARIOS_MOCK = [
  { id:"u0", nombre:"Admin Sistema",  email:"admin@sentir.fun",    rol:"admin",      password:"admin123",  color:"#f59e0b", activo:true, especialidades:[], descripcion:"Administrador del sistema" },
  { id:"u1", nombre:"Carolina Vega",  email:"carolina@sentir.fun", rol:"terapeuta",  password:"carol123",  color:"#6366f1", activo:true, especialidades:["Psicoterapia","Biodecodificacion"],      descripcion:"Psicologa clinica con 10 anos de experiencia" },
  { id:"u2", nombre:"Marcos Silva",   email:"marcos@sentir.fun",   rol:"terapeuta",  password:"marcos123", color:"#ec4899", activo:true, especialidades:["Coaching","Constelaciones"],              descripcion:"Coach ontologico certificado" },
  { id:"u3", nombre:"Laura Diaz",     email:"laura@sentir.fun",    rol:"terapeuta",  password:"laura123",  color:"#14b8a6", activo:true, especialidades:["Biodecodificacion","Constelaciones"],    descripcion:"Especialista en biodecodificacion emocional" },
];

const SERVICIOS_MOCK = [
  { id:"s1", nombre:"Psicoterapia",               duracion_minutos:60,  color:"#6366f1", precio:0, activo:true, descripcion:"Sesion individual de psicoterapia" },
  { id:"s2", nombre:"Biodecodificacion",           duracion_minutos:90,  color:"#8b5cf6", precio:0, activo:true, descripcion:"Sesion de biodecodificacion emocional" },
  { id:"s3", nombre:"Constelaciones Individuales", duracion_minutos:90,  color:"#a855f7", precio:0, activo:true, descripcion:"Constelaciones familiares individuales" },
  { id:"s4", nombre:"Coaching",                    duracion_minutos:60,  color:"#ec4899", precio:0, activo:true, descripcion:"Sesion de coaching personal o profesional" },
  { id:"s5", nombre:"Primera consulta",            duracion_minutos:45,  color:"#14b8a6", precio:0, activo:true, descripcion:"Consulta inicial de evaluacion" },
  { id:"s6", nombre:"Grupo terapeutico",           duracion_minutos:120, color:"#f59e0b", precio:0, activo:true, descripcion:"Sesion grupal" },
];

const CLIENTES_MOCK = [
  { id:"c1", nombre:"Maria Garcia",   telefono:"351-555-0101", email:"maria@gmail.com",   motivo_consulta:"Ansiedad cronica" },
  { id:"c2", nombre:"Juan Lopez",     telefono:"351-555-0202", email:"juan@gmail.com",    motivo_consulta:"Proceso de duelo" },
  { id:"c3", nombre:"Ana Martinez",   telefono:"351-555-0303", email:"ana@gmail.com",     motivo_consulta:"Desarrollo personal" },
  { id:"c4", nombre:"Roberto Perez",  telefono:"351-555-0404", email:"rober@gmail.com",   motivo_consulta:"Relaciones afectivas" },
  { id:"c5", nombre:"Claudia Torres", telefono:"351-555-0505", email:"claudia@gmail.com", motivo_consulta:"Estres laboral" },
];

const N = Date.now();
const SESIONES_MOCK = [
  { id:"ses1", terapeuta_id:"u1", cliente_id:"c1", servicio_id:"s1", cliente_nombre:"Maria Garcia",   cliente_telefono:"351-555-0101", estado:"confirmado", fecha_inicio:new Date(N+7200000).toISOString(),    fecha_fin:new Date(N+10800000).toISOString(),   motivo_consulta:"Ansiedad",  notas_sesion:"" },
  { id:"ses2", terapeuta_id:"u2", cliente_id:"c2", servicio_id:"s4", cliente_nombre:"Juan Lopez",     cliente_telefono:"351-555-0202", estado:"completado", fecha_inicio:new Date(N-18000000).toISOString(),   fecha_fin:new Date(N-14400000).toISOString(),   motivo_consulta:"Bloqueo",   notas_sesion:"Buena evolucion" },
  { id:"ses3", terapeuta_id:"u1", cliente_id:"c3", servicio_id:"s2", cliente_nombre:"Ana Martinez",   cliente_telefono:"351-555-0303", estado:"pendiente",  fecha_inicio:new Date(N+93600000).toISOString(),   fecha_fin:new Date(N+97200000).toISOString(),   motivo_consulta:"Duelo",     notas_sesion:"" },
  { id:"ses4", terapeuta_id:"u3", cliente_id:"c4", servicio_id:"s2", cliente_nombre:"Roberto Perez",  cliente_telefono:"351-555-0404", estado:"confirmado", fecha_inicio:new Date(N+180000000).toISOString(),  fecha_fin:new Date(N+183600000).toISOString(),  motivo_consulta:"Trauma",    notas_sesion:"" },
  { id:"ses5", terapeuta_id:"u2", cliente_id:"c5", servicio_id:"s3", cliente_nombre:"Claudia Torres", cliente_telefono:"351-555-0505", estado:"confirmado", fecha_inicio:new Date(N+266400000).toISOString(),  fecha_fin:new Date(N+270000000).toISOString(),  motivo_consulta:"Familia",   notas_sesion:"" },
  { id:"ses6", terapeuta_id:"u3", cliente_id:"c1", servicio_id:"s5", cliente_nombre:"Maria Garcia",   cliente_telefono:"351-555-0101", estado:"completado", fecha_inicio:new Date(N-86400000).toISOString(),   fecha_fin:new Date(N-83700000).toISOString(),   motivo_consulta:"Inicial",   notas_sesion:"Primera consulta OK" },
];

// ── CLAUDE API ─────────────────────────────────────────────
async function preguntarIA(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── CSS ────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{
    --bg:#0d0f14;--surface:#161920;--surface2:#1e2230;--border:#2a2f45;
    --accent:#7c6fdb;--accent2:#c084fc;--gold:#f0c060;
    --text:#e8eaf0;--text2:#8b91a8;
    --success:#34d399;--danger:#f87171;--warn:#fbbf24;
    --radius:14px;--shadow:0 4px 24px rgba(0,0,0,.4);
  }
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
  .login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse 800px 600px at 50% 0%,rgba(124,111,219,.15),transparent);}
  .login-box{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:48px;width:440px;box-shadow:0 32px 80px rgba(0,0,0,.6);}
  .login-logo{font-family:'DM Serif Display',serif;font-size:28px;color:var(--accent2);text-align:center;margin-bottom:6px;}
  .login-sub{text-align:center;font-size:13px;color:var(--text2);margin-bottom:32px;}
  .demo-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;}
  .demo-btn{padding:10px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text2);cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;transition:all .2s;text-align:center;}
  .demo-btn:hover,.demo-btn.active{border-color:var(--accent);color:var(--accent2);background:rgba(124,111,219,.1);}
  .app{display:flex;min-height:100vh;}
  .sidebar{width:252px;min-height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 0;position:fixed;left:0;top:0;bottom:0;z-index:100;}
  .sidebar-logo{padding:0 20px 20px;border-bottom:1px solid var(--border);margin-bottom:10px;}
  .sidebar-logo h1{font-family:'DM Serif Display',serif;font-size:20px;color:var(--accent2);}
  .sidebar-logo p{font-size:11px;color:var(--text2);letter-spacing:2px;text-transform:uppercase;margin-top:4px;}
  .sidebar-user{display:flex;align-items:center;gap:10px;padding:12px 20px;margin-bottom:6px;background:var(--surface2);}
  .sidebar-user-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sidebar-user-role{font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;}
  .nav-section{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text2);padding:14px 20px 5px;}
  .nav-item{display:flex;align-items:center;gap:12px;padding:11px 20px;cursor:pointer;transition:all .2s;color:var(--text2);font-size:14px;font-weight:500;border-left:3px solid transparent;}
  .nav-item:hover{background:var(--surface2);color:var(--text);}
  .nav-item.active{background:rgba(124,111,219,.12);color:var(--accent2);border-left-color:var(--accent2);}
  .nav-icon{font-size:17px;width:20px;text-align:center;}
  .main{margin-left:252px;flex:1;padding:32px;min-height:100vh;}
  .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
  .page-title{font-family:'DM Serif Display',serif;font-size:28px;}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);}
  .card-title{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text2);margin-bottom:16px;}
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
  .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px 24px;position:relative;overflow:hidden;}
  .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--c,var(--accent));}
  .stat-value{font-size:38px;font-weight:700;line-height:1;margin-bottom:6px;color:var(--c,var(--accent));}
  .stat-label{font-size:12px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:10px;border:none;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;}
  .btn-primary{background:var(--accent);color:#fff;}
  .btn-primary:hover{background:#6b5fd4;transform:translateY(-1px);box-shadow:0 4px 16px rgba(124,111,219,.4);}
  .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border);}
  .btn-ghost:hover{background:var(--surface2);color:var(--text);}
  .btn-danger{background:rgba(248,113,113,.15);color:var(--danger);border:1px solid rgba(248,113,113,.3);}
  .btn-success{background:rgba(52,211,153,.15);color:var(--success);border:1px solid rgba(52,211,153,.3);}
  .btn-warn{background:rgba(251,191,36,.15);color:var(--warn);border:1px solid rgba(251,191,36,.3);}
  .btn-sm{padding:6px 12px;font-size:13px;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:11px 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);border-bottom:1px solid var(--border);}
  td{padding:13px 16px;border-bottom:1px solid var(--border);font-size:14px;}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:rgba(255,255,255,.02);}
  .badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
  .badge-confirmado{background:rgba(52,211,153,.15);color:var(--success);}
  .badge-pendiente{background:rgba(251,191,36,.15);color:var(--warn);}
  .badge-cancelado{background:rgba(248,113,113,.15);color:var(--danger);}
  .badge-completado{background:rgba(124,111,219,.15);color:var(--accent2);}
  .badge-reprogramado{background:rgba(14,165,233,.15);color:#38bdf8;}
  .badge-admin{background:rgba(240,192,96,.15);color:var(--gold);}
  .badge-terapeuta{background:rgba(52,211,153,.15);color:var(--success);}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(6px);animation:fadeIn .2s;}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:slideUp .25s;}
  .modal-title{font-family:'DM Serif Display',serif;font-size:24px;color:var(--accent2);margin-bottom:22px;}
  .form-group{margin-bottom:18px;}
  .form-label{display:block;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;}
  .form-input,.form-select,.form-textarea{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:11px 14px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;transition:border-color .2s;}
  .form-input:focus,.form-select:focus,.form-textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,111,219,.2);}
  .form-textarea{resize:vertical;min-height:80px;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:22px;}
  .chips{display:flex;flex-wrap:wrap;gap:8px;}
  .chip{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:2px solid transparent;transition:all .2s;}
  .chip.sel{border-color:white;transform:scale(1.05);}
  .avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;}
  .horario-box{background:var(--surface2);border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:12px;font-size:13px;margin-bottom:12px;}
  .ia-box{background:linear-gradient(135deg,rgba(124,111,219,.1),rgba(192,132,252,.1));border:1px solid rgba(124,111,219,.3);border-radius:var(--radius);padding:20px;margin-top:16px;}
  .ia-box h4{font-size:13px;color:var(--accent2);font-weight:600;margin-bottom:10px;}
  .ia-resp{font-size:13px;color:var(--text2);line-height:1.7;white-space:pre-wrap;}
  .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--accent2);border-radius:50%;animation:spin .7s linear infinite;}
  .admin-tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:24px;}
  .admin-tab{padding:10px 20px;cursor:pointer;font-size:14px;font-weight:500;color:var(--text2);border-bottom:2px solid transparent;transition:all .2s;}
  .admin-tab.active{color:var(--accent2);border-bottom-color:var(--accent2);}
  .ter-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s;}
  .ter-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.3);}
  .ter-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--tc,#6366f1);}
  .cal-nav{display:flex;align-items:center;gap:16px;margin-bottom:20px;}
  .cal-nav h2{font-family:'DM Serif Display',serif;font-size:22px;flex:1;}
  .week-grid{display:grid;grid-template-columns:55px repeat(7,1fr);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
  .w-header{background:var(--surface2);padding:10px 6px;text-align:center;font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;border-bottom:1px solid var(--border);}
  .w-header.hoy{color:var(--accent2);}
  .t-slot{border-bottom:1px solid var(--border);border-right:1px solid var(--border);min-height:52px;position:relative;cursor:pointer;transition:background .15s;}
  .t-slot:hover{background:rgba(124,111,219,.05);}
  .t-label{font-size:10px;color:var(--text2);text-align:right;padding:3px 6px 0 0;border-bottom:1px solid var(--border);border-right:1px solid var(--border);min-height:52px;}
  .ses-chip{position:absolute;left:2px;right:2px;top:2px;border-radius:6px;padding:3px 6px;font-size:11px;font-weight:600;cursor:pointer;z-index:10;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;transition:transform .15s;}
  .ses-chip:hover{transform:scale(1.02);}
  .toggle{width:44px;height:24px;border-radius:12px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;}
  .toggle-dot{position:absolute;top:3px;width:18px;height:18px;border-radius:50%;background:white;transition:left .2s;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{width:5px;}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}
`;

// ══════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resetMode,setReset]    = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      // 1. Autenticar con Supabase Auth
      const authData = await authLogin(email, pass);

      // 2. Obtener perfil del usuario desde la tabla "terapeutas"
      //    (o "usuarios" si usas esa tabla)
      const perfil = await getPerfilUsuario(authData.user.id);

      if (!perfil) throw new Error("No se encontro el perfil del usuario. Contacta al administrador.");
      if (!perfil.activo) throw new Error("Tu cuenta esta desactivada. Contacta al administrador.");

      onLogin(perfil);
    } catch (err) {
      setError(err.message || "Error al iniciar sesion");
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">🌿 Agenda Terapeutica</div>
        <div className="login-sub">Sistema de gestion terapeutica</div>

        {!resetMode ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email}
                onChange={e=>{setEmail(e.target.value);setError("");}}
                placeholder="tu@email.com" required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Contrasena</label>
              <div style={{position:"relative"}}>
                <input className="form-input" type={showPass?"text":"password"} value={pass}
                  onChange={e=>{setPass(e.target.value);setError("");}}
                  placeholder="••••••••" required style={{paddingRight:44}} />
                <button type="button" onClick={()=>setShowPass(s=>!s)}
                  style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",cursor:"pointer",color:"var(--text2)",fontSize:18,padding:0,lineHeight:1}}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            {error && (
              <div style={{color:"var(--danger)",fontSize:13,marginBottom:14,padding:"10px 14px",background:"rgba(248,113,113,.1)",borderRadius:8,border:"1px solid rgba(248,113,113,.3)"}}>
                ⚠ {error}
              </div>
            )}
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} type="submit" disabled={loading}>
              {loading ? <><span className="spinner"/> Verificando...</> : "Ingresar al sistema"}
            </button>
            <div style={{textAlign:"center",marginTop:14}}>
              <button type="button" style={{background:"none",border:"none",color:"var(--text2)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}
                onClick={()=>setReset(true)}>
                Olvide mi contrasena
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{fontSize:13,color:"var(--text2)",marginBottom:20,lineHeight:1.7}}>
              Ingresa tu email y te enviaremos un link para restablecer tu contrasena.
            </p>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            {resetMsg && <div style={{color:"var(--success)",fontSize:13,marginBottom:14}}>{resetMsg}</div>}
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={async()=>{
              try {
                await fetch(`${(await import("../supabase.js")).SUPABASE_URL}/auth/v1/recover`,{
                  method:"POST",
                  headers:{"Content-Type":"application/json","apikey":(await import("../supabase.js")).SUPABASE_ANON_KEY},
                  body:JSON.stringify({email})
                });
                setResetMsg("Email enviado. Revisa tu casilla de correo.");
              } catch { setResetMsg("Error al enviar el email."); }
            }}>
              Enviar link de recuperacion
            </button>
            <div style={{textAlign:"center",marginTop:14}}>
              <button style={{background:"none",border:"none",color:"var(--text2)",fontSize:12,cursor:"pointer",textDecoration:"underline"}}
                onClick={()=>{setReset(false);setResetMsg("");}}>
                Volver al login
              </button>
            </div>
          </div>
        )}

        <div style={{marginTop:24,padding:"14px",background:"var(--surface2)",borderRadius:10,fontSize:12,color:"var(--text2)"}}>
          <strong style={{color:"var(--text)"}}>Configuracion requerida:</strong><br/>
          Antes de usar el sistema, ejecuta el SQL en Supabase<br/>
          y crea los usuarios en Authentication → Users
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL SESION (nueva + editar)
// ══════════════════════════════════════════════════════════
function ModalSesion({ sesion, usuarioActual, terapeutas, servicios, onClose, onGuardar }) {
  const esEdicion = !!sesion;
  const fechaObj  = sesion ? new Date(sesion.fecha_inicio) : new Date();
  const finObj    = sesion ? new Date(sesion.fecha_fin)    : null;
  const durIni    = sesion ? Math.round((finObj-fechaObj)/60000) : (servicios[0]?.duracion_minutos||60);

  const [form,setForm] = useState({
    terapeuta_id:    sesion?.terapeuta_id || (usuarioActual.rol==="terapeuta"?usuarioActual.id:terapeutas[0]?.id||""),
    servicio_id:     sesion?.servicio_id  || servicios[0]?.id||"",
    fecha:           fechaObj.toISOString().split("T")[0],
    hora:            `${String(fechaObj.getHours()).padStart(2,"0")}:${String(fechaObj.getMinutes()).padStart(2,"0")}`,
    duracion_minutos:durIni,
    cliente_nombre:  sesion?.cliente_nombre   ||"",
    cliente_telefono:sesion?.cliente_telefono ||"",
    cliente_email:   sesion?.cliente_email    ||"",
    motivo_consulta: sesion?.motivo_consulta  ||"",
    notas_sesion:    sesion?.notas_sesion     ||"",
    estado:          sesion?.estado           ||"confirmado",
  });

  const [paso,setPaso]           = useState(1);
  const [iaResp,setIaResp]       = useState(sesion?.anamnesis_ia||"");
  const [iaLoad,setIaLoad]       = useState(false);
  const [anamnesis,setAnamnesis] = useState({sintoma:"",emocion:"",cuando:"",intensidad:5});

  const set = (k,v) => {
    if (k==="servicio_id") {
      const s=servicios.find(x=>x.id===v);
      setForm(f=>({...f,servicio_id:v,duracion_minutos:s?.duracion_minutos||f.duracion_minutos}));
    } else { setForm(f=>({...f,[k]:v})); }
  };

  async function generarIA() {
    setIaLoad(true);
    const prompt = `Eres un asistente terapeutico empatico. Cliente: ${form.cliente_nombre}. Motivo: "${form.motivo_consulta}". Sintoma: ${anamnesis.sintoma}. Emocion: ${anamnesis.emocion}. Cuando aparecio: ${anamnesis.cuando}. Intensidad: ${anamnesis.intensidad}/10. Genera un resumen de anamnesis (3-4 lineas) y 2 preguntas clave para la sesion. Espanol, tono calido y profesional.`;
    try { const r=await preguntarIA(prompt); setIaResp(r); }
    catch { setIaResp("No se pudo conectar con la IA."); }
    setIaLoad(false);
  }

  function guardar() {
    const fi=new Date(`${form.fecha}T${form.hora}`);
    const ff=addMinutes(fi,form.duracion_minutos);
    onGuardar({...(sesion||{}),...form,fecha_inicio:fi.toISOString(),fecha_fin:ff.toISOString(),anamnesis_ia:iaResp,id:sesion?.id||Date.now().toString()});
  }

  const serv = servicios.find(s=>s.id===form.servicio_id);
  const esAdmin = usuarioActual.rol==="admin";

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:640}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <h2 className="modal-title" style={{marginBottom:0}}>{esEdicion?"Editar sesion":"Nueva Sesion"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>x</button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["1. Datos","2. Anamnesis IA"].map((t,i)=>(
            <button key={i} className={`btn btn-sm ${paso===i+1?"btn-primary":"btn-ghost"}`} onClick={()=>setPaso(i+1)}>{t}</button>
          ))}
        </div>

        {paso===1 && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Terapeuta</label>
                {esAdmin
                  ? <select className="form-select" value={form.terapeuta_id} onChange={e=>set("terapeuta_id",e.target.value)}>
                      {terapeutas.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  : <div className="form-input" style={{opacity:.7}}>{usuarioActual.nombre}</div>
                }
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.estado} onChange={e=>set("estado",e.target.value)}>
                  {["pendiente","confirmado","completado","cancelado","reprogramado"].map(e=>(
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Terapia</label>
              <div className="chips">
                {servicios.filter(s=>s.activo).map(s=>(
                  <div key={s.id} className={`chip ${form.servicio_id===s.id?"sel":""}`}
                    style={{background:s.color+"33",color:s.color,borderColor:form.servicio_id===s.id?s.color:"transparent"}}
                    onClick={()=>set("servicio_id",s.id)}>
                    {s.nombre} - {s.duracion_minutos}min
                  </div>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-input" value={form.fecha} onChange={e=>set("fecha",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Hora inicio</label>
                <input type="time" className="form-input" value={form.hora} onChange={e=>set("hora",e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duracion (minutos)</label>
                <input type="number" className="form-input" min={15} max={240} step={15} value={form.duracion_minutos} onChange={e=>set("duracion_minutos",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Hora fin (calculada)</label>
                <input className="form-input" readOnly style={{opacity:.6}} value={calcFin(form.hora,form.duracion_minutos)} />
              </div>
            </div>
            {form.hora && (
              <div className="horario-box">
                <span style={{color:"var(--text2)"}}>Horario:</span>
                <strong style={{color:"var(--accent2)"}}>{form.hora} - {calcFin(form.hora,form.duracion_minutos)}</strong>
                <span style={{color:"var(--text2)"}}>({form.duracion_minutos} min - {serv?.nombre})</span>
              </div>
            )}

            <hr style={{border:"none",borderTop:"1px solid var(--border)",margin:"4px 0 18px"}} />

            <div className="form-group">
              <label className="form-label">Nombre del cliente</label>
              <input className="form-input" placeholder="Nombre completo" value={form.cliente_nombre} onChange={e=>set("cliente_nombre",e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Telefono</label>
                <input className="form-input" placeholder="+54 9 ..." value={form.cliente_telefono} onChange={e=>set("cliente_telefono",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.cliente_email} onChange={e=>set("cliente_email",e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Motivo de consulta</label>
              <textarea className="form-textarea" value={form.motivo_consulta} onChange={e=>set("motivo_consulta",e.target.value)} placeholder="Que trae el cliente?" />
            </div>
            {esEdicion && (
              <div className="form-group">
                <label className="form-label">Notas de sesion</label>
                <textarea className="form-textarea" style={{minHeight:90}} value={form.notas_sesion} onChange={e=>set("notas_sesion",e.target.value)} placeholder="Observaciones, evolucion, proximos pasos..." />
              </div>
            )}
          </>
        )}

        {paso===2 && (
          <>
            <p style={{fontSize:13,color:"var(--text2)",marginBottom:20,lineHeight:1.7}}>
              Completa el pre-analisis. La IA generara un resumen y preguntas clave para la sesion.
            </p>
            {[["sintoma","Que sintoma desea trabajar?","Ej: ansiedad, dolor de espalda..."],
              ["emocion","Que emocion siente asociada?","Ej: miedo, tristeza, culpa..."],
              ["cuando", "Cuando aparecio?","Ej: hace 2 anos, desde nino..."]
            ].map(([k,lbl,ph])=>(
              <div key={k} className="form-group">
                <label className="form-label">{lbl}</label>
                <input className="form-input" placeholder={ph} value={anamnesis[k]} onChange={e=>setAnamnesis(a=>({...a,[k]:e.target.value}))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Intensidad percibida: <strong style={{color:"var(--accent2)"}}>{anamnesis.intensidad}/10</strong></label>
              <input type="range" min={1} max={10} value={anamnesis.intensidad} onChange={e=>setAnamnesis(a=>({...a,intensidad:+e.target.value}))} style={{width:"100%",accentColor:"var(--accent)"}} />
            </div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={generarIA} disabled={iaLoad}>
              {iaLoad ? <><span className="spinner"/> Analizando...</> : "Generar analisis con IA"}
            </button>
            {iaResp && (
              <div className="ia-box">
                <h4>Analisis IA</h4>
                <div className="ia-resp">{iaResp}</div>
              </div>
            )}
          </>
        )}

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar}>{esEdicion?"Guardar cambios":"Crear sesion"}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL DETALLE
// ══════════════════════════════════════════════════════════
function ModalDetalle({ sesion, terapeutas, servicios, onClose, onEditar, onCompletar, onCancelar, onEliminar }) {
  const serv = servicios.find(s=>s.id===sesion.servicio_id);
  const ter  = terapeutas.find(t=>t.id===sesion.terapeuta_id);
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:500}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 className="modal-title" style={{marginBottom:0}}>Detalle de sesion</h2>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-warn btn-sm" onClick={onEditar}>Editar</button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>x</button>
          </div>
        </div>

        <div style={{background:(serv?.color||"#6366f1")+"22",borderRadius:10,padding:"14px 18px",marginBottom:20,borderLeft:`4px solid ${serv?.color||"#6366f1"}`}}>
          <div style={{fontWeight:700,fontSize:16}}>{sesion.cliente_nombre}</div>
          <div style={{fontSize:13,color:"var(--text2)",marginTop:4}}>{serv?.nombre} - {formatFecha(sesion.fecha_inicio)}</div>
        </div>

        <div style={{display:"grid",gap:12,fontSize:14}}>
          {[
            ["Horario",  `${formatHora(sesion.fecha_inicio)} - ${formatHora(sesion.fecha_fin)}`],
            ["Terapeuta",ter?.nombre||"---"],
            ["Tel",      sesion.cliente_telefono],
            ["Email",    sesion.cliente_email],
            ["Motivo",   sesion.motivo_consulta],
          ].filter(([,v])=>v).map(([k,v],i)=>(
            <div key={i} style={{display:"flex",gap:8}}>
              <span style={{color:"var(--text2)",minWidth:80,flexShrink:0}}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{color:"var(--text2)",minWidth:80}}>Estado</span>
            <span className={`badge badge-${sesion.estado}`}>{sesion.estado}</span>
          </div>
          {sesion.notas_sesion && (
            <div style={{background:"var(--surface2)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"var(--text2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Notas</div>
              <div style={{fontSize:13,lineHeight:1.7}}>{sesion.notas_sesion}</div>
            </div>
          )}
          {sesion.anamnesis_ia && (
            <div className="ia-box">
              <h4>Analisis IA previo</h4>
              <div className="ia-resp">{sesion.anamnesis_ia}</div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          {sesion.estado!=="cancelado"  && <button className="btn btn-danger  btn-sm" onClick={()=>onCancelar(sesion.id)}>x Cancelar</button>}
          {sesion.estado!=="completado" && sesion.estado!=="cancelado" && (
            <button className="btn btn-success" onClick={()=>onCompletar(sesion.id)}>Completada</button>
          )}
          <button className="btn btn-danger btn-sm" onClick={()=>onEliminar(sesion.id)}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  CALENDARIO
// ══════════════════════════════════════════════════════════
function Calendario({ sesiones, terapeutas, servicios, onNueva, onVer }) {
  const [lunes,setLunes] = useState(()=>{
    const h=new Date(); h.setHours(0,0,0,0);
    const l=new Date(h); l.setDate(h.getDate()-((h.getDay()+6)%7)); return l;
  });
  const horas = Array.from({length:13},(_,i)=>i+8);
  const dias  = Array.from({length:7},(_,i)=>{ const d=new Date(lunes); d.setDate(lunes.getDate()+i); return d; });
  const hoy   = new Date(); hoy.setHours(0,0,0,0);
  const nav   = d=>setLunes(l=>{ const n=new Date(l); n.setDate(l.getDate()+d*7); return n; });
  const servMap=Object.fromEntries(servicios.map(s=>[s.id,s]));

  function getSes(dia,hora){
    return sesiones.filter(s=>{
      const f=new Date(s.fecha_inicio);
      return f.getFullYear()===dia.getFullYear()&&f.getMonth()===dia.getMonth()&&f.getDate()===dia.getDate()&&f.getHours()===hora;
    });
  }

  return (
    <div>
      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm" onClick={()=>nav(-1)}>Anterior</button>
        <h2>{MESES[lunes.getMonth()]} {lunes.getFullYear()}</h2>
        <button className="btn btn-ghost btn-sm" onClick={()=>nav(1)}>Siguiente</button>
        <button className="btn btn-primary btn-sm" onClick={()=>onNueva()}>+ Nueva</button>
      </div>
      <div className="week-grid">
        <div className="w-header"/>
        {dias.map((d,i)=>(
          <div key={i} className={`w-header ${d.getTime()===hoy.getTime()?"hoy":""}`}>
            {DIAS[d.getDay()]}<br/>
            <span style={{fontSize:18,fontFamily:"'DM Serif Display',serif",color:d.getTime()===hoy.getTime()?"var(--accent2)":"inherit"}}>{d.getDate()}</span>
          </div>
        ))}
        {horas.map(h=>(
          <>
            <div key={`l${h}`} className="t-label">{h}:00</div>
            {dias.map((d,di)=>{
              const ss=getSes(d,h);
              return (
                <div key={`${h}${di}`} className="t-slot" onClick={()=>onNueva(d.toISOString().split("T")[0],`${String(h).padStart(2,"0")}:00`)}>
                  {ss.map(s=>{
                    const sv=servMap[s.servicio_id];
                    return (
                      <div key={s.id} className="ses-chip"
                        style={{background:(sv?.color||"#6366f1")+"33",color:sv?.color||"#a5b4fc",borderLeft:`3px solid ${sv?.color||"#6366f1"}`}}
                        onClick={e=>{e.stopPropagation();onVer(s);}}>
                        {s.cliente_nombre} - {sv?.nombre}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  LISTA SESIONES
// ══════════════════════════════════════════════════════════
function ListaSesiones({ sesiones, terapeutas, servicios, usuarioActual, onVer, onCambiarEstado }) {
  const [filtro,setFiltro]   = useState("todas");
  const [busqueda,setBusqueda]=useState("");
  const servMap=Object.fromEntries(servicios.map(s=>[s.id,s]));
  const terMap =Object.fromEntries(terapeutas.map(t=>[t.id,t]));

  const filtradas=sesiones
    .filter(s=>filtro==="todas"||s.estado===filtro)
    .filter(s=>!busqueda||s.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a,b)=>new Date(b.fecha_inicio)-new Date(a.fecha_inicio));

  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center",flexWrap:"wrap"}}>
        <input className="form-input" style={{maxWidth:260}} placeholder="Buscar cliente..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} />
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["todas","confirmado","pendiente","completado","cancelado"].map(f=>(
            <button key={f} className={`btn btn-sm ${filtro===f?"btn-primary":"btn-ghost"}`} onClick={()=>setFiltro(f)} style={{textTransform:"capitalize"}}>{f}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:0}}>
        <table>
          <thead><tr>
            <th>Fecha / Hora</th><th>Cliente</th><th>Terapia</th>
            {usuarioActual.rol==="admin" && <th>Terapeuta</th>}
            <th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            {filtradas.length===0 && <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text2)",padding:32}}>Sin sesiones</td></tr>}
            {filtradas.map(s=>{
              const sv=servMap[s.servicio_id];
              const tr=terMap[s.terapeuta_id];
              return (
                <tr key={s.id}>
                  <td>
                    <div style={{fontWeight:600}}>{formatFecha(s.fecha_inicio)}</div>
                    <div style={{fontSize:12,color:"var(--text2)"}}>{formatHora(s.fecha_inicio)} - {formatHora(s.fecha_fin)}</div>
                  </td>
                  <td>
                    <div style={{fontWeight:500}}>{s.cliente_nombre}</div>
                    <div style={{fontSize:12,color:"var(--text2)"}}>{s.cliente_telefono}</div>
                  </td>
                  <td>
                    <span style={{background:(sv?.color||"#6366f1")+"22",color:sv?.color||"#a5b4fc",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{sv?.nombre||"---"}</span>
                  </td>
                  {usuarioActual.rol==="admin" && (
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div className="avatar" style={{width:28,height:28,fontSize:11,background:(tr?.color||"#6366f1")+"33",color:tr?.color||"#a5b4fc"}}>{tr?.nombre?.[0]}</div>
                        <span style={{fontSize:13}}>{tr?.nombre||"---"}</span>
                      </div>
                    </td>
                  )}
                  <td><span className={`badge badge-${s.estado}`}>{s.estado}</span></td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>onVer(s)}>Ver</button>
                      {s.estado!=="completado"&&s.estado!=="cancelado"&&(
                        <button className="btn btn-success btn-sm" onClick={()=>onCambiarEstado(s.id,"completado")}>OK</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function Dashboard({ sesiones, clientes, terapeutas, servicios, usuarioActual }) {
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const fin=new Date(hoy); fin.setDate(hoy.getDate()+7);
  const sesHoy   =sesiones.filter(s=>{ const f=new Date(s.fecha_inicio); f.setHours(0,0,0,0); return f.getTime()===hoy.getTime(); });
  const proximas =sesiones.filter(s=>{ const f=new Date(s.fecha_inicio); return f>=hoy&&f<=fin&&s.estado!=="cancelado"; }).sort((a,b)=>new Date(a.fecha_inicio)-new Date(b.fecha_inicio));
  const completadas=sesiones.filter(s=>s.estado==="completado").length;
  const servMap=Object.fromEntries(servicios.map(s=>[s.id,s]));
  const terMap =Object.fromEntries(terapeutas.map(t=>[t.id,t]));

  return (
    <div>
      <div className="stats-grid">
        {[
          {label:"Sesiones hoy",val:sesHoy.length,    c:"var(--accent)"},
          {label:"Esta semana", val:proximas.length,   c:"var(--accent2)"},
          {label:"Completadas", val:completadas,       c:"var(--success)"},
          {label:"Clientes",    val:clientes.length,   c:"var(--gold)"},
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{"--c":s.c}}>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:20}}>
        <div className="card">
          <div className="card-title">Proximas sesiones</div>
          {proximas.length===0 && <div style={{color:"var(--text2)",fontSize:13}}>Sin sesiones proximas</div>}
          {proximas.slice(0,7).map(s=>{
            const sv=servMap[s.servicio_id];
            const tr=terMap[s.terapeuta_id];
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:3,height:40,borderRadius:2,background:sv?.color||"var(--accent)",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14}}>{s.cliente_nombre}</div>
                  <div style={{fontSize:12,color:"var(--text2)"}}>{sv?.nombre} - {formatFecha(s.fecha_inicio)} {formatHora(s.fecha_inicio)}</div>
                </div>
                {usuarioActual.rol==="admin" && (
                  <div className="avatar" style={{width:30,height:30,fontSize:11,background:(tr?.color||"#6366f1")+"33",color:tr?.color||"#a5b4fc"}}>{tr?.nombre?.[0]}</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-title">Terapias mas solicitadas</div>
          {servicios.map(sv=>{
            const qty=sesiones.filter(s=>s.servicio_id===sv.id).length;
            const max=Math.max(...servicios.map(s=>sesiones.filter(x=>x.servicio_id===s.id).length),1);
            return (
              <div key={sv.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                  <span style={{color:sv.color,fontWeight:600}}>{sv.nombre}</span>
                  <span style={{color:"var(--text2)"}}>{qty}</span>
                </div>
                <div style={{height:5,background:"var(--surface2)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${(qty/max)*100}%`,height:"100%",background:sv.color,borderRadius:3,transition:"width .6s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MODAL EDITAR CLIENTE
// ══════════════════════════════════════════════════════════
function ModalEditarCliente({ cliente, onClose, onGuardar }) {
  const [form, setForm] = useState({
    nombre: cliente.nombre||"",
    telefono: cliente.telefono||"",
    email: cliente.email||"",
    edad: cliente.edad||"",
    fecha_nacimiento: cliente.fecha_nacimiento||"",
    genero: cliente.genero||"",
    lugar_residencia: cliente.lugar_residencia||"",
    lugar_origen: cliente.lugar_origen||"",
    motivo_consulta: cliente.motivo_consulta||"",
    emociones_actuales: cliente.emociones_actuales||"",
    notas: cliente.notas||"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const [guardando,setGuardando]=useState(false);

  async function guardar(){
    if(!form.nombre.trim()){ alert("El nombre es obligatorio"); return; }
    setGuardando(true);
    await onGuardar(cliente.id, form);
    setGuardando(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 className="modal-title" style={{marginBottom:0}}>Editar cliente</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>x</button>
        </div>
        <div style={{display:"grid",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Nombre y Apellido *</label>
              <input className="form-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.telefono} onChange={e=>set("telefono",e.target.value)} placeholder="+54 9 ..." />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="email@ejemplo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Edad</label>
              <input className="form-input" type="number" min="0" max="120" value={form.edad} onChange={e=>set("edad",e.target.value)} placeholder="Ej: 35" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de Nacimiento</label>
              <input className="form-input" type="date" value={form.fecha_nacimiento} onChange={e=>set("fecha_nacimiento",e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Género</label>
              <select className="form-input" value={form.genero} onChange={e=>set("genero",e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lugar de Residencia</label>
              <input className="form-input" value={form.lugar_residencia} onChange={e=>set("lugar_residencia",e.target.value)} placeholder="Ciudad, Provincia" />
            </div>
            <div className="form-group">
              <label className="form-label">Lugar de Origen</label>
              <input className="form-input" value={form.lugar_origen} onChange={e=>set("lugar_origen",e.target.value)} placeholder="Ciudad, País" />
            </div>
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Tema de la Consulta</label>
              <textarea className="form-input" rows={2} value={form.motivo_consulta} onChange={e=>set("motivo_consulta",e.target.value)} placeholder="Motivo principal de consulta..." style={{resize:"vertical"}} />
            </div>
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Emociones Actuales</label>
              <textarea className="form-input" rows={2} value={form.emociones_actuales} onChange={e=>set("emociones_actuales",e.target.value)} placeholder="Cómo se siente actualmente..." style={{resize:"vertical"}} />
            </div>
            <div className="form-group" style={{gridColumn:"1/-1"}}>
              <label className="form-label">Notas adicionales</label>
              <textarea className="form-input" rows={2} value={form.notas} onChange={e=>set("notas",e.target.value)} placeholder="Otras observaciones..." style={{resize:"vertical"}} />
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando?"Guardando...":"Guardar cambios"}</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  LISTA CLIENTES
// ══════════════════════════════════════════════════════════
function ListaClientes({ clientes, setClientes, sesiones, servicios, terapeutas, usuarioActual }) {
  const [busqueda,setBusqueda]=useState("");
  const [filtroTer,setFiltroTer]=useState("todos");
  const [sel,setSel]=useState(null);
  const [editando,setEditando]=useState(null);
  const servMap=Object.fromEntries(servicios.map(s=>[s.id,s]));
  const terMap=Object.fromEntries((terapeutas||[]).map(t=>[t.id,t]));
  const esAdmin=usuarioActual?.rol==="admin";

  const filtrados=clientes
    .filter(c=>filtroTer==="todos"||c.terapeuta_id===filtroTer)
    .filter(c=>c.nombre?.toLowerCase().includes(busqueda.toLowerCase())||c.email?.toLowerCase().includes(busqueda.toLowerCase()));

  const sesCli=sel?sesiones.filter(s=>
    (s.cliente_id===sel.id || s.cliente_nombre===sel.nombre) &&
    s.terapeuta_id===sel.terapeuta_id
  ):[];

  async function guardarCliente(id, datos){
    try {
    await dbUpdate("clientes", id, {...datos, updated_at: new Date().toISOString()});
    } catch(e){ alert("Error al guardar cliente: " + e.message); throw e; }
    setClientes(cs=>cs.map(c=>c.id===id?{...c,...datos}:c));
    setSel(prev=>prev?.id===id?{...prev,...datos}:prev);
  }

  const GENERO={F:"Femenino",M:"Masculino"};

  return (
    <div style={{display:"grid",gridTemplateColumns:sel?"1fr 1fr":"1fr",gap:20}}>
      <div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <input className="form-input" placeholder="Buscar cliente..." value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{flex:1}} />
          {esAdmin && (
            <select className="form-input" style={{maxWidth:200}} value={filtroTer} onChange={e=>{setFiltroTer(e.target.value);setSel(null);}}>
              <option value="todos">Todos los terapeutas</option>
              {(terapeutas||[]).map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          )}
        </div>
        <div className="card" style={{padding:0}}>
          <table>
            <thead><tr><th>Cliente</th>{esAdmin&&<th>Terapeuta</th>}<th>Contacto</th><th>Sesiones</th></tr></thead>
            <tbody>
              {filtrados.map(c=>{
                const tot=sesiones.filter(s=>(s.cliente_id===c.id||s.cliente_nombre===c.nombre)&&s.terapeuta_id===c.terapeuta_id).length;
                return (
                  <tr key={c.id} style={{cursor:"pointer",background:sel?.id===c.id?"var(--surface2)":""}} onClick={()=>setSel(c===sel?null:c)}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div className="avatar" style={{width:36,height:36,fontSize:14,background:"var(--surface2)",color:"var(--accent2)"}}>{c.nombre?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight:600}}>{c.nombre}</div>
                          <div style={{fontSize:11,color:"var(--text2)"}}>{c.motivo_consulta?.slice(0,40)}</div>
                        </div>
                      </div>
                    </td>
                    {esAdmin && (
                      <td>
                        {terMap[c.terapeuta_id] ? (
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div className="avatar" style={{width:24,height:24,fontSize:10,background:(terMap[c.terapeuta_id]?.color||"#6366f1")+"33",color:terMap[c.terapeuta_id]?.color||"#a5b4fc"}}>{terMap[c.terapeuta_id]?.nombre?.[0]}</div>
                            <span style={{fontSize:12}}>{terMap[c.terapeuta_id]?.nombre}</span>
                          </div>
                        ) : <span style={{fontSize:12,color:"var(--text2)"}}>—</span>}
                      </td>
                    )}
                    <td style={{fontSize:12,color:"var(--text2)"}}>{c.telefono}<br/>{c.email}</td>
                    <td><span style={{fontWeight:700,color:"var(--accent2)"}}>{tot}</span></td>
                  </tr>
                );
              })}
              {filtrados.length===0 && <tr><td colSpan={esAdmin?4:3} style={{textAlign:"center",color:"var(--text2)",padding:20}}>Sin clientes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {sel && (
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:20,marginBottom:4}}>{sel.nombre}</h3>
                {sel.genero && <span style={{fontSize:12,color:"var(--text2)"}}>{GENERO[sel.genero]}{sel.edad ? ` · ${sel.edad} años` : ""}</span>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-warn btn-sm" onClick={()=>setEditando(sel)}>Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setSel(null)}>x</button>
              </div>
            </div>
            <div style={{display:"grid",gap:8,fontSize:13}}>
              {sel.telefono         && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Teléfono</span><span>{sel.telefono}</span></div>}
              {sel.email            && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Email</span><span>{sel.email}</span></div>}
              {sel.fecha_nacimiento && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Fecha de nac.</span><span>{sel.fecha_nacimiento}</span></div>}
              {sel.lugar_residencia && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Residencia</span><span>{sel.lugar_residencia}</span></div>}
              {sel.lugar_origen     && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Origen</span><span>{sel.lugar_origen}</span></div>}
              {sel.motivo_consulta  && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Tema consulta</span><span>{sel.motivo_consulta}</span></div>}
              {sel.emociones_actuales && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Emociones</span><span>{sel.emociones_actuales}</span></div>}
              {sel.notas            && <div style={{display:"flex",gap:8}}><span style={{color:"var(--text2)",minWidth:120}}>Notas</span><span>{sel.notas}</span></div>}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Historial de sesiones</div>
            {sesCli.length===0 && <div style={{color:"var(--text2)",fontSize:13}}>Sin sesiones registradas</div>}
            {sesCli.sort((a,b)=>new Date(b.fecha_inicio)-new Date(a.fecha_inicio)).map(s=>{
              const sv=servMap[s.servicio_id];
              return (
                <div key={s.id} style={{padding:"12px 0",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:500}}>{formatFecha(s.fecha_inicio)}</div>
                    <div style={{fontSize:12,color:"var(--text2)"}}>{sv?.nombre} - {formatHora(s.fecha_inicio)} - {formatHora(s.fecha_fin)}</div>
                  </div>
                  <span className={`badge badge-${s.estado}`}>{s.estado}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editando && (
        <ModalEditarCliente
          cliente={editando}
          onClose={()=>setEditando(null)}
          onGuardar={guardarCliente}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN: TERAPEUTAS
// ══════════════════════════════════════════════════════════
function AdminTerapeutas({ usuarios, setUsuarios, sesiones, especialidades }) {
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({nombre:"",email:"",password:"",especialidades:"",color:"#6366f1",descripcion:"",activo:true});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const terapeutas=usuarios.filter(u=>u.rol==="terapeuta");

  function abrir(u=null){
    setEditando(u);
    setForm(u?{nombre:u.nombre,email:u.email,password:u.password,especialidades:(u.especialidades||[]).join(", "),color:u.color,descripcion:u.descripcion||"",activo:u.activo}
               :{nombre:"",email:"",password:"",especialidades:"",color:"#6366f1",descripcion:"",activo:true});
    setModal(true);
  }

  async function guardar(){
    if(!form.nombre.trim()||!form.email.trim()){ alert("Nombre y email son obligatorios."); return; }
    const datos={nombre:form.nombre,email:form.email,rol:"terapeuta",es_terapeuta:true,
      especialidades:form.especialidades.split(",").map(s=>s.trim()).filter(Boolean),
      color:form.color,descripcion:form.descripcion,activo:form.activo};
    try {
      if(editando){
        const res = await dbUpdate("terapeutas", editando.id, datos);
        const actualizado = Array.isArray(res) ? res[0] : res;
        setUsuarios(us=>us.map(u=>u.id===editando.id?{...u,...(actualizado||datos)}:u));
      } else {
        const res = await dbInsert("terapeutas", datos);
        const nuevo = Array.isArray(res) ? res[0] : res;
        if(!nuevo?.id){ alert("Error: no se pudo guardar el terapeuta en la base de datos. Verificá tu sesión."); return; }
        setUsuarios(us=>[...us, nuevo]);
      }
      setModal(false);
    } catch(e){
      alert("Error al guardar terapeuta: " + e.message);
    }
  }

  async function toggleActivo(t){
    try {
      await dbUpdate("terapeutas", t.id, {activo:!t.activo});
      setUsuarios(us=>us.map(u=>u.id===t.id?{...u,activo:!u.activo}:u));
    } catch(e){ alert("Error al actualizar: " + e.message); }
  }

  async function eliminarTerapeuta(t){
    if(!window.confirm(`¿Eliminar a "${t.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await dbDelete("terapeutas", t.id);
      setUsuarios(us=>us.filter(u=>u.id!==t.id));
    } catch(e){ alert("Error al eliminar: " + e.message); }
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
        <button className="btn btn-primary" onClick={()=>abrir()}>+ Nuevo terapeuta</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {terapeutas.map(t=>{
          const qty=sesiones.filter(s=>s.terapeuta_id===t.id).length;
          const comp=sesiones.filter(s=>s.terapeuta_id===t.id&&s.estado==="completado").length;
          return (
            <div key={t.id} className="ter-card" style={{"--tc":t.color}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div className="avatar" style={{width:52,height:52,fontSize:20,background:t.color+"33",color:t.color}}>{t.nombre?.[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15}}>{t.nombre}</div>
                  <div style={{fontSize:12,color:"var(--text2)"}}>{t.email}</div>
                </div>
                <span className={`badge ${t.activo?"badge-confirmado":"badge-cancelado"}`}>{t.activo?"Activo":"Inactivo"}</span>
              </div>
              {t.descripcion && <div style={{fontSize:13,color:"var(--text2)",marginBottom:12,lineHeight:1.6}}>{t.descripcion}</div>}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {(t.especialidades||[]).map((e,i)=>(
                  <span key={i} style={{background:t.color+"22",color:t.color,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{e}</span>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                <div style={{background:"var(--surface2)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:22,fontWeight:700,color:t.color}}>{qty}</div>
                  <div style={{fontSize:11,color:"var(--text2)"}}>Sesiones</div>
                </div>
                <div style={{background:"var(--surface2)",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:22,fontWeight:700,color:"var(--success)"}}>{comp}</div>
                  <div style={{fontSize:11,color:"var(--text2)"}}>Completadas</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>abrir(t)}>Editar</button>
                <button className={`btn btn-sm ${t.activo?"btn-danger":"btn-success"}`} onClick={()=>toggleActivo(t)}>
                  {t.activo?"Desactivar":"Activar"}
                </button>
                <button className="btn btn-danger btn-sm" onClick={()=>eliminarTerapeuta(t)}>Borrar</button>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <h2 className="modal-title">{editando?"Editar terapeuta":"Nuevo terapeuta"}</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input className="form-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e=>set("email",e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contrasena</label>
                <input className="form-input" type="password" value={form.password} onChange={e=>set("password",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.activo?"activo":"inactivo"} onChange={e=>set("activo",e.target.value==="activo")}>
                  <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Especialidades</label>
              <div style={{border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:8,maxHeight:160,overflowY:"auto"}}>
                {(especialidades||[]).filter(e=>e.activo).map(e=>{
                  const seleccionadas=(form.especialidades||"").split(",").map(s=>s.trim()).filter(Boolean);
                  const marcado=seleccionadas.includes(e.nombre);
                  function toggle(){
                    const nueva=marcado
                      ? seleccionadas.filter(s=>s!==e.nombre)
                      : [...seleccionadas, e.nombre];
                    set("especialidades", nueva.join(", "));
                  }
                  return (
                    <label key={e.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",padding:"4px 10px",borderRadius:20,background:marcado?"var(--accent)22":"var(--surface2)",border:`1px solid ${marcado?"var(--accent)":"var(--border)"}`,fontSize:13,userSelect:"none"}}>
                      <input type="checkbox" checked={marcado} onChange={toggle} style={{display:"none"}} />
                      {marcado ? "✓ " : ""}{e.nombre}
                    </label>
                  );
                })}
                {(especialidades||[]).filter(e=>e.activo).length===0 && <span style={{fontSize:13,color:"var(--text2)"}}>No hay terapias. Agregá desde Admin → Terapias.</span>}
              </div>
              {form.especialidades && <div style={{fontSize:11,color:"var(--text2)",marginTop:4}}>Seleccionadas: {form.especialidades}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Descripcion / bio</label>
              <textarea className="form-textarea" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} placeholder="Descripcion breve del terapeuta..." />
            </div>
            <div className="form-group">
              <label className="form-label">Color identificador</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {COLORES_PRESET.map(c=>(
                  <div key={c} onClick={()=>set("color",c)} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?"3px solid white":"3px solid transparent",transition:"all .2s"}}/>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN: ESPECIALIDADES (tabla servicios)
// ══════════════════════════════════════════════════════════
function AdminServicios({ servicios, setServicios, sesiones }) {
  const [modal,setModal]=useState(false);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({nombre:"",descripcion:"",duracion_minutos:60,precio:0,color:"#6366f1",activo:true});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  function abrir(s=null){
    setEditando(s);
    setForm(s?{...s}:{nombre:"",descripcion:"",duracion_minutos:60,precio:0,color:"#6366f1",activo:true});
    setModal(true);
  }

  async function guardar(){
    if(!form.nombre.trim()){ alert("El nombre es obligatorio"); return; }
    try {
      if(editando){
        await dbUpdate("servicios", editando.id, form);
        setServicios(ss=>ss.map(s=>s.id===editando.id?{...s,...form}:s));
      } else {
        const res = await dbInsert("servicios", form);
        const nuevo = Array.isArray(res) ? res[0] : res;
        if(!nuevo?.id){ alert("Error: no se pudo guardar la terapia en la base de datos."); return; }
        setServicios(ss=>[...ss, nuevo]);
      }
      setModal(false);
    } catch(e){
      alert("Error al guardar terapia: " + e.message);
    }
  }

  async function toggleServicio(s){
    try {
      await dbUpdate("servicios", s.id, {activo:!s.activo});
      setServicios(ss=>ss.map(x=>x.id===s.id?{...x,activo:!x.activo}:x));
    } catch(e){ alert("Error al actualizar terapia: " + e.message); }
  }

  async function eliminar(s, qty){
    if(qty>0){ alert(`No se puede eliminar "${s.nombre}" porque tiene ${qty} sesion/es registradas.`); return; }
    if(!window.confirm(`¿Eliminar "${s.nombre}"?`)) return;
    try {
      await dbDelete("servicios", s.id);
      setServicios(ss=>ss.filter(x=>x.id!==s.id));
    } catch(e){ alert("Error al eliminar terapia: " + e.message); }
  }

  async function limpiarNoUsadas(){
    const noUsadas=servicios.filter(s=>(sesiones||[]).filter(x=>x.servicio_id===s.id).length===0);
    if(noUsadas.length===0){ alert("No hay terapias sin usar."); return; }
    if(!window.confirm(`¿Eliminar ${noUsadas.length} terapia/s sin sesiones?`)) return;
    try {
      for(const s of noUsadas){ await dbDelete("servicios", s.id); }
      setServicios(ss=>ss.filter(s=>(sesiones||[]).filter(x=>x.servicio_id===s.id).length>0));
    } catch(e){ alert("Error al limpiar terapias: " + e.message); }
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <button className="btn btn-ghost btn-sm" onClick={limpiarNoUsadas} style={{fontSize:12}}>🗑 Limpiar terapias sin uso</button>
        <button className="btn btn-primary" onClick={()=>abrir()}>+ Nueva terapia</button>
      </div>
      <div className="card" style={{padding:0}}>
        <table>
          <thead><tr><th>Terapia</th><th>Descripcion</th><th>Duracion</th><th>Sesiones</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {servicios.map(s=>{
              const qty=(sesiones||[]).filter(x=>x.servicio_id===s.id).length;
              return (
              <tr key={s.id}>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:12,height:12,borderRadius:"50%",background:s.color,flexShrink:0}}/>
                    <strong>{s.nombre}</strong>
                  </div>
                </td>
                <td style={{color:"var(--text2)",fontSize:13}}>{s.descripcion}</td>
                <td><span style={{background:s.color+"22",color:s.color,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{s.duracion_minutos} min</span></td>
                <td>
                  {qty>0
                    ? <span style={{fontWeight:700,color:"var(--accent2)"}}>{qty}</span>
                    : <span style={{fontSize:12,color:"var(--text2)"}}>Sin uso</span>
                  }
                </td>
                <td><span className={`badge ${s.activo?"badge-confirmado":"badge-cancelado"}`}>{s.activo?"Activa":"Inactiva"}</span></td>
                <td>
                  <div style={{display:"flex",gap:6}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>abrir(s)}>Editar</button>
                    <button className={`btn btn-sm ${s.activo?"btn-danger":"btn-success"}`} onClick={()=>toggleServicio(s)}>
                      {s.activo?"Desactivar":"Activar"}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={()=>eliminar(s,qty)}
                      title={qty>0?`Tiene ${qty} sesiones`:"Sin sesiones, se puede eliminar la terapia"}
                      style={{opacity:qty>0?0.4:1}}
                    >Borrar</button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <h2 className="modal-title">{editando?"Editar terapia":"Nueva terapia"}</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre de la terapia</label>
                <input className="form-input" value={form.nombre} onChange={e=>set("nombre",e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={form.activo?"activo":"inactivo"} onChange={e=>set("activo",e.target.value==="activo")}>
                  <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripcion</label>
              <textarea className="form-textarea" value={form.descripcion} onChange={e=>set("descripcion",e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duracion (minutos)</label>
                <input type="number" className="form-input" min={15} max={240} step={15} value={form.duracion_minutos} onChange={e=>set("duracion_minutos",+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Precio (opcional)</label>
                <input type="number" className="form-input" min={0} value={form.precio} onChange={e=>set("precio",+e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {COLORES_PRESET.map(c=>(
                  <div key={c} onClick={()=>set("color",c)} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?"3px solid white":"3px solid transparent",transition:"all .2s"}}/>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN: REPORTES
// ══════════════════════════════════════════════════════════
function AdminReportes({ sesiones, usuarios, servicios }) {
  const terapeutas=usuarios.filter(u=>u.rol==="terapeuta");
  const servMap=Object.fromEntries(servicios.map(s=>[s.id,s]));

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24}}>
        {[
          {label:"Total sesiones",   val:sesiones.length,                                                              c:"var(--accent)"},
          {label:"Completadas",      val:sesiones.filter(s=>s.estado==="completado").length,                           c:"var(--success)"},
          {label:"Tasa completadas", val:sesiones.length?Math.round(sesiones.filter(s=>s.estado==="completado").length/sesiones.length*100)+"%":"0%", c:"var(--accent2)"},
        ].map((s,i)=>(
          <div key={i} className="stat-card" style={{"--c":s.c}}>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div className="card">
          <div className="card-title">Sesiones por terapeuta</div>
          <table>
            <thead><tr><th>Terapeuta</th><th>Total</th><th>Completadas</th><th>%</th></tr></thead>
            <tbody>
              {terapeutas.map(t=>{
                const tot=sesiones.filter(s=>s.terapeuta_id===t.id).length;
                const comp=sesiones.filter(s=>s.terapeuta_id===t.id&&s.estado==="completado").length;
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div className="avatar" style={{width:28,height:28,fontSize:11,background:t.color+"33",color:t.color}}>{t.nombre?.[0]}</div>
                        {t.nombre}
                      </div>
                    </td>
                    <td style={{fontWeight:700,color:t.color}}>{tot}</td>
                    <td style={{color:"var(--success)"}}>{comp}</td>
                    <td style={{color:"var(--text2)"}}>{tot?Math.round(comp/tot*100):0}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-title">Sesiones por terapia</div>
          {servicios.map(sv=>{
            const qty=sesiones.filter(s=>s.servicio_id===sv.id).length;
            const max=Math.max(...servicios.map(s=>sesiones.filter(x=>x.servicio_id===s.id).length),1);
            return (
              <div key={sv.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                  <span style={{color:sv.color,fontWeight:600}}>{sv.nombre}</span>
                  <span style={{color:"var(--text2)"}}>{qty} sesiones</span>
                </div>
                <div style={{height:6,background:"var(--surface2)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${(qty/max)*100}%`,height:"100%",background:sv.color,borderRadius:3,transition:"width .6s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card" style={{gridColumn:"1/-1"}}>
          <div className="card-title">Historial global</div>
          <table>
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Terapia</th><th>Terapeuta</th><th>Estado</th></tr></thead>
            <tbody>
              {sesiones.sort((a,b)=>new Date(b.fecha_inicio)-new Date(a.fecha_inicio)).slice(0,12).map(s=>{
                const sv=servMap[s.servicio_id];
                const tr=terapeutas.find(t=>t.id===s.terapeuta_id);
                return (
                  <tr key={s.id}>
                    <td style={{fontSize:13}}>{formatFecha(s.fecha_inicio)} {formatHora(s.fecha_inicio)}</td>
                    <td style={{fontWeight:500}}>{s.cliente_nombre}</td>
                    <td><span style={{background:(sv?.color||"#6366f1")+"22",color:sv?.color||"#a5b4fc",padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:600}}>{sv?.nombre}</span></td>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div className="avatar" style={{width:24,height:24,fontSize:10,background:(tr?.color||"#6366f1")+"33",color:tr?.color||"#a5b4fc"}}>{tr?.nombre?.[0]}</div>
                        <span style={{fontSize:13}}>{tr?.nombre}</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${s.estado}`}>{s.estado}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  ADMIN: SISTEMA
// ══════════════════════════════════════════════════════════
function AdminSistema() {
  const [config,setConfig]=useState({nombre:"Agenda Terapeutica",timezone:"America/Argentina/Buenos_Aires",horaInicio:8,horaFin:21,rec24h:true,rec2h:true});
  const set=(k,v)=>setConfig(c=>({...c,[k]:v}));
  return (
    <div style={{maxWidth:600}}>
      <div className="card">
        <div className="card-title">Configuracion general</div>
        <div className="form-group">
          <label className="form-label">Nombre del sistema</label>
          <input className="form-input" value={config.nombre} onChange={e=>set("nombre",e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Zona horaria</label>
          <select className="form-select" value={config.timezone} onChange={e=>set("timezone",e.target.value)}>
            <option value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</option>
            <option value="America/Santiago">Chile (GMT-4)</option>
            <option value="America/Montevideo">Uruguay (GMT-3)</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Hora inicio agenda</label>
            <input type="number" className="form-input" min={0} max={23} value={config.horaInicio} onChange={e=>set("horaInicio",+e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Hora fin agenda</label>
            <input type="number" className="form-input" min={0} max={23} value={config.horaFin} onChange={e=>set("horaFin",+e.target.value)} />
          </div>
        </div>
        <div className="card-title" style={{marginTop:8}}>Recordatorios automaticos</div>
        {[["rec24h","Recordatorio 24 horas antes"],["rec2h","Recordatorio 2 horas antes"]].map(([k,l])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:14}}>{l}</span>
            <div className="toggle" style={{background:config[k]?"var(--accent)":"var(--border)"}} onClick={()=>set(k,!config[k])}>
              <div className="toggle-dot" style={{left:config[k]?22:3}}/>
            </div>
          </div>
        ))}
        <div style={{marginTop:20}}>
          <button className="btn btn-primary">Guardar configuracion</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  PANEL ADMIN
// ══════════════════════════════════════════════════════════
function PanelAdmin({ usuarios, setUsuarios, servicios, setServicios, sesiones, clientes }) {
  const [tab,setTab]=useState("terapeutas");
  return (
    <div>
      <div className="admin-tabs">
        {[["terapeutas","👥 Terapeutas"],["especialidades","🎯 Terapias"],["reportes","📊 Reportes"],["sistema","⚙️ Sistema"]].map(([k,l])=>(
          <div key={k} className={`admin-tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</div>
        ))}
      </div>
      {tab==="terapeutas"    && <AdminTerapeutas usuarios={usuarios} setUsuarios={setUsuarios} sesiones={sesiones} especialidades={servicios} />}
      {tab==="especialidades"&& <AdminServicios  servicios={servicios} setServicios={setServicios} sesiones={sesiones} />}
      {tab==="reportes"      && <AdminReportes   sesiones={sesiones} usuarios={usuarios} servicios={servicios} clientes={clientes} />}
      {tab==="sistema"       && <AdminSistema />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function AgendaTerapeutica() {
  const [usuario,   setUsuario]   = useState(null);
  const [vista,     setVista]     = useState("dashboard");
  const [usuarios,  setUsuarios]  = useState(USUARIOS_MOCK);   // se carga de Supabase
  const [sesiones,  setSesiones]  = useState([]);
  const [clientes,  setClientes]  = useState([]);
  const [servicios,setServicios] = useState(SERVICIOS_MOCK);  // se carga de Supabase
  const [modalSes,      setModalSes]      = useState(null);
  const [sesVista,  setSesVista]  = useState(null);
  const [editando,  setEditando]  = useState(null);
  const [cargando,  setCargando]  = useState(true);  // carga inicial

  // ── Restaurar sesión al montar ───────────────────────
  useEffect(()=>{
    (async()=>{
      try {
        const user = await authRestoreSession();
        if (user) {
          const perfil = await getPerfilUsuario(user.id);
          if (perfil?.activo) {
            setUsuario(perfil);
            await cargarDatos(perfil);
          }
        }
      } catch(e){ console.error("Error restaurando sesion:", e); }
      setCargando(false);
    })();
  },[]);

  // ── Cargar datos desde Supabase ───────────────────────
  async function cargarDatos(u) {
    try {
      const [srvs, ters, sess, clis] = await Promise.all([
        getServicios(),
        getTerapeutas(),
        getSesiones(u.id, u.rol),
        getClientes(u.id, u.rol),
      ]);
      if (srvs?.length) setServicios(srvs);
      if (ters?.length) setUsuarios(prev => {
        const admins = prev.filter(x=>x.rol==="admin");
        return [...admins, ...ters];
      });
      if (sess) setSesiones(sess);
      if (clis) setClientes(clis);
    } catch(e){
      console.error("Error cargando datos desde Supabase:", e.message);
      alert("Error al conectar con la base de datos: " + e.message);
    }
  }

  const terapeutas = usuarios.filter(u=>u.rol==="terapeuta" || u.es_terapeuta===true);
  const sesionesFiltradas = usuario?.rol==="terapeuta"
    ? sesiones.filter(s=>s.terapeuta_id===usuario.id)
    : sesiones;

  async function guardarSesion(datos){
    const esNueva=!sesiones.find(s=>s.id===datos.id);
    try {
      if(esNueva){
        const resS = await crearSesion(datos);
        const sesConId = Array.isArray(resS) ? resS[0] : resS;
        if(!sesConId?.id){ alert("Error: la sesión no se guardó en la base de datos."); return; }
        setSesiones(ss=>[...ss, sesConId]);
        if(datos.cliente_nombre && !clientes.find(c=>c.nombre===datos.cliente_nombre && c.terapeuta_id===datos.terapeuta_id)){
          try {
            const resC = await dbInsert("clientes",{nombre:datos.cliente_nombre,telefono:datos.cliente_telefono||"",email:datos.cliente_email||"",motivo_consulta:datos.motivo_consulta||"",terapeuta_id:datos.terapeuta_id});
            const cli = Array.isArray(resC) ? resC[0] : resC;
            if(cli?.id) setClientes(cs=>[...cs, cli]);
          } catch(ec){ console.warn("Cliente no guardado en DB:", ec.message); }
        }
      } else {
        await actualizarSesion(datos.id, datos);
        setSesiones(ss=>ss.map(s=>s.id===datos.id?{...s,...datos}:s));
      }
      setModalSes(null); setEditando(null); setSesVista(null);
    } catch(e){
      alert("Error al guardar sesión: " + e.message);
    }
  }

  async function cambiarEstado(id, estado){
    try {
      await actualizarSesion(id, {estado});
      setSesiones(ss=>ss.map(s=>s.id===id?{...s,estado}:s));
    } catch(e){ alert("Error al cambiar estado: " + e.message); }
  }

  async function eliminarSesion(id){
    if(!window.confirm("¿Eliminar esta sesion? Esta acción no se puede deshacer.")) return;
    try {
      await dbDelete("sesiones", id);
      setSesiones(ss=>ss.filter(s=>s.id!==id));
      setSesVista(null);
    } catch(e){ alert("Error al eliminar sesión: " + e.message); }
  }

  async function handleLogout(){
    await authLogout();
    setUsuario(null); setSesiones([]); setClientes([]); setVista("dashboard");
  }

  // Pantalla de carga inicial
  if(cargando) return (
    <><style>{CSS}</style>
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)"}}>
      <div style={{textAlign:"center"}}>
        <div className="spinner" style={{width:40,height:40,borderWidth:3,margin:"0 auto 16px"}}/>
        <div style={{color:"var(--text2)",fontSize:14}}>Cargando...</div>
      </div>
    </div></>
  );

  if(!usuario) return (
    <><style>{CSS}</style><Login onLogin={async u=>{setUsuario(u);await cargarDatos(u);setVista("dashboard");}}/></>
  );

  const navAdmin=[
    {id:"dashboard",icon:"📊",label:"Dashboard",sec:null},
    {id:"calendario",icon:"📅",label:"Calendario",sec:"Agenda"},
    {id:"sesiones",icon:"🗂️",label:"Sesiones",sec:null},
    {id:"clientes",icon:"👥",label:"Clientes",sec:"Gestion"},
    {id:"admin",icon:"⚙️",label:"Administracion",sec:"Admin"},
  ];
  const navTer=[
    {id:"dashboard",icon:"📊",label:"Mi Dashboard",sec:null},
    {id:"calendario",icon:"📅",label:"Mi Agenda",sec:"Agenda"},
    {id:"sesiones",icon:"🗂️",label:"Mis Sesiones",sec:null},
    {id:"clientes",icon:"👥",label:"Mis Clientes",sec:"Gestion"},
  ];
  const nav = usuario.rol==="admin" ? navAdmin : navTer;

  const titles={dashboard:"Dashboard",calendario:"Calendario",sesiones:"Sesiones",clientes:"Clientes",admin:"Administracion"};

  return (
    <><style>{CSS}</style>
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>🌿 Sentir</h1>
          <p>Agenda Terapéutica</p>
        </div>
        <div className="sidebar-user">
          <div className="avatar" style={{width:36,height:36,fontSize:15,background:usuario.color+"33",color:usuario.color}}>{usuario.nombre?.[0]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="sidebar-user-name">{usuario.nombre}</div>
            <div className="sidebar-user-role">{usuario.rol}</div>
          </div>
        </div>
        {nav.map((item,i)=>(
          <span key={i}>
            {item.sec && <div className="nav-section">{item.sec}</div>}
            <div className={`nav-item ${vista===item.id?"active":""}`} onClick={()=>setVista(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </div>
          </span>
        ))}
        <div style={{flex:1}}/>
        <div style={{padding:"16px 20px",borderTop:"1px solid var(--border)"}}>
          <button className="btn btn-ghost btn-sm" style={{width:"100%",justifyContent:"center"}} onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="page-header">
          <h1 className="page-title">{titles[vista]||vista}</h1>
          {vista!=="admin" && <button className="btn btn-primary" onClick={()=>setModalSes({})}>+ Nueva sesion</button>}
        </div>

        {vista==="dashboard"  && <Dashboard     sesiones={sesionesFiltradas} clientes={clientes} terapeutas={terapeutas} servicios={servicios} usuarioActual={usuario} />}
        {vista==="calendario" && <Calendario    sesiones={sesionesFiltradas} terapeutas={terapeutas} servicios={servicios} onNueva={(f,h)=>setModalSes({fecha:f,hora:h})} onVer={setSesVista} />}
        {vista==="sesiones"   && <ListaSesiones sesiones={sesionesFiltradas} terapeutas={terapeutas} servicios={servicios} usuarioActual={usuario} onVer={setSesVista} onCambiarEstado={cambiarEstado} />}
        {vista==="clientes"   && <ListaClientes clientes={clientes} setClientes={setClientes} sesiones={sesionesFiltradas} servicios={servicios} terapeutas={usuarios} usuarioActual={usuario} />}
        {vista==="admin" && usuario.rol==="admin" && <PanelAdmin usuarios={usuarios} setUsuarios={setUsuarios} servicios={servicios} setServicios={setServicios} sesiones={sesiones} clientes={clientes} />}
      </main>

      {(modalSes!==null||editando!==null) && (
        <ModalSesion
          sesion={editando||null}
          usuarioActual={usuario}
          terapeutas={terapeutas}
          servicios={servicios}
          onClose={()=>{setModalSes(null);setEditando(null);}}
          onGuardar={guardarSesion}
        />
      )}

      {sesVista && !editando && (
        <ModalDetalle
          sesion={sesVista}
          terapeutas={terapeutas}
          servicios={servicios}
          onClose={()=>setSesVista(null)}
          onEditar={()=>{setEditando(sesVista);setSesVista(null);}}
          onCompletar={id=>{cambiarEstado(id,"completado");setSesVista(null);}}
          onCancelar={id=>{cambiarEstado(id,"cancelado");setSesVista(null);}}
          onEliminar={eliminarSesion}
        />
      )}
    </div></>
  );
}
