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
    const msg = data.error_description || data.message || data.msg || "";
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
      throw new Error("Email o contraseña incorrectos.");
    }
    throw new Error(msg || "Error al iniciar sesión");
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

// ── AUTH: Cambiar contraseña (primer ingreso forzado) ─────
// Usa la Edge Function con service role para:
// 1. Actualizar el hash en auth.users (sin restricción de "misma clave")
// 2. Marcar debe_cambiar_clave = false en terapeutas
export async function authCambiarPassword(email, nuevaPassword, terapeutaId) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/crear-usuario-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cambiar_clave", email, password: nuevaPassword, terapeuta_id: terapeutaId }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "No se pudo cambiar la contraseña");
  return data;
}

// ── AUTH: Crear usuario via Edge Function (admin only) ───
export async function crearUsuarioAuth(email, password, terapeutaId) {
  const emailLower = email.trim().toLowerCase();
  // Llama Edge Function con service role — bypassa restricción de signups
  const res = await fetch(`${SUPABASE_URL}/functions/v1/crear-usuario-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: emailLower, password }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "No se pudo crear el usuario");

  // Vincular auth_user_id en terapeutas via RPC
  if (data.id && terapeutaId) {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/confirmar_nuevo_usuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${_sessionToken}`,
      },
      body: JSON.stringify({ p_email: emailLower, p_terapeuta_id: terapeutaId }),
    });
  }
  return data;
}

// ── AUTH: Registrar nuevo usuario (solo admin) ───────────
export async function authRegistrar(email, password) {
  // Usamos el service_role_key para crear usuarios desde el admin
  // IMPORTANTE: esto debe hacerse desde un backend/edge function en producción
  // Por ahora lo dejamos preparado para cuando agregues el backend
  throw new Error("El registro de usuarios debe hacerse desde el Panel Admin de Supabase o a través de una Edge Function.");
}

// ── PKCE helpers ──────────────────────────────────────────
function _generateVerifier() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}
async function _generateChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}

// ── AUTH: Login con Google (OAuth redirect) ───────────────
export async function authLoginWithGoogle() {
  const redirectTo = "https://turnos-two-iota.vercel.app";
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google`
    + `&redirect_to=${encodeURIComponent(redirectTo)}`
    + `&flow_type=implicit`;
}

// ── Verificar si un email existe en terapeutas ────────────
export async function verificarEmailTerapeuta(email) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/terapeutas?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&activo=eq.true&select=id,email`,
    { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
  );
  if (!res.ok) return false;
  const data = await res.json();
  return data?.length > 0;
}

// ── AUTH: Procesar callback OAuth ─────────────────────────
// Soporta flujo PKCE (?code=) y flujo implícito (#access_token=)
export async function authHandleOAuthCallback() {
  // ── 1. Flujo PKCE: Supabase devuelve ?code= en query string ──
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (code) {
    const verifier = sessionStorage.getItem("pkce_verifier");
    sessionStorage.removeItem("pkce_verifier");
    if (!verifier) return null;
    window.history.replaceState(null, "", window.location.pathname);
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const accessToken  = data.access_token;
    const refreshToken = data.refresh_token;
    const user         = data.user;
    if (!accessToken || !user) return null;
    _sessionToken = accessToken;
    _sessionUser  = user;
    localStorage.setItem("sb_token",   accessToken);
    localStorage.setItem("sb_refresh", refreshToken || "");
    localStorage.setItem("sb_user_id", user.id);
    return user;
  }

  // ── 2. Flujo implícito: Supabase devuelve #access_token= en hash ──
  const hash = window.location.hash;
  if (hash && hash.includes("access_token")) {
    const params       = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken  = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken) return null;
    window.history.replaceState(null, "", window.location.pathname);
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    _sessionToken = accessToken;
    _sessionUser  = user;
    localStorage.setItem("sb_token",   accessToken);
    localStorage.setItem("sb_refresh", refreshToken || "");
    localStorage.setItem("sb_user_id", user.id);
    return user;
  }

  return null;
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
  const data = await dbSelect("terapeutas", `?auth_user_id=eq.${userId}`);
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
  return dbSelect("clientes", `?terapeuta_id=eq.${terapeutaId}&order=nombre.asc`);
}
