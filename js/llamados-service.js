// ============================================================
// SERVICIO DE REGISTRO, SINCRONIZACIÓN Y TRAZABILIDAD CENTRALIZADA
// LLAMADOS DE ATENCIÓN - TADA / PIBOX (SUPABASE + INDEXEDDB)
// ============================================================

const LlamadosSyncService = {
  // Lista en memoria de todos los llamados
  records: [],

  /**
   * Obtiene el nombre del usuario operador actual
   */
  getCurrentUser() {
    return localStorage.getItem('tada_current_user') || 'Coordinador Operativo';
  },

  setCurrentUser(username) {
    if (username && username.trim()) {
      localStorage.setItem('tada_current_user', username.trim());
    }
  },

  /**
   * Verifica si Supabase está configurado en APP_CONFIG
   */
  isSupabaseConfigured() {
    return Boolean(
      APP_CONFIG &&
      APP_CONFIG.supabaseUrl &&
      APP_CONFIG.supabaseKey &&
      APP_CONFIG.supabaseUrl.trim() !== '' &&
      APP_CONFIG.supabaseKey.trim() !== ''
    );
  },

  /**
   * Encabezados HTTP estándar para la REST API de PostgREST / Supabase
   */
  getSupabaseHeaders() {
    const key = (APP_CONFIG.supabaseKey || '').trim();
    return {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  },

  /**
   * Carga inicial y sincronización de registros:
   * 1. Carga desde IndexedDB local (disponibilidad instantánea offline / sin red)
   * 2. Si Supabase está configurado, consulta la base de datos remota y fusiona
   */
  async loadAll() {
    try {
      // 1. Carga local
      const localRecords = await TaDaDB.getAllLlamados();
      this.records = Array.isArray(localRecords) ? localRecords : [];

      // 2. Si hay conexión a Supabase, sincronizar
      if (this.isSupabaseConfigured()) {
        try {
          const url = `${APP_CONFIG.supabaseUrl.replace(/\/$/, '')}/rest/v1/${APP_CONFIG.supabaseTable || 'llamados_atencion'}?select=*&order=timestamp.desc`;
          const resp = await fetch(url, {
            headers: this.getSupabaseHeaders()
          });

          if (resp.ok) {
            const remoteRecords = await resp.json();
            if (Array.isArray(remoteRecords)) {
              // Fusionar registros remotos con los locales
              const map = new Map();
              this.records.forEach(r => map.set(r.id, r));
              remoteRecords.forEach(r => {
                map.set(r.id, {
                  ...r,
                  synced: true
                });
              });

              this.records = Array.from(map.values()).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

              // Guardar los registros remotos actualizados en IndexedDB local
              for (const r of remoteRecords) {
                await TaDaDB.saveLlamado(r);
              }
            }
          } else {
            console.warn('[LlamadosSyncService] Supabase respondió con error:', resp.status, resp.statusText);
          }
        } catch (errRemote) {
          console.warn('[LlamadosSyncService] No se pudo conectar con Supabase, usando registros locales:', errRemote);
        }
      }

      // Reconstruir el mapa de estado para el render rápido de tablas
      this.refreshAppStateStatusMap();
      return this.records;
    } catch (e) {
      console.error('[LlamadosSyncService] Error en loadAll:', e);
      return [];
    }
  },

  /**
   * Refresca el diccionario AppState.llamadosStatus por pilotKey
   */
  refreshAppStateStatusMap() {
    AppState.llamadosStatus = AppState.llamadosStatus || {};
    // Tomar el registro más reciente para cada piloto
    const sorted = [...this.records].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    sorted.forEach(r => {
      if (r.pilotKey && !AppState.llamadosStatus[r.pilotKey]) {
        AppState.llamadosStatus[r.pilotKey] = {
          id: r.id,
          status: r.status,
          timestamp: r.timestamp,
          pilotName: r.pilotName,
          semana: r.semana,
          user: r.user
        };
      }
    });
  },

  /**
   * Registra o actualiza un llamado de atención de forma persistente y sincronizada
   */
  async registerLlamado({
    pilot,
    pilotId,
    phone,
    city,
    store,
    semana,
    type,
    message,
    status = 'sent',
    notes = ''
  }) {
    const pilotName = (pilot || 'Piloto').trim();
    const pilotKey = pilotName.toLowerCase();
    const now = new Date().toISOString();
    const currentUser = this.getCurrentUser();

    // Generar identificador único robusto
    const id = `LLAM_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record = {
      id,
      pilotKey,
      pilotName,
      pilotId: pilotId || '—',
      phone: phone || '—',
      city: city || '—',
      store: store || '—',
      semana: semana || 'Semana actual',
      type: type || 'cancelaciones',
      message: message || '',
      status, // 'sent' | 'pending' | 'not_applicable' | 'failed'
      user: currentUser,
      notes: notes || '',
      timestamp: now,
      synced: false
    };

    // 1. Guardar en memoria
    this.records.unshift(record);

    // 2. Guardar en IndexedDB local
    await TaDaDB.saveLlamado(record);

    // 3. Actualizar AppState.llamadosStatus
    AppState.llamadosStatus = AppState.llamadosStatus || {};
    AppState.llamadosStatus[pilotKey] = {
      id: record.id,
      status: record.status,
      timestamp: record.timestamp,
      pilotName: record.pilotName,
      semana: record.semana,
      user: record.user
    };

    // 4. Intentar sincronización centralizada en Supabase si está disponible
    if (this.isSupabaseConfigured()) {
      try {
        const url = `${APP_CONFIG.supabaseUrl.replace(/\/$/, '')}/rest/v1/${APP_CONFIG.supabaseTable || 'llamados_atencion'}`;
        const payload = {
          id: record.id,
          pilot_key: record.pilotKey,
          pilot_name: record.pilotName,
          pilot_id: record.pilotId,
          phone: record.phone,
          city: record.city,
          store: record.store,
          semana: record.semana,
          type: record.type,
          message: record.message,
          status: record.status,
          user_name: record.user,
          notes: record.notes,
          timestamp: record.timestamp
        };

        const resp = await fetch(url, {
          method: 'POST',
          headers: this.getSupabaseHeaders(),
          body: JSON.stringify(payload)
        });

        if (resp.ok) {
          record.synced = true;
          await TaDaDB.saveLlamado(record);
        } else {
          console.warn('[LlamadosSyncService] Registro guardado localmente, pero error en Supabase:', resp.status);
        }
      } catch (errRemote) {
        console.warn('[LlamadosSyncService] Registro guardado localmente (sin conexión a Supabase):', errRemote);
      }
    }

    return record;
  },

  /**
   * Cambia el estado de un llamado existente (ej: de Pendiente a Enviado o No Aplica)
   */
  async updateStatus(id, newStatus, newNotes = '') {
    const record = this.records.find(r => r.id === id);
    if (!record) return null;

    record.status = newStatus;
    if (newNotes) record.notes = newNotes;
    record.updatedAt = new Date().toISOString();
    record.synced = false;

    await TaDaDB.saveLlamado(record);
    this.refreshAppStateStatusMap();

    // Sincronizar en Supabase si está configurado
    if (this.isSupabaseConfigured()) {
      try {
        const url = `${APP_CONFIG.supabaseUrl.replace(/\/$/, '')}/rest/v1/${APP_CONFIG.supabaseTable || 'llamados_atencion'}?id=eq.${id}`;
        await fetch(url, {
          method: 'PATCH',
          headers: this.getSupabaseHeaders(),
          body: JSON.stringify({
            status: newStatus,
            notes: record.notes,
            updated_at: record.updatedAt
          })
        });
      } catch (e) {
        console.warn('[LlamadosSyncService] Error actualizando estado en Supabase:', e);
      }
    }

    return record;
  },

  /**
   * Filtra registros según criterios de búsqueda
   */
  filterRecords({ query = '', semana = '', ciudad = '', tienda = '', status = '', motivo = '' }) {
    const q = (query || '').toLowerCase().trim();
    return this.records.filter(r => {
      if (q) {
        const matchPilot = (r.pilotName || '').toLowerCase().includes(q);
        const matchId = (r.pilotId || '').toLowerCase().includes(q);
        const matchUser = (r.user || '').toLowerCase().includes(q);
        const matchStore = (r.store || '').toLowerCase().includes(q);
        if (!matchPilot && !matchId && !matchUser && !matchStore) return false;
      }
      if (semana && r.semana !== semana) return false;
      if (ciudad && r.city !== ciudad) return false;
      if (tienda && r.store !== tienda) return false;
      if (status && r.status !== status) return false;
      if (motivo && r.type !== motivo) return false;
      return true;
    });
  },

  /**
   * Genera el script SQL para crear la tabla oficial en Supabase si el usuario desea ejecutarlo
   */
  getSupabaseTableSql() {
    return `
-- Tabla oficial para Trazabilidad de Llamados de Atención TaDa / Pibox
create table if not exists public.llamados_atencion (
  id text primary key,
  pilot_key text not null,
  pilot_name text not null,
  pilot_id text,
  phone text,
  city text,
  store text,
  semana text,
  type text,
  message text,
  status text not null default 'sent',
  user_name text,
  notes text,
  timestamp timestamptz not null default now(),
  updated_at timestamptz
);

-- Habilitar Row Level Security (RLS) y permitir lectura/escritura anónima o autenticada
alter table public.llamados_atencion enable row level security;

create policy "Permitir lectura publica de llamados"
  on public.llamados_atencion for select using (true);

create policy "Permitir insercion de llamados"
  on public.llamados_atencion for insert with check (true);

create policy "Permitir actualizacion de llamados"
  on public.llamados_atencion for update using (true);
    `.trim();
  }
};
