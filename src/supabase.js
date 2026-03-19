// ════════════════════════════════════════════════════════════
//  supabase.js — Cliente Supabase Auth + DB
//  Copiá este archivo a src/supabase.js en tu proyecto React
// ════════════════════════════════════════════════════════════

// ── TUS CREDENCIALES ──────────────────────────────────────
// Las encontrás en: Supabase → Settings → API
export const SUPABASE_URL      = "https://lgzndrjklzbtkzkzubld.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnem5kcmprbHpidGt6a3p1YmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDg5NjIsImV4cCI6MjA4OTI4NDk2Mn0.hn2mZbIs8JbScMZxRSCkqGHeen255_w47zavfkV9C2k";

// ════════════════════════════════════════════════════════════
//  CLIENTE HTTP LIVIANO (sin instalar @supabase/supabase-js)
// ════════════════════════════════════════════════════════════

// Token de sesión activo (se guarda en memoria)
let _sessionToken = null;
let _sessionUser  = null;

// ── AUTH: Iniciar sesión ──────────────────────────────────
export async function authLogin(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    // Supabase devuelve error_description en español si la config lo permite
    throw new Error(data.error_description || data.message || "Error al iniciar sesión");
  }

  _sessionToken = data.access_token;
  _sessionUser  = data.user;

  // Guardar en localStorage para persistir entre recargas
  localStorage.setItem("sb_token", data.access_token);
  localStorage.setItem("sb_refresh", data.refresh_token);
  localStorage.setItem("sb_user_id", data.user.id);

  return data;
}

// ── AUTH: Cerrar sesión ───────────────────────────────────
export async function authLogout() {
  if (_sessionToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${_sessionToken}` },
    }).catch(() => {});
  }
  _sessionToken = null;
  _sessionUser  = null;
  localStorage.removeItem("sb_token");
  localStorage.removeItem("sb_refresh");
  localStorage.removeItem("sb_user_id");
}

// ── AUTH: Recuperar sesión guardada ───────────────────────
export async function authRestoreSession() {
  const token   = localStorage.getItem("sb_token");
  const refresh = localStorage.getItem("sb_refresh");
  if (!token) return null;

  // Verificar si el token sigue siendo válido
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${token}` },
  });

  if (res.ok) {
    const user = await res.json();
    _sessionToken = token;
    _sessionUser  = user;
    return user;
  }

  // Token expirado → intentar refrescar
  if (refresh) {
    const r2 = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ refresh_token: refresh }),
      }
    );
    if (r2.ok) {
      const data = await r2.json();
      _sessionToken = data.access_token;
      _sessionUser  = data.user;
      localStorage.setItem("sb_token",   data.access_token);
      localStorage.setItem("sb_refresh", data.refresh_token);
      return data.user;
    }
  }

  // Sesión inválida → limpiar
  authLogout();
  return null;
}

// ── AUTH: Cambiar contraseña ──────────────────────────────
export async function authCambiarPassword(nuevaPassword) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${_sessionToken}`,
    },
    body: JSON.stringify({ password: nuevaPassword }),
  });
  if (!res.ok) throw new Error("No se pudo cambiar la contraseña");
  return res.json();
}

// ── AUTH: Registrar nuevo usuario (solo admin) ───────────
export async function authRegistrar(email, password) {
  // Usamos el service_role_key para crear usuarios desde el admin
  // IMPORTANTE: esto debe hacerse desde un backend/edge function en producción
  // Por ahora lo dejamos preparado para cuando agregues el backend
  throw new Error("El registro de usuarios debe hacerse desde el Panel Admin de Supabase o a través de una Edge Function.");
}

// ════════════════════════════════════════════════════════════
//  BASE DE DATOS — CRUD genérico
// ════════════════════════════════════════════════════════════

function headers() {
  return {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${_sessionToken || SUPABASE_ANON_KEY}`,
    "Prefer":        "return=representation",
  };
}

// ── SELECT ────────────────────────────────────────────────
export async function dbSelect(tabla, filtros = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}${filtros}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── INSERT ────────────────────────────────────────────────
export async function dbInsert(tabla, datos) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── UPDATE ────────────────────────────────────────────────
export async function dbUpdate(tabla, id, datos) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── DELETE ────────────────────────────────────────────────
export async function dbDelete(tabla, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...headers(), "Prefer": "" },
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

// ════════════════════════════════════════════════════════════
//  QUERIES ESPECÍFICAS DE LA APP
// ════════════════════════════════════════════════════════════

// Obtener perfil del usuario logueado (de la tabla "terapeutas" o "usuarios")
export async function getPerfilUsuario(userId) {
  const data = await dbSelect("terapeutas", `?id=eq.${userId}`);
  return data?.[0] || null;
}

// Sesiones: si es terapeuta, solo las suyas; si es admin, todas
export async function getSesiones(usuarioId, rol) {
  if (rol === "admin") {
    return dbSelect("sesiones", "?order=fecha_inicio.desc");
  }
  return dbSelect("sesiones", `?terapeuta_id=eq.${usuarioId}&order=fecha_inicio.desc`);
}

export async function crearSesion(datos) {
  return dbInsert("sesiones", datos);
}

export async function actualizarSesion(id, datos) {
  return dbUpdate("sesiones", id, { ...datos, updated_at: new Date().toISOString() });
}

export async function getServicios() {
  return dbSelect("servicios", "?activo=eq.true&order=nombre.asc");
}

export async function getTerapeutas() {
  return dbSelect("terapeutas", "?activo=eq.true&order=nombre.asc");
}

export async function getClientes(terapeutaId, rol) {
  if (rol === "admin") return dbSelect("clientes", "?order=nombre.asc");
  // Para terapeuta: clientes que tuvieron sesiones con él
  return dbSelect("clientes", `?order=nombre.asc`);
}
