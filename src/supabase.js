import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pefjugmmpfxqpefxgvwe.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmp1Z21tcGZ4cXBlZnhndndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MjMzNzIsImV4cCI6MjA5MjM5OTM3Mn0.CWARMwtgF-74t0PqwPkBUkkf7-cKTcA79EV88xX84wE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

// ── USUARIOS ─────────────────────────────────────────────────────
export const dbUsuarios = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('usuarios').select('*').order('created_at')
    if (error) { console.error('getAll usuarios:', error); return [] }
    return data || []
  },

  login: async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, username, password, name, role, avatar, activo')
        .eq('username', username.trim())
        .eq('password', password.trim())
      if (error) { return null }
      if (!data || data.length === 0) return null
      if (data[0].activo === false) return null
      return data[0]
    } catch {
      return null
    }
  },

  create: async (u) => {
    const { data, error } = await supabase.from('usuarios').insert([{
      username: u.username, password: u.password,
      name: u.name, role: u.role,
      avatar: u.role === 'admin' ? '👔' : '💳',
      activo: u.activo ?? true,
    }]).select().single()
    if (error) throw error
    return data
  },

  update: async (id, u) => {
    const { data, error } = await supabase.from('usuarios').update({
      username: u.username, password: u.password,
      name: u.name, role: u.role,
      avatar: u.role === 'admin' ? '👔' : '💳',
      activo: u.activo,
    }).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) throw error
  },
}

// ── PAQUETES ──────────────────────────────────────────────────────
export const dbPaquetes = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('paquetes').select('*').order('created_at')
    if (error) { console.error('getAll paquetes:', error); return [] }
    return data || []
  },
  create: async (p) => {
    const { data, error } = await supabase.from('paquetes').insert([{
      name: p.name, description: p.description,
      price: p.price, color: p.color, active: p.active,
    }]).select().single()
    if (error) throw error
    return data
  },
  update: async (id, p) => {
    const { data, error } = await supabase.from('paquetes').update({
      name: p.name, description: p.description,
      price: p.price, color: p.color, active: p.active,
    }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  delete: async (id) => {
    const { error } = await supabase.from('paquetes').delete().eq('id', id)
    if (error) throw error
  },
}

// ── CLIENTES ──────────────────────────────────────────────────────
export const dbClientes = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('clientes').select('*').order('created_at')
    if (error) { console.error('getAll clientes:', error); return [] }
    return (data || []).map(c => ({
      ...c, packageId: c.package_id,
      meterCode: c.meter_code,
      joinDate: c.join_date,
      photos: c.photos || [],
    }))
  },
  create: async (c) => {
    const { data, error } = await supabase.from('clientes').insert([{
      code: c.code, name: c.name, dni: c.dni,
      phone: c.phone || '', email: c.email || '',
      address: c.address, district: c.district || '',
      sector: c.sector, package_id: c.packageId,
      meter_code: c.meterCode || '',
      lat: parseFloat(c.lat) || null,
      lng: parseFloat(c.lng) || null,
      status: c.status, join_date: c.joinDate,
      photos: c.photos || [],
    }]).select().single()
    if (error) throw error
    return { ...data, packageId: data.package_id, meterCode: data.meter_code, joinDate: data.join_date, photos: data.photos || [] }
  },
  update: async (id, c) => {
    const { data, error } = await supabase.from('clientes').update({
      code: c.code, name: c.name, dni: c.dni,
      phone: c.phone || '', email: c.email || '',
      address: c.address, district: c.district || '',
      sector: c.sector, package_id: c.packageId,
      meter_code: c.meterCode || '',
      lat: parseFloat(c.lat) || null,
      lng: parseFloat(c.lng) || null,
      status: c.status, join_date: c.joinDate,
      photos: c.photos || [],
    }).eq('id', id).select().single()
    if (error) throw error
    return { ...data, packageId: data.package_id, meterCode: data.meter_code, joinDate: data.join_date, photos: data.photos || [] }
  },
  delete: async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) throw error
  },
}

// ── RECIBOS ───────────────────────────────────────────────────────
export const dbRecibos = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('recibos').select('*').order('created_at')
    if (error) { console.error('getAll recibos:', error); return [] }
    return (data || []).map(r => ({
      ...r, clientId: r.client_id, packageId: r.package_id,
      issueDate: r.issue_date, dueDate: r.due_date,
      paidDate: r.paid_date, autoGenerated: r.auto_generated,
      cobradorId: r.cobrador_id,
    }))
  },
  create: async (r) => {
    const { data, error } = await supabase.from('recibos').insert([{
      client_id: r.clientId, package_id: r.packageId,
      code: r.code, type: r.type, total: r.total,
      status: r.status, issue_date: r.issueDate,
      due_date: r.dueDate || null, paid_date: r.paidDate || null,
      period: r.period, notes: r.notes || '',
      auto_generated: r.autoGenerated || false,
      cobrador_id: r.cobradorId || null,
    }]).select().single()
    if (error) throw error
    return { ...data, clientId: data.client_id, packageId: data.package_id, issueDate: data.issue_date, dueDate: data.due_date, paidDate: data.paid_date, autoGenerated: data.auto_generated }
  },
  createMany: async (recibos) => {
    const rows = recibos.map(r => ({
      client_id: r.clientId, package_id: r.packageId,
      code: r.code, type: r.type, total: r.total,
      status: r.status, issue_date: r.issueDate,
      due_date: r.dueDate || null, paid_date: r.paidDate || null,
      period: r.period, notes: r.notes || '',
      auto_generated: r.autoGenerated || false,
      cobrador_id: r.cobradorId || null,
    }))
    const { data, error } = await supabase.from('recibos').insert(rows).select()
    if (error) throw error
    return (data || []).map(r => ({ ...r, clientId: r.client_id, packageId: r.package_id, issueDate: r.issue_date, dueDate: r.due_date, paidDate: r.paid_date, autoGenerated: r.auto_generated }))
  },
  update: async (id, r) => {
    const { data, error } = await supabase.from('recibos').update({
      status: r.status,
      paid_date: r.paidDate || null,
      notes: r.notes || '',
      due_date: r.dueDate || null,
    }).eq('id', id).select().single()
    if (error) throw error
    return { ...data, clientId: data.client_id, packageId: data.package_id, issueDate: data.issue_date, dueDate: data.due_date, paidDate: data.paid_date, autoGenerated: data.auto_generated }
  },
  delete: async (id) => {
    const { error } = await supabase.from('recibos').delete().eq('id', id)
    if (error) throw error
  },
}

// ── GASTOS ────────────────────────────────────────────────────────
export const dbGastos = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('gastos').select('*').order('fecha', { ascending: false })
    if (error) { console.error('getAll gastos:', error); return [] }
    return data || []
  },
  create: async (g) => {
    const { data, error } = await supabase.from('gastos').insert([{
      concepto: g.concepto, monto: g.monto,
      fecha: g.fecha, categoria: g.categoria,
      notas: g.notas || '',
    }]).select().single()
    if (error) throw error
    return data
  },
  update: async (id, g) => {
    const { data, error } = await supabase.from('gastos').update({
      concepto: g.concepto, monto: g.monto,
      fecha: g.fecha, categoria: g.categoria,
      notas: g.notas || '',
    }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  delete: async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) throw error
  },
}

// ── REPORTES ──────────────────────────────────────────────────────
export const dbReportes = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('reportes').select('*').order('created_at')
    if (error) { console.error('getAll reportes:', error); return [] }
    return (data || []).map(r => ({
      ...r, clientId: r.client_id,
      photos: r.photos || [],
    }))
  },
  create: async (r) => {
    const { data, error } = await supabase.from('reportes').insert([{
      client_id: r.clientId || null,
      type: r.type, status: r.status,
      title: r.title, address: r.address || '',
      technician: r.technician || '',
      date: r.date, description: r.description || '',
      lat: parseFloat(r.lat) || null,
      lng: parseFloat(r.lng) || null,
      photos: r.photos || [],
      priority: r.priority,
    }]).select().single()
    if (error) throw error
    return { ...data, clientId: data.client_id, photos: data.photos || [] }
  },
  update: async (id, r) => {
    const { data, error } = await supabase.from('reportes').update({
      status: r.status, technician: r.technician || '',
      description: r.description || '',
      priority: r.priority, photos: r.photos || [],
    }).eq('id', id).select().single()
    if (error) throw error
    return { ...data, clientId: data.client_id, photos: data.photos || [] }
  },
  delete: async (id) => {
    const { error } = await supabase.from('reportes').delete().eq('id', id)
    if (error) throw error
  },
}