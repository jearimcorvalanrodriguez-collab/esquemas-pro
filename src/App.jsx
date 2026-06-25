import React, { useState, useEffect } from 'react';
import { 
  MapPin, Calendar, Clock, Users, Bell, MessageSquare, 
  Truck, Music, CheckCircle2, XCircle, LogOut, Plus, 
  Navigation, User, Settings, ShieldCheck, UserPlus, 
  UserCheck, Edit3, X, Key, AlertCircle, Loader2,
  Phone, Mail, CheckCheck, Send, Timer, Hourglass,
  Shield, CalendarPlus, FileText, Mic2, Lightbulb, Map as MapIcon, Save,
  Trash2, FolderPlus, RefreshCw, ChevronLeft, CheckSquare, Square
} from 'lucide-react';

const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TOUR_MANAGER: 'TOUR MANAGER',
  TECH: 'TÉCNICO',
  TRASLADO: 'TRASLADO',
  APV: 'APV/CATERING'
};

// --- COMPONENTES REUTILIZABLES ---
const Card = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden ${onClick ? 'cursor-pointer hover:border-emerald-500 transition-colors' : ''} ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', icon: Icon, type = 'button', disabled = false, title }) => {
  const base = "flex flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all duration-200 active:scale-95 text-center leading-tight disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed text-sm";
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 shadow-lg border border-emerald-500/50",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50",
    ghost: "bg-transparent hover:bg-slate-700 text-slate-300",
    blue: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 shadow-lg border border-blue-500/50"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={16} className="shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
};

const openWhatsApp = (phone) => window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
const openEmail = (email) => window.open(`mailto:${email}`, '_blank');

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('DASHBOARD');
  const [selectedProject, setSelectedProject] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Custom Confirm Modal State
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, text: '', onConfirm: null });

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const requestConfirm = (text, onConfirmCallback) => {
    setConfirmDialog({ isOpen: true, text, onConfirm: () => {
      onConfirmCallback();
      setConfirmDialog({ isOpen: false, text: '', onConfirm: null });
    }});
  };

  const getMenuOptions = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'CONDUCTOR') {
      return [{ id: 'CONDUCTOR_VIEW', label: 'Mi Ruta', icon: Truck }, { id: 'LOGOUT', label: 'Salir', icon: LogOut }];
    }

    const r = currentUser.role;
    const chat = { id: 'CHAT', label: 'Mensajes', icon: MessageSquare };
    const time = { id: 'TIMING', label: 'Timing Global', icon: Clock };
    const dir = { id: 'STAFF', label: 'Directorio', icon: Users };
    const transport = { id: 'TRANSPORT', label: 'Transportes', icon: Truck };
    const riders = { id: 'RIDERS', label: 'Riders Técnicos', icon: FileText };
    const admin = { id: 'ADMIN_PANEL', label: 'Admin Panel', icon: ShieldCheck };
    const profile = { id: 'PROFILE', label: 'Mi Perfil', icon: User };
    
    if (r === ROLES.ADMIN) return [ { id: 'DASHBOARD', label: 'Proyectos', icon: Navigation }, time, riders, transport, chat, dir, admin, profile ];
    if (r === ROLES.MANAGER || r === ROLES.TOUR_MANAGER) return [ { id: 'DASHBOARD', label: 'Proyectos', icon: Navigation }, time, riders, transport, chat, dir, profile ];
    
    return [ { id: 'DASHBOARD', label: 'Proyectos', icon: Navigation }, time, riders, transport, chat, dir, profile ];
  };

  // --- 1. AUTENTICACIÓN ---
  const AuthRouter = () => {
    const [mode, setMode] = useState('LOGIN'); 
    const [email, setEmail] = useState(''); 
    const [pass, setPass] = useState('');
    const [driverToken, setDriverToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [regName, setRegName] = useState('');
    const [regRole, setRegRole] = useState(ROLES.TECH);
    const [regPhone, setRegPhone] = useState('+569');

    const handleLogin = async (e) => {
      e.preventDefault(); setError(''); setLoading(true);
      try {
        const response = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'login', payload: { email, password: pass } }) });
        const data = await response.json();
        if (data.status === 'success') setCurrentUser(data.user); 
        else setError(data.message);
      } catch (err) { setError("Error de red conectando al servidor proxy."); }
      setLoading(false);
    };

    const handleDriverLogin = async (e) => {
      e.preventDefault(); setError(''); setLoading(true);
      try {
        const response = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'loginConductor', payload: { token: driverToken.trim() } }) });
        const data = await response.json();
        if (data.status === 'success') {
          setCurrentUser(data.user);
          setCurrentView('CONDUCTOR_VIEW');
        } else setError(data.message);
      } catch (err) { setError("Error de red al verificar token."); }
      setLoading(false);
    };

    const handleRegister = async (e) => {
      e.preventDefault(); setError(''); setLoading(true);
      try {
        const response = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'solicitarAcceso', payload: { name: regName, email, phone: regPhone, role: regRole } }) });
        const result = await response.json();
        if (result.status === 'success') { setMode('LOGIN'); showToast("Solicitud enviada exitosamente."); } 
        else setError(result.message);
      } catch (err) { setError('Error de red al enviar la solicitud.'); }
      setLoading(false);
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="mb-8 text-center animate-fade-in">
          <Music className="text-emerald-500 mx-auto mb-4" size={48} />
          <h1 className="text-4xl font-black text-white tracking-wider">ESQUEMAPPS</h1>
          <p className="text-slate-400 mt-2 tracking-widest text-sm uppercase font-bold">Production Management</p>
        </div>
        <Card className="w-full max-w-md p-8 animate-slide-up">
          <div className="mb-6 text-center border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'LOGIN' ? 'Iniciar Sesión' : mode === 'CONDUCTOR' ? 'Acceso Conductor' : 'Solicitar Acceso'}
            </h2>
          </div>
          
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-5">
               {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16} /><span>{error}</span></div>}
              <div><label className="block text-xs font-bold text-slate-400 mb-1">Correo Electrónico</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500" required /></div>
              <div><label className="block text-xs font-bold text-slate-400 mb-1">Contraseña</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500" required /></div>
              <Button type="submit" className="w-full py-3" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Ingresar a Plataforma'}</Button>
              <div className="border-t border-slate-800 pt-4 space-y-2 mt-4">
                <Button type="button" variant="secondary" className="w-full bg-slate-800 text-emerald-400" onClick={()=>setMode('CONDUCTOR')} icon={Truck}>Acceso Especial (Conductor)</Button>
                <p className="text-center text-xs text-slate-400 mt-4">¿No eres parte del Crew aún? <button type="button" onClick={()=>setMode('REGISTER')} className="text-emerald-500 font-bold hover:underline">Solicitar Acceso</button></p>
              </div>
            </form>
          )}

          {mode === 'CONDUCTOR' && (
            <form onSubmit={handleDriverLogin} className="space-y-5">
              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16} /><span>{error}</span></div>}
              <p className="text-sm text-slate-400 text-center">Ingresa el Token de Ruta que te envió producción (Ej: TR-1234).</p>
              <div><label className="block text-xs font-bold text-slate-400 mb-1">Token de Ruta</label><input type="text" value={driverToken} onChange={e=>setDriverToken(e.target.value.toUpperCase())} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-center font-mono text-xl tracking-widest focus:border-emerald-500" placeholder="TR-XXXX" required /></div>
              <Button type="submit" className="w-full py-3" variant="blue" disabled={loading} icon={Truck}>{loading ? <Loader2 className="animate-spin"/> : 'Iniciar Ruta'}</Button>
              <p className="text-center text-xs text-slate-400 mt-4"><button type="button" onClick={()=>setMode('LOGIN')} className="text-emerald-500 font-bold hover:underline">Volver al Login de Crew</button></p>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle size={16} /><span>{error}</span></div>}
              <div><label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo</label><input type="text" value={regName} onChange={e=>setRegName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500" required /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-400 mb-1">Correo</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500" required /></div><div><label className="block text-xs font-bold text-slate-400 mb-1">Teléfono</label><input type="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500" required /></div></div>
              <div><label className="block text-xs font-bold text-slate-400 mb-1">Rol</label><select value={regRole} onChange={e=>setRegRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500">{Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <Button type="submit" className="w-full py-3 mt-2" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Enviar Solicitud'}</Button>
              <p className="text-center text-xs text-slate-400 mt-4"><button type="button" onClick={()=>setMode('LOGIN')} className="text-emerald-500 font-bold hover:underline">Volver al Login</button></p>
            </form>
          )}
        </Card>
      </div>
    );
  };

  // --- 2. VISTA EXCLUSIVA CONDUCTOR ---
  const ConductorView = () => {
    const r = currentUser.routeInfo;
    const [status, setStatus] = useState(r.status);
    const [loading, setLoading] = useState(false);

    const updateStatus = async (newStatus) => {
      setLoading(true);
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'updateTransportStatus', payload: { token: r.token, newStatus } }) });
        setStatus(newStatus); showToast("Ruta actualizada: " + newStatus);
      } catch (e) { showToast("Error de red al actualizar ruta."); }
      setLoading(false);
    };

    return (
      <div className="max-w-md mx-auto space-y-6 pt-10 px-4">
        <div className="text-center mb-8"><Truck className="mx-auto text-blue-500 mb-4" size={56} /><h1 className="text-3xl font-black text-white">Panel de Ruta</h1><p className="text-slate-400">Token: <span className="text-blue-400 font-mono font-bold">{r.token}</span></p></div>
        <Card className="p-6 border-blue-500/30 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">{r.title}</h2>
          <div className="bg-slate-900 p-4 rounded-lg flex flex-col gap-2 text-sm text-slate-300">
             <div className="flex justify-between border-b border-slate-700 pb-2"><span>Fecha:</span><span className="font-bold text-white">{r.date}</span></div>
             <div className="flex justify-between border-b border-slate-700 pb-2"><span>Hora Pick-Up:</span><span className="font-bold text-blue-400">{r.time}</span></div>
             <div className="flex flex-col text-left pt-2"><span className="text-xs text-slate-500">Origen</span><span className="font-bold text-white">{r.origin}</span></div>
             <div className="flex flex-col text-left pt-2"><span className="text-xs text-slate-500">Destino</span><span className="font-bold text-white">{r.dest}</span></div>
          </div>
          <div className="pt-6 space-y-3">
             <Button variant={status === 'LLEGUE' ? 'ghost' : 'blue'} className="w-full py-4 text-lg" disabled={loading || status !== 'PENDING'} onClick={() => updateStatus('LLEGUE')}>{status === 'LLEGUE' ? '✓ Ya marcaste Llegada' : 'Llegué al Punto (Esperando)'}</Button>
             <Button variant={status === 'EN RUTA' ? 'ghost' : 'primary'} className="w-full py-4 text-lg bg-emerald-600" disabled={loading || status === 'EN RUTA' || status === 'FINALIZADO'} onClick={() => updateStatus('EN RUTA')}>{status === 'EN RUTA' ? '✓ Ruta en progreso' : 'Comenzar Ruta'}</Button>
             <Button variant={status === 'FINALIZADO' ? 'ghost' : 'danger'} className="w-full py-4 text-lg bg-red-600 text-white" disabled={loading || status === 'FINALIZADO'} onClick={() => updateStatus('FINALIZADO')}>{status === 'FINALIZADO' ? 'Ruta Terminada Oficialmente' : 'Finalizar Ruta (Drop-off)'}</Button>
          </div>
        </Card>
      </div>
    );
  };

  // --- 3. MÓDULO DE TRANSPORTE (ADMIN/CREW) ---
  const TransportView = () => {
    const [transports, setTransports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ title: '', date: '', time: '', origin: '', dest: '' });
    const canCreate = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER].includes(currentUser.role);

    const fetchTransports = async () => {
      setLoading(true); setFetchError(false);
      try {
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getTransportes' }) });
        const json = await res.json();
        if (json.status === 'success') setTransports(json.data);
      } catch(e) { setFetchError(true); }
      setLoading(false);
    };
    useEffect(() => { fetchTransports(); }, []);

    const handleCreate = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'createTransporte', payload: form }) });
        showToast("Ruta creada. Token generado."); setIsCreating(false); fetchTransports();
      } catch(e) { showToast("Error al crear ruta."); setLoading(false); }
    };

    const captureGPS = (field) => {
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setForm(prev => ({...prev, [field]: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`}));
          showToast("GPS Capturado correctamente");
        }, () => showToast("Error al obtener GPS. Activa los permisos."));
      } else showToast("Tu navegador no soporta GPS.");
    };

    return (
      <div className="space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
        <header className="border-b border-slate-800 pb-4 flex justify-between items-end">
          <div><h1 className="text-2xl font-black text-white flex items-center gap-3"><Truck className="text-emerald-500" size={28}/> Logística de Transportes</h1><p className="text-sm text-slate-400 mt-1">Gestión de Pick-ups y traslados.</p></div>
          {canCreate && !isCreating && <Button icon={Plus} onClick={() => setIsCreating(true)}>Nueva Ruta</Button>}
        </header>

        {isCreating && (
          <Card className="p-6 border-emerald-500 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Crear Nueva Ruta (Generar Token)</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="text-xs text-slate-400 block mb-1">Título / Vehículo</label><input required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" placeholder="Ej: Van Equipo Sonido" onChange={e=>setForm({...form, title: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-400 block mb-1">Fecha</label><input required type="date" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" onChange={e=>setForm({...form, date: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Hora Pick-up</label><input required type="time" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" onChange={e=>setForm({...form, time: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Origen</label>
                  <div className="flex gap-2"><input required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" value={form.origin} onChange={e=>setForm({...form, origin: e.target.value})} /><Button type="button" variant="secondary" icon={MapPin} onClick={()=>captureGPS('origin')} title="Usar mi GPS" /></div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Destino</label>
                  <div className="flex gap-2"><input required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" value={form.dest} onChange={e=>setForm({...form, dest: e.target.value})} /><Button type="button" variant="secondary" icon={MapPin} onClick={()=>captureGPS('dest')} title="Usar mi GPS" /></div>
                </div>
              </div>
              <div className="flex gap-2 pt-2"><Button variant="secondary" className="flex-1" onClick={()=>setIsCreating(false)}>Cancelar</Button><Button type="submit" className="flex-1">Guardar Ruta</Button></div>
            </form>
          </Card>
        )}

        {fetchError && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> Error de conexión.</div>}
        {loading && !fetchError ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32}/></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transports.map((t, idx) => {
              const statusColors = { 'PENDING': 'bg-slate-700', 'LLEGUE': 'bg-amber-500 animate-pulse', 'EN RUTA': 'bg-blue-500', 'FINALIZADO': 'bg-emerald-600' };
              return (
                <Card key={idx} className="p-5 flex flex-col justify-between border-l-4" style={{borderLeftColor: t.status === 'LLEGUE' ? '#f59e0b' : t.status === 'EN RUTA' ? '#3b82f6' : t.status === 'FINALIZADO' ? '#10b981' : '#334155'}}>
                  <div className="flex justify-between items-start mb-4">
                    <div><h3 className="font-bold text-white text-lg">{t.title}</h3><p className="text-sm text-slate-400">{t.date} • {t.time}</p></div>
                    <div className={`px-3 py-1 rounded text-[10px] font-black text-white ${statusColors[t.status] || 'bg-slate-700'}`}>{t.status}</div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-300 mb-4 bg-slate-900 p-3 rounded">
                    <p className="flex gap-2"><MapPin size={14} className="text-red-400"/> A: {t.origin}</p>
                    <p className="flex gap-2"><MapPin size={14} className="text-emerald-400"/> B: {t.dest}</p>
                  </div>
                  {canCreate && (
                    <div className="border-t border-slate-700 pt-3 text-center">
                      <p className="text-xs text-slate-400">Token Conductor: <span className="font-mono text-emerald-400 font-bold tracking-widest text-sm">{t.token}</span></p>
                    </div>
                  )}
                </Card>
              )
            })}
            {!fetchError && transports.length === 0 && <div className="col-span-full text-center p-10 border border-slate-800 border-dashed rounded-xl text-slate-500">No hay transportes agendados.</div>}
          </div>
        )}
      </div>
    );
  };

  // --- 4. MÓDULO RIDERS TÉCNICOS ---
  const RidersView = () => {
    const [riders, setRiders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTab, setEditTab] = useState('GENERAL');
    
    const canManageRiders = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER, ROLES.TECH].includes(currentUser.role);

    const defaultContent = {
      importante: '',
      contacto: { mgmtCel: '', mgmtCorreo: '', prodCel: '', prodCorreo: '' },
      soundcheck: 'Se espera un recinto cerrado, libre de ruidos, con el sistema ajustado y ruteado antes de la llegada del equipo técnico.',
      recordatorio: 'Si existe algún aspecto técnico o logístico difícil de cumplir, se solicita informar a producción con antelación.',
      outputs: [{ mix: '', player: '', monitor: '', obs: '' }],
      inputs: [{ ch: '1', name: '', mic: '', v48: '', stand: '', position: '', obs: '' }],
      backline: [{ col1: '', col2: '', col3: '', col4: '' }],
      visuals: [{ col1: '', col2: '', col3: '', col4: '' }]
    };

    const [form, setForm] = useState({ id: null, title: '', type: 'COMPLETO', content: defaultContent });

    const fetchRiders = async () => {
      setLoading(true); setFetchError(false);
      try {
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getRiders' }) });
        const json = await res.json();
        if (json.status === 'success') {
          const parsedRiders = json.data.map(r => {
            let parsedContent;
            try { parsedContent = JSON.parse(r.content); } 
            catch(e) { parsedContent = { ...defaultContent, importante: r.content }; }
            return { ...r, content: parsedContent };
          });
          setRiders(parsedRiders);
        }
      } catch(e) { setFetchError(true); }
      setLoading(false);
    };
    useEffect(() => { fetchRiders(); }, []);

    const handleSave = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
        const action = form.id ? 'updateRider' : 'createRider';
        const payloadToSave = { ...form, content: JSON.stringify(form.content) };
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action, payload: payloadToSave }) });
        showToast("Rider guardado correctamente."); setIsEditing(false); fetchRiders();
      } catch(e) { showToast("Error al guardar rider."); setLoading(false); }
    };

    const handleDelete = async (id) => {
      setLoading(true);
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'deleteRider', payload: { id } }) });
        showToast("Rider eliminado permanentemente."); fetchRiders();
      } catch(e) { showToast("Error al eliminar."); setLoading(false); }
    };

    const openEditor = (rider = null) => {
      if (rider) setForm({ ...rider });
      else setForm({ id: null, title: 'Nuevo Rider Téc.', type: 'COMPLETO', content: JSON.parse(JSON.stringify(defaultContent)) });
      setEditTab('GENERAL'); setIsEditing(true);
    };

    const restoreDefaults = () => {
      setForm(prev => ({ ...prev, content: JSON.parse(JSON.stringify(defaultContent)) }));
      showToast("Plantilla restaurada.");
    };

    const updateTable = (tableName, index, field, value) => {
      setForm(prev => {
        const newTable = [...prev.content[tableName]];
        newTable[index][field] = value;
        return { ...prev, content: { ...prev.content, [tableName]: newTable } };
      });
    };
    const addRow = (tableName, template) => {
      if (form.content[tableName].length >= 100) return showToast("Límite de 100 filas alcanzado.");
      setForm(prev => ({ ...prev, content: { ...prev.content, [tableName]: [...prev.content[tableName], template] } }));
    };
    const removeRow = (tableName, index) => {
      setForm(prev => {
        const newTable = [...prev.content[tableName]];
        newTable.splice(index, 1);
        return { ...prev, content: { ...prev.content, [tableName]: newTable } };
      });
    };

    const icons = { 'SONIDO': Mic2, 'ILUMINACIÓN': Lightbulb, 'STAGEPLOT': MapIcon, 'COMPLETO': FileText };

    return (
      <div className="space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
        <header className="border-b border-slate-800 pb-4 flex justify-between items-end">
          <div><h1 className="text-2xl font-black text-white flex items-center gap-3"><FileText className="text-emerald-500" size={28}/> Riders Técnicos</h1><p className="text-sm text-slate-400 mt-1">Especificaciones Técnicas Oficiales.</p></div>
          {canManageRiders && !isEditing && <Button icon={Plus} onClick={() => openEditor(null)}>Crear Rider</Button>}
        </header>

        {isEditing ? (
          <Card className="p-0 border-emerald-500 overflow-hidden flex flex-col h-[85vh]">
            <div className="p-4 border-b border-slate-700 bg-slate-900 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">{form.id ? 'Editar Rider' : 'Generar Nuevo Rider'}</h2>
                <Button variant="ghost" className="text-[10px] py-1 px-2 border border-slate-700" icon={RefreshCw} onClick={() => requestConfirm('¿Restaurar plantilla? Se borrarán los datos no guardados.', restoreDefaults)}>Restaurar Plantilla</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-xs text-slate-400 block mb-1">Título del Documento</label><input required className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} /></div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Área / Tipo</label>
                  <select className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white font-bold" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                    <option value="COMPLETO">RIDER COMPLETO</option>
                    <option value="SONIDO">SONIDO</option>
                    <option value="ILUMINACIÓN">ILUMINACIÓN</option>
                    <option value="STAGEPLOT">STAGEPLOT / BACKLINE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex overflow-x-auto bg-slate-900 border-b border-slate-700 shrink-0 hide-scrollbar">
              {['GENERAL', 'AUDIO', 'BACKLINE', 'VISUALES'].map(tab => (
                <button key={tab} type="button" onClick={() => setEditTab(tab)} className={`px-6 py-3 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${editTab === tab ? 'border-emerald-500 text-emerald-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'}`}>{tab}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
              {editTab === 'GENERAL' && (
                <div className="space-y-6">
                  <div><label className="text-sm font-bold text-white block mb-2">Sección IMPORTANTE</label><textarea className="w-full bg-slate-900 border-slate-700 rounded p-3 text-emerald-400 font-mono text-sm min-h-[100px] focus:border-emerald-500" value={form.content.importante} onChange={e=>setForm({...form, content: {...form.content, importante: e.target.value}})} placeholder="Información crucial..." /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="font-bold text-white text-sm">Contacto Management</h4>
                      <div><label className="text-xs text-slate-400">Celular</label><input className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white text-sm" value={form.content.contacto.mgmtCel} onChange={e=>setForm({...form, content: {...form.content, contacto: {...form.content.contacto, mgmtCel: e.target.value}}})} /></div>
                      <div><label className="text-xs text-slate-400">Correo</label><input className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white text-sm" value={form.content.contacto.mgmtCorreo} onChange={e=>setForm({...form, content: {...form.content, contacto: {...form.content.contacto, mgmtCorreo: e.target.value}}})} /></div>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="font-bold text-white text-sm">Contacto Producción</h4>
                      <div><label className="text-xs text-slate-400">Celular</label><input className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white text-sm" value={form.content.contacto.prodCel} onChange={e=>setForm({...form, content: {...form.content, contacto: {...form.content.contacto, prodCel: e.target.value}}})} /></div>
                      <div><label className="text-xs text-slate-400">Correo</label><input className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white text-sm" value={form.content.contacto.prodCorreo} onChange={e=>setForm({...form, content: {...form.content, contacto: {...form.content.contacto, prodCorreo: e.target.value}}})} /></div>
                    </div>
                  </div>
                  <div><label className="text-sm font-bold text-white block mb-2">Requerimientos de SoundCheck</label><textarea className="w-full bg-slate-900 border-slate-700 rounded p-3 text-emerald-400 font-mono text-sm min-h-[80px]" value={form.content.soundcheck} onChange={e=>setForm({...form, content: {...form.content, soundcheck: e.target.value}})} /></div>
                  <div><label className="text-sm font-bold text-white block mb-2">Recordatorio Oficial</label><textarea className="w-full bg-slate-900 border-slate-700 rounded p-3 text-red-400 font-mono text-sm min-h-[80px]" value={form.content.recordatorio} onChange={e=>setForm({...form, content: {...form.content, recordatorio: e.target.value}})} /></div>
                </div>
              )}

              {editTab === 'AUDIO' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-end mb-2"><h3 className="text-sm font-bold text-emerald-500">OUTPUT / MONITOR ({form.content.outputs.length}/100)</h3><Button variant="secondary" className="py-1 px-3 text-xs" icon={Plus} onClick={() => addRow('outputs', { mix: '', player: '', monitor: '', obs: '' })}>Fila</Button></div>
                    <div className="overflow-x-auto rounded border border-slate-700 bg-slate-900">
                      <table className="w-full text-left text-sm text-slate-300 min-w-[600px]"><thead className="bg-slate-800 text-xs"><tr><th className="p-2 w-16">MIX</th><th className="p-2">PLAYER</th><th className="p-2">MONITOR</th><th className="p-2">OBS</th><th className="p-2 w-10 text-center">X</th></tr></thead><tbody>{form.content.outputs.map((row, i) => (<tr key={i} className="border-t border-slate-800"><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.mix} onChange={e=>updateTable('outputs', i, 'mix', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.player} onChange={e=>updateTable('outputs', i, 'player', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.monitor} onChange={e=>updateTable('outputs', i, 'monitor', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.obs} onChange={e=>updateTable('outputs', i, 'obs', e.target.value)} /></td><td className="p-1 text-center"><button type="button" onClick={()=>removeRow('outputs', i)} className="text-red-500 p-1"><Trash2 size={14}/></button></td></tr>))}</tbody></table>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2"><h3 className="text-sm font-bold text-emerald-500">INPUT LIST ({form.content.inputs.length}/100)</h3><Button variant="secondary" className="py-1 px-3 text-xs" icon={Plus} onClick={() => addRow('inputs', { ch: String(form.content.inputs.length + 1), name: '', mic: '', v48: '', stand: '', position: '', obs: '' })}>Fila</Button></div>
                    <div className="overflow-x-auto rounded border border-slate-700 bg-slate-900">
                      <table className="w-full text-left text-sm text-slate-300 min-w-[800px]"><thead className="bg-slate-800 text-xs"><tr><th className="p-2 w-12">CH</th><th className="p-2">NAME</th><th className="p-2">MIC/DI</th><th className="p-2 w-16">48v</th><th className="p-2">STAND</th><th className="p-2">POSITION</th><th className="p-2">OBS</th><th className="p-2 w-10 text-center">X</th></tr></thead><tbody>{form.content.inputs.map((row, i) => (<tr key={i} className="border-t border-slate-800"><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1 text-center" value={row.ch} onChange={e=>updateTable('inputs', i, 'ch', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.name} onChange={e=>updateTable('inputs', i, 'name', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.mic} onChange={e=>updateTable('inputs', i, 'mic', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1 text-center" value={row.v48} onChange={e=>updateTable('inputs', i, 'v48', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.stand} onChange={e=>updateTable('inputs', i, 'stand', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.position} onChange={e=>updateTable('inputs', i, 'position', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.obs} onChange={e=>updateTable('inputs', i, 'obs', e.target.value)} /></td><td className="p-1 text-center"><button type="button" onClick={()=>removeRow('inputs', i)} className="text-red-500 p-1"><Trash2 size={14}/></button></td></tr>))}</tbody></table>
                    </div>
                  </div>
                </div>
              )}

              {editTab === 'BACKLINE' && (
                <div>
                  <div className="flex justify-between items-end mb-2"><h3 className="text-sm font-bold text-emerald-500">BACKLINE ({form.content.backline.length}/100)</h3><Button variant="secondary" className="py-1 px-3 text-xs" icon={Plus} onClick={() => addRow('backline', { col1: '', col2: '', col3: '', col4: '' })}>Fila</Button></div>
                  <div className="overflow-x-auto rounded border border-slate-700 bg-slate-900">
                    <table className="w-full text-left text-sm text-slate-300 min-w-[600px]"><thead className="bg-slate-800 text-xs"><tr><th className="p-2">ITEM</th><th className="p-2 w-24">CANT</th><th className="p-2">ESPECIFICACIONES</th><th className="p-2">OBS</th><th className="p-2 w-10 text-center">X</th></tr></thead><tbody>{form.content.backline.map((row, i) => (<tr key={i} className="border-t border-slate-800"><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.col1} onChange={e=>updateTable('backline', i, 'col1', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1 text-center" value={row.col2} onChange={e=>updateTable('backline', i, 'col2', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.col3} onChange={e=>updateTable('backline', i, 'col3', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.col4} onChange={e=>updateTable('backline', i, 'col4', e.target.value)} /></td><td className="p-1 text-center"><button type="button" onClick={()=>removeRow('backline', i)} className="text-red-500 p-1"><Trash2 size={14}/></button></td></tr>))}</tbody></table>
                  </div>
                </div>
              )}

              {editTab === 'VISUALES' && (
                <div>
                  <div className="flex justify-between items-end mb-2"><h3 className="text-sm font-bold text-emerald-500">VISUAL / LIGHTS ({form.content.visuals.length}/100)</h3><Button variant="secondary" className="py-1 px-3 text-xs" icon={Plus} onClick={() => addRow('visuals', { col1: '', col2: '', col3: '', col4: '' })}>Fila</Button></div>
                  <div className="overflow-x-auto rounded border border-slate-700 bg-slate-900">
                    <table className="w-full text-left text-sm text-slate-300 min-w-[600px]"><thead className="bg-slate-800 text-xs"><tr><th className="p-2">SISTEMA/EQUIPO</th><th className="p-2 w-24">CANT</th><th className="p-2">UBICACIÓN</th><th className="p-2">OBS</th><th className="p-2 w-10 text-center">X</th></tr></thead><tbody>{form.content.visuals.map((row, i) => (<tr key={i} className="border-t border-slate-800"><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.col1} onChange={e=>updateTable('visuals', i, 'col1', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1 text-center" value={row.col2} onChange={e=>updateTable('visuals', i, 'col2', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.col3} onChange={e=>updateTable('visuals', i, 'col3', e.target.value)} /></td><td className="p-1"><input className="w-full bg-transparent border border-slate-700 rounded p-1" value={row.col4} onChange={e=>updateTable('visuals', i, 'col4', e.target.value)} /></td><td className="p-1 text-center"><button type="button" onClick={()=>removeRow('visuals', i)} className="text-red-500 p-1"><Trash2 size={14}/></button></td></tr>))}</tbody></table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900 shrink-0 flex gap-3">
              <Button variant="secondary" className="flex-1 py-3" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1 py-3" onClick={handleSave} icon={Save}>Guardar Documento</Button>
            </div>
          </Card>
        ) : fetchError ? <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> Error al cargar Riders.</div> : loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32}/></div> : (
          <div className="grid grid-cols-1 gap-6">
            {riders.map((r, idx) => {
              const IconType = icons[r.type] || FileText;
              return (
                <Card key={idx} className="border-t-4 border-t-emerald-500 bg-slate-900">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex justify-center items-center"><IconType className="text-emerald-500" size={20}/></div>
                      <div><h3 className="font-black text-white text-xl">{r.title}</h3><span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 font-bold">{r.type}</span></div>
                    </div>
                    {canManageRiders && (
                      <div className="flex gap-2">
                        <Button variant="danger" className="px-3 bg-slate-800" icon={Trash2} onClick={() => requestConfirm("¿Eliminar este Rider permanentemente?", () => handleDelete(r.id))}></Button>
                        <Button variant="secondary" icon={Edit3} onClick={() => openEditor(r)}>Editar Rider</Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 space-y-6">
                    {r.content.importante && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg">
                        <h4 className="text-emerald-400 text-xs font-black mb-2 uppercase">Importante</h4>
                        <p className="text-sm text-emerald-100 whitespace-pre-wrap">{r.content.importante}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {r.content.contacto && (r.content.contacto.mgmtCel || r.content.contacto.mgmtCorreo) && (
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                          <h4 className="text-slate-400 text-xs font-black mb-2 uppercase">Contacto Management</h4>
                          <p className="text-sm text-white">📱 {r.content.contacto.mgmtCel || 'N/A'}</p>
                          <p className="text-sm text-white">✉️ {r.content.contacto.mgmtCorreo || 'N/A'}</p>
                        </div>
                      )}
                      {r.content.contacto && (r.content.contacto.prodCel || r.content.contacto.prodCorreo) && (
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                          <h4 className="text-slate-400 text-xs font-black mb-2 uppercase">Contacto Producción</h4>
                          <p className="text-sm text-white">📱 {r.content.contacto.prodCel || 'N/A'}</p>
                          <p className="text-sm text-white">✉️ {r.content.contacto.prodCorreo || 'N/A'}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {r.content.soundcheck && (
                         <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                           <h4 className="text-slate-400 text-xs font-black mb-2 uppercase">Requisitos SoundCheck</h4>
                           <p className="text-sm text-slate-300 whitespace-pre-wrap">{r.content.soundcheck}</p>
                         </div>
                      )}
                      {r.content.recordatorio && (
                         <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                           <h4 className="text-red-400 text-xs font-black mb-2 uppercase">Recordatorio</h4>
                           <p className="text-sm text-red-100 whitespace-pre-wrap">{r.content.recordatorio}</p>
                         </div>
                      )}
                    </div>

                    {r.content.inputs && r.content.inputs.length > 0 && r.content.inputs[0].name !== '' && (
                      <div className="mt-4"><h4 className="text-slate-400 text-xs font-black mb-2 uppercase">INPUT LIST</h4><div className="overflow-x-auto rounded border border-slate-700"><table className="w-full text-left text-sm text-slate-300"><thead className="bg-slate-800 text-xs uppercase text-slate-500"><tr><th className="p-2">CH</th><th className="p-2">NAME</th><th className="p-2">MIC/DI</th><th className="p-2">48v</th><th className="p-2">STAND</th><th className="p-2">POSITION</th><th className="p-2">OBS</th></tr></thead><tbody>{r.content.inputs.map((row, i) => row.name && <tr key={i} className="border-t border-slate-800"><td className="p-2 font-bold">{row.ch}</td><td className="p-2">{row.name}</td><td className="p-2">{row.mic}</td><td className="p-2 text-center">{row.v48}</td><td className="p-2">{row.stand}</td><td className="p-2">{row.position}</td><td className="p-2 text-xs">{row.obs}</td></tr>)}</tbody></table></div></div>
                    )}
                    {r.content.outputs && r.content.outputs.length > 0 && r.content.outputs[0].mix !== '' && (
                      <div className="mt-4"><h4 className="text-slate-400 text-xs font-black mb-2 uppercase">OUTPUT / MONITOR LIST</h4><div className="overflow-x-auto rounded border border-slate-700"><table className="w-full text-left text-sm text-slate-300"><thead className="bg-slate-800 text-xs uppercase text-slate-500"><tr><th className="p-2">MIX</th><th className="p-2">PLAYER</th><th className="p-2">MONITOR</th><th className="p-2">OBS</th></tr></thead><tbody>{r.content.outputs.map((row, i) => row.mix && <tr key={i} className="border-t border-slate-800"><td className="p-2 font-bold">{row.mix}</td><td className="p-2">{row.player}</td><td className="p-2">{row.monitor}</td><td className="p-2 text-xs">{row.obs}</td></tr>)}</tbody></table></div></div>
                    )}
                    {r.content.backline && r.content.backline.length > 0 && r.content.backline[0].col1 !== '' && (
                      <div className="mt-4"><h4 className="text-slate-400 text-xs font-black mb-2 uppercase">BACKLINE</h4><div className="overflow-x-auto rounded border border-slate-700"><table className="w-full text-left text-sm text-slate-300"><thead className="bg-slate-800 text-xs uppercase text-slate-500"><tr><th className="p-2">ITEM</th><th className="p-2">CANT</th><th className="p-2">ESPECIFICACIONES</th><th className="p-2">OBS</th></tr></thead><tbody>{r.content.backline.map((row, i) => row.col1 && <tr key={i} className="border-t border-slate-800"><td className="p-2 font-bold">{row.col1}</td><td className="p-2 text-center">{row.col2}</td><td className="p-2">{row.col3}</td><td className="p-2 text-xs">{row.col4}</td></tr>)}</tbody></table></div></div>
                    )}
                    {r.content.visuals && r.content.visuals.length > 0 && r.content.visuals[0].col1 !== '' && (
                      <div className="mt-4"><h4 className="text-slate-400 text-xs font-black mb-2 uppercase">VISUAL / LIGHTS</h4><div className="overflow-x-auto rounded border border-slate-700"><table className="w-full text-left text-sm text-slate-300"><thead className="bg-slate-800 text-xs uppercase text-slate-500"><tr><th className="p-2">SISTEMA/EQUIPO</th><th className="p-2">CANT</th><th className="p-2">UBICACIÓN</th><th className="p-2">OBS</th></tr></thead><tbody>{r.content.visuals.map((row, i) => row.col1 && <tr key={i} className="border-t border-slate-800"><td className="p-2 font-bold">{row.col1}</td><td className="p-2 text-center">{row.col2}</td><td className="p-2">{row.col3}</td><td className="p-2 text-xs">{row.col4}</td></tr>)}</tbody></table></div></div>
                    )}
                  </div>
                </Card>
              )
            })}
            {riders.length === 0 && <div className="text-center p-10 border border-slate-800 border-dashed rounded-xl text-slate-500">No hay Riders creados aún.</div>}
          </div>
        )}
      </div>
    );
  };

  // --- 5. DIRECTORIO STAFF ---
  const StaffDirectory = () => {
    const [directory, setDirectory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
      const fetchDirectory = async () => {
        try {
          const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getUsuarios' }) });
          const json = await res.json();
          if (json.status === 'success') {
            const activeUsers = json.data.filter(u => u.status === 'ACTIVO' && u.email !== currentUser.email);
            const canSeeEveryone = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER].includes(currentUser.role);
            if (canSeeEveryone) setDirectory(activeUsers);
            else setDirectory(activeUsers.filter(u => u.role === ROLES.TOUR_MANAGER));
          }
        } catch(e) { setFetchError(true); }
        setLoading(false);
      };
      fetchDirectory();
    }, []);

    return (
      <div className="space-y-6 animate-fade-in pb-24 max-w-5xl mx-auto">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-white flex items-center gap-3"><Users className="text-emerald-500" size={28} /> Directorio del Crew</h1>
          <p className="text-sm text-slate-400 mt-1">{[ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER].includes(currentUser.role) ? 'Lista completa del personal activo.' : 'Contactos de emergencia y Tour Managers asignados.'}</p>
        </header>
        {fetchError && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> Error al cargar el directorio.</div>}
        {loading && !fetchError ? ( <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32}/></div> ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directory.map((user, idx) => (
              <Card key={idx} className="p-5 flex flex-col justify-between">
                <div className="flex items-start gap-4 mb-4"><div className="w-12 h-12 rounded-full bg-slate-700 text-white font-black flex items-center justify-center text-xl shrink-0">{user.name.charAt(0)}</div><div className="flex-1 min-w-0"><h3 className="font-bold text-white text-lg truncate">{user.name}</h3><span className="text-[10px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold">{user.role}</span></div></div>
                <div className="space-y-2 mb-4 text-sm text-slate-300"><p className="flex items-center gap-2"><Phone size={14} className="text-slate-500"/> {user.phone}</p><p className="flex items-center gap-2 truncate"><Mail size={14} className="text-slate-500"/> {user.email}</p></div>
                <div className="flex flex-row gap-2 mt-auto border-t border-slate-700 pt-4"><Button variant="ghost" className="flex-1 bg-slate-900 border border-slate-700" icon={Mail} onClick={() => openEmail(user.email)}>Correo</Button><Button variant="primary" className="flex-1" icon={MessageSquare} onClick={() => openWhatsApp(user.phone)}>WhatsApp</Button></div>
              </Card>
            ))}
            {!fetchError && directory.length === 0 && ( <div className="col-span-full text-center p-10 border border-slate-800 border-dashed rounded-xl text-slate-500">No se encontraron contactos asignados.</div> )}
          </div>
        )}
      </div>
    );
  };

  // --- 6. MENSAJES CHAT ---
  const ChatView = () => {
    const [messages, setMessages] = useState([
      { id: 1, sender: 'Producción Central', role: ROLES.ADMIN, text: 'Bienvenidos al canal de comunicación oficial. Por favor confirmen recepción de los mensajes importantes.', time: '09:00 AM', readBy: [] }
    ]);
    const [newMsg, setNewMsg] = useState('');
    const canSendMessages = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER, ROLES.APV].includes(currentUser.role);

    const handleSend = (e) => {
      e.preventDefault();
      if (!newMsg.trim() || !canSendMessages) return;
      const msg = { id: Date.now(), sender: currentUser.name, role: currentUser.role, text: newMsg, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), readBy: [] };
      setMessages([...messages, msg]); setNewMsg('');
    };

    const toggleReadReceipt = (msgId) => {
      setMessages(messages.map(m => {
        if (m.id === msgId) {
          const hasRead = m.readBy.includes(currentUser.name);
          return { ...m, readBy: hasRead ? m.readBy.filter(n => n !== currentUser.name) : [...m.readBy, currentUser.name] };
        }
        return m;
      }));
    };

    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <header className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-3"><MessageSquare className="text-emerald-500" size={24} /><div><h2 className="font-black text-white text-lg leading-tight">Anuncios de Gira</h2><p className="text-xs text-slate-400">Canal oficial de producción</p></div></header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const isMe = msg.sender === currentUser.name;
            const hasRead = msg.readBy.includes(currentUser.name);
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1"><span className="text-xs font-bold text-slate-300">{isMe ? 'Tú' : msg.sender}</span><span className="text-[10px] text-emerald-500 uppercase font-black">{msg.role}</span><span className="text-[10px] text-slate-500">{msg.time}</span></div>
                <div className={`p-3 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>{msg.text}</div>
                {!isMe && ( <button onClick={() => toggleReadReceipt(msg.id)} className={`mt-1 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded transition-colors ${hasRead ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><CheckCheck size={12} /> {hasRead ? 'Marcado como Leído' : 'Marcar Leído'}</button> )}
                {isMe && msg.readBy.length > 0 && ( <span className="text-[10px] text-blue-400 mt-1 font-bold flex items-center gap-1"><CheckCheck size={12} /> Visto por {msg.readBy.length} {msg.readBy.length === 1 ? 'persona' : 'personas'}</span> )}
              </div>
            );
          })}
        </div>
        {canSendMessages ? (
          <form onSubmit={handleSend} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2"><input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Escribe un anuncio para el Crew..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"/><Button type="submit" variant="primary" icon={Send} className="px-4"></Button></form>
        ) : (
          <div className="p-3 bg-slate-800 border-t border-slate-700 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">Solo Producción puede enviar mensajes. Utiliza el botón "Marcar Leído".</div>
        )}
      </div>
    );
  };

  // --- 7. TIMING GLOBAL ---
  const TimingGlobalView = () => {
    return (
      <div className="text-center p-12 max-w-2xl mx-auto mt-10 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
        <Clock className="mx-auto text-emerald-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-white mb-2">Timing Organizado por Proyectos</h3>
        <p className="text-slate-400 text-sm mb-6">El Run of Show ahora se organiza de manera limpia dentro de cada proyecto o gira. Ingresa a un proyecto para ver sus horarios.</p>
        <Button onClick={() => setCurrentView('DASHBOARD')} icon={Navigation} className="mx-auto">Ir a Mis Proyectos</Button>
      </div>
    );
  };

  // --- 8. PANEL DE ADMINISTRADOR ---
  const AdminPanel = () => {
    const [dbUsers, setDbUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [activeTab, setActiveTab] = useState('PENDIENTES');
    const [processingId, setProcessingId] = useState(null);
    
    const [invName, setInvName] = useState('');
    const [invEmail, setInvEmail] = useState('');
    const [invPhone, setInvPhone] = useState('+569');
    const [invRole, setInvRole] = useState(ROLES.TECH);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
      setLoading(true); setFetchError(false);
      try {
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getUsuarios' }) });
        const json = await res.json();
        if (json.status === 'success') setDbUsers(json.data.filter(u => u.name));
      } catch(e) { setFetchError(true); }
      setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleApprove = async (email) => {
      setProcessingId(email);
      try {
        const res = await fetch('/.netlify/functions/api', {
          method: 'POST', body: JSON.stringify({ action: 'aprobarUsuario', payload: { email } })
        });
        const json = await res.json();
        if (json.status === 'success') { showToast("Usuario aprobado. Clave enviada por correo."); fetchUsers(); } 
        else { showToast("Error: " + json.message); }
      } catch(e) { showToast("Error de conexión al aprobar."); }
      setProcessingId(null);
    };

    const handleDirectInvite = async (e) => {
      e.preventDefault(); setProcessingId('inviting');
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'solicitarAcceso', payload: { name: invName, email: invEmail, phone: invPhone, role: invRole } }) });
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'aprobarUsuario', payload: { email: invEmail } }) });
        const json = await res.json();
        if(json.status === 'success') { showToast(`Acceso creado. Credenciales enviadas a ${invEmail}`); setInvName(''); setInvEmail(''); setActiveTab('DIRECTORIO'); fetchUsers(); }
      } catch(e) { showToast("Error al invitar integrante."); }
      setProcessingId(null);
    };

    const handleEditSave = (e) => {
      e.preventDefault();
      setDbUsers(prev => prev.map(u => u.email === editingUser.email ? editingUser : u));
      showToast("Perfil actualizado exitosamente."); setEditingUser(null);
    };

    const pendingUsers = dbUsers.filter(u => u.status === 'PENDING');
    const activeUsers = dbUsers.filter(u => u.status === 'ACTIVO' || u.status === 'INACTIVO');

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-24 animate-fade-in">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-black text-white flex items-center gap-3"><ShieldCheck className="text-emerald-500" size={28} /> Consola de Administración</h1>
          <p className="text-sm text-slate-400 mt-1">Gestión global de accesos, roles y perfiles.</p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <Button variant={activeTab === 'PENDIENTES' ? 'primary' : 'secondary'} onClick={() => setActiveTab('PENDIENTES')} icon={Bell}>Solicitudes ({pendingUsers.length})</Button>
          <Button variant={activeTab === 'DIRECTORIO' ? 'primary' : 'secondary'} onClick={() => setActiveTab('DIRECTORIO')} icon={Users}>Directorio y Edición</Button>
          <Button variant={activeTab === 'INVITAR' ? 'primary' : 'secondary'} onClick={() => setActiveTab('INVITAR')} icon={UserPlus}>Invitar Integrante</Button>
        </div>
        
        {fetchError && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> Error de conexión al cargar la data.</div>}
        {loading && !fetchError ? ( <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32}/></div> ) : !fetchError && (
          <>
            {activeTab === 'PENDIENTES' && (
              <div className="space-y-4">
                {pendingUsers.length === 0 ? <div className="text-center p-10 border border-slate-800 border-dashed rounded-xl text-slate-500">No hay solicitudes pendientes.</div> : pendingUsers.map(u => (
                  <Card key={u.email} className="p-5 border-l-4 border-l-amber-500">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div><h3 className="text-lg font-bold text-white flex items-center gap-2">{u.name} <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded uppercase font-black tracking-wider">PENDIENTE</span></h3><p className="text-sm text-slate-400 mt-1">{u.email} • {u.phone}</p><p className="text-xs text-emerald-400 font-bold mt-1 uppercase">Rol Solicitado: {u.role}</p></div>
                      <div className="flex flex-row gap-2 shrink-0"><Button variant="danger" icon={X} className="flex-1" onClick={() => requestConfirm("¿Rechazar esta solicitud?", () => showToast("Solicitud rechazada."))}>Rechazar</Button><Button variant="primary" icon={Key} className="flex-1" disabled={processingId === u.email} onClick={() => handleApprove(u.email)}>{processingId === u.email ? 'Aprobando...' : 'Aprobar'}</Button></div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {activeTab === 'DIRECTORIO' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeUsers.map(u => (
                  <Card key={u.email} className={`p-5 flex flex-col ${u.status === 'INACTIVO' ? 'opacity-50 grayscale' : ''}`}>
                    {editingUser?.email === u.email ? (
                      <form onSubmit={handleEditSave} className="space-y-3 animate-fade-in">
                        <h4 className="text-sm font-bold text-emerald-400 border-b border-slate-700 pb-2">Editar a {u.name}</h4>
                        <input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2"><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={editingUser.phone} onChange={e=>setEditingUser({...editingUser, phone: e.target.value})} /><select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" value={editingUser.role} onChange={e=>setEditingUser({...editingUser, role: e.target.value})}>{Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-bold" value={editingUser.status} onChange={e=>setEditingUser({...editingUser, status: e.target.value})}><option value="ACTIVO">ACTIVO</option><option value="INACTIVO">BLOQUEADO</option></select>
                        <div className="flex flex-row gap-2 mt-3"><Button variant="ghost" className="flex-1 bg-slate-800" onClick={() => setEditingUser(null)}>Cancelar</Button><Button type="submit" variant="primary" className="flex-1">Guardar</Button></div>
                      </form>
                    ) : (
                      <><div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 rounded-full bg-slate-700 text-white font-black flex items-center justify-center text-xl shrink-0">{u.name?.charAt(0) || '?'}</div><div className="flex-1 min-w-0"><h3 className="font-bold text-white text-lg truncate">{u.name}</h3><span className="text-[10px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold">{u.role}</span></div>{u.status === 'INACTIVO' && <span className="text-[10px] text-red-500 font-bold border border-red-500/50 px-2 py-1 rounded">BLOQUEADO</span>}</div><div className="mt-auto pt-4 border-t border-slate-700/50 flex flex-row gap-2"><Button variant="secondary" className="flex-1" icon={Edit3} onClick={() => setEditingUser(u)}>Editar</Button></div></>
                    )}
                  </Card>
                ))}
              </div>
            )}
            {activeTab === 'INVITAR' && (
              <Card className="max-w-xl mx-auto p-6 border-t-4 border-emerald-500">
                <h2 className="text-xl font-bold text-white mb-2">Crear Acceso Directo</h2>
                <form onSubmit={handleDirectInvite} className="space-y-4">
                  <div><label className="block text-xs font-bold text-slate-400 mb-1">Nombre Completo</label><input type="text" value={invName} onChange={e=>setInvName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" required /></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-400 mb-1">Correo</label><input type="email" value={invEmail} onChange={e=>setInvEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" required /></div><div><label className="block text-xs font-bold text-slate-400 mb-1">Teléfono</label><input type="tel" value={invPhone} onChange={e=>setInvPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" required /></div></div>
                  <div><label className="block text-xs font-bold text-slate-400 mb-1">Rol</label><select value={invRole} onChange={e=>setInvRole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500">{Object.values(ROLES).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                  <Button type="submit" variant="primary" className="w-full py-4 text-lg mt-4" disabled={processingId === 'inviting'} icon={UserCheck}>{processingId === 'inviting' ? 'Generando...' : 'Crear y Enviar Credenciales'}</Button>
                </form>
              </Card>
            )}
          </>
        )}
      </div>
    );
  };

  // --- 9. MI PERFIL ---
  const ProfileView = () => {
    const [pPhone, setPPhone] = useState(currentUser.phone || '');
    const [pTalla, setPTalla] = useState(currentUser.talla || 'M');
    const [pDieta, setPDieta] = useState(currentUser.dieta || 'OMNÍVORA');
    
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    
    const [saving, setSaving] = useState(false);

    const handleUpdate = async (e) => {
      e.preventDefault();
      if (newPass && newPass !== confirmPass) return showToast("Las contraseñas no coinciden.");

      setSaving(true);
      try {
        const payload = { email: currentUser.email, phone: pPhone, talla: pTalla, dieta: pDieta };
        if (newPass && oldPass) { payload.oldPassword = oldPass; payload.newPassword = newPass; }
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'updateProfile', payload }) });
        const json = await res.json();
        if (json.status === 'success') {
          setCurrentUser({ ...currentUser, phone: pPhone, talla: pTalla, dieta: pDieta });
          setOldPass(''); setNewPass(''); setConfirmPass('');
          showToast(newPass ? "¡Perfil y Contraseña actualizados!" : "¡Perfil actualizado!");
        } else { showToast(json.message); }
      } catch (err) { showToast("Error al guardar."); }
      setSaving(false);
    };

    return (
      <div className="max-w-xl mx-auto animate-fade-in pb-24">
        <header className="mb-6"><h1 className="text-2xl font-black text-white flex items-center gap-3"><User className="text-emerald-500" size={28}/> Mi Perfil</h1></header>
        <Card className="p-6">
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="pb-4 border-b border-slate-700"><label className="block text-xs font-bold text-slate-400 mb-1">Nombre</label><input type="text" value={currentUser.name} disabled className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-500 text-sm cursor-not-allowed" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-slate-400 mb-1">Teléfono</label><input type="text" value={pPhone} onChange={e=>setPPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" required /></div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Talla (Merch/Crew)</label>
                <select value={pTalla} onChange={e=>setPTalla(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500">
                  <option value="XS">XS - Extra Pequeño</option><option value="S">S - Pequeño</option><option value="M">M - Mediano</option><option value="L">L - Grande</option><option value="XL">XL - Extra Grande</option><option value="XXL">XXL - Doble Extra Grande</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Preferencia de Alimentación (Catering)</label>
              <select value={pDieta} onChange={e=>setPDieta(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500">
                <option value="OMNÍVORA">Omnívora (Estándar)</option><option value="VEGETARIANA">Vegetariana</option><option value="VEGANA">Vegana</option><option value="CRUDÍVORA">Crudívora</option><option value="FLEXITARIANA">Flexitariana</option><option value="SIN GLUTEN">Sin Gluten</option><option value="BAJA EN FODMAP">Baja en FODMAP</option><option value="HIPOSÓDICA">Hiposódica</option><option value="DIABÉTICA">Diabética</option><option value="KETO">Keto</option><option value="MEDITERRÁNEA">Mediterránea</option>
              </select>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 flex gap-3 items-start mt-2">
              <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">La información será utilizada únicamente para informar a la producción.</p>
            </div>
            <div className="pt-4 border-t border-slate-700 mt-4 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2"><Key size={16}/> Cambiar Contraseña (Opcional)</h3>
              <input type="password" placeholder="Contraseña Actual" value={oldPass} onChange={e=>setOldPass(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" />
              <input type="password" placeholder="Nueva Contraseña" value={newPass} onChange={e=>setNewPass(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:border-emerald-500" />
              <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} className={`w-full bg-slate-900 border rounded-lg p-3 text-white text-sm outline-none ${confirmPass && newPass !== confirmPass ? 'border-red-500' : 'border-slate-700 focus:border-emerald-500'}`} />
              {confirmPass && newPass !== confirmPass && <p className="text-xs text-red-500 font-bold">Las contraseñas no coinciden</p>}
            </div>
            <Button type="submit" variant="primary" className="w-full py-4 mt-6" disabled={saving || (confirmPass && newPass !== confirmPass)}>{saving ? <Loader2 className="animate-spin"/> : 'Guardar Cambios'}</Button>
          </form>
        </Card>
      </div>
    );
  };

  // --- 10. DASHBOARD PRINCIPAL (MÓDULO DE PROYECTOS) ---
  const Dashboard = () => {
    const canCreate = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER].includes(currentUser.role);
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'Gira Musical' });

    const fetchProyectos = async () => {
      setLoading(true); setFetchError(false);
      try {
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getProyectos' }) });
        const json = await res.json();
        if (json.status === 'success') setProyectos(json.data);
        else setFetchError(true);
      } catch (e) { setFetchError(true); }
      setLoading(false);
    };

    useEffect(() => { fetchProyectos(); }, []);

    const handleCreateProyecto = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
        const payload = { ...form, manager: currentUser.name };
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'createProyecto', payload }) });
        showToast("Proyecto creado exitosamente."); setIsCreating(false); setForm({ name: '', type: 'Gira Musical' }); fetchProyectos();
      } catch(e) { showToast("Error al crear proyecto."); setLoading(false); }
    };

    const handleUpdateStatus = async (e, id, currentStatus) => {
      e.stopPropagation(); // Evita que se abra el proyecto al hacer clic en este botón
      const newStatus = currentStatus === 'ACTIVO' ? 'FINALIZADO' : 'ACTIVO';
      setLoading(true);
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'updateProyectoStatus', payload: { id, status: newStatus } }) });
        showToast("Estado actualizado."); fetchProyectos();
      } catch(e) { showToast("Error al actualizar."); setLoading(false); }
    };

    return (
      <div className="space-y-6 animate-fade-in pb-24 max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-800 pb-6">
          <div><h1 className="text-3xl font-black text-white leading-tight">Hola, {currentUser.name.split(' ')[0]}</h1><p className="text-emerald-400 text-sm font-black uppercase tracking-wider">{currentUser.role}</p></div>
          <div className="flex flex-wrap gap-2">
            {canCreate && !isCreating && <Button icon={FolderPlus} variant="primary" onClick={() => setIsCreating(true)}>Nuevo Proyecto</Button>}
          </div>
        </header>

        {isCreating && (
          <Card className="p-6 border-emerald-500 mb-6 max-w-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Iniciar Nuevo Proyecto / Gira</h2>
            <form onSubmit={handleCreateProyecto} className="space-y-4">
              <div><label className="text-xs text-slate-400 block mb-1">Nombre del Proyecto (Ej: Gira Sudamérica 2026)</label><input required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo de Producción</label>
                <select className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" value={form.type} onChange={e=>setForm({...form, type: e.target.value})}>
                  <option value="Gira Musical">Gira Musical (Tour)</option><option value="Festival">Festival</option><option value="Show Único">Show Único (One-Off)</option><option value="Evento Corporativo">Evento Corporativo</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2"><Button variant="secondary" className="flex-1" onClick={()=>setIsCreating(false)}>Cancelar</Button><Button type="submit" className="flex-1">Guardar Proyecto</Button></div>
            </form>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2"><Navigation size={20}/> Proyectos Activos</h2>
          {fetchError ? <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> Error de conexión al cargar proyectos.</div> : loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32}/></div> : proyectos.length === 0 ? <div className="text-center p-10 border border-slate-800 border-dashed rounded-xl text-slate-500">No hay proyectos activos registrados.</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyectos.map(proyecto => (
                <Card 
                  key={proyecto.id} 
                  onClick={() => { setSelectedProject(proyecto); setCurrentView('PROJECT_DETAILS'); }}
                  className={`group cursor-pointer ${proyecto.status === 'ACTIVO' ? 'hover:border-emerald-500' : 'opacity-70 grayscale hover:grayscale-0'}`}
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20"><Music className="text-emerald-500" size={24} /></div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded block w-fit ${proyecto.status === 'ACTIVO' ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-800 border border-slate-700'}`}>{proyecto.status}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight mb-1">{proyecto.name}</h2>
                    <p className="text-[11px] font-bold uppercase text-emerald-400 mb-3">{proyecto.type}</p>
                    <p className="text-sm text-slate-400 mb-4 flex items-center gap-2"><User size={14}/> Manager: {proyecto.manager}</p>
                    <div className="flex flex-row gap-2 border-t border-slate-700 pt-4">
                      {canCreate && (
                        <>
                          <Button variant="ghost" className="flex-1 bg-slate-900 border border-slate-700 hover:text-white text-xs" onClick={(e) => { e.stopPropagation(); showToast("Para editar nombre hazlo desde la Base de Datos."); }}>Editar</Button>
                          <Button variant="ghost" className="flex-1 bg-slate-900 border border-slate-700 hover:text-emerald-400 text-xs" onClick={(e) => handleUpdateStatus(e, proyecto.id, proyecto.status)}>
                            {proyecto.status === 'ACTIVO' ? 'Finalizar' : 'Reactivar'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- 11. DETALLES DEL PROYECTO (HITOS / TIMING INTERNO) ---
  const ProjectDetailsView = () => {
    const p = selectedProject;
    const canManage = [ROLES.ADMIN, ROLES.MANAGER, ROLES.TOUR_MANAGER].includes(currentUser.role);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hitos, setHitos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ title: '', location: '', date: '', time: '' });
    
    // Asignación Modal
    const [assigningHito, setAssigningHito] = useState(null);
    const [directory, setDirectory] = useState([]);

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const fetchHitos = async () => {
      setLoading(true); setFetchError(false);
      try {
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getHitos' }) });
        const json = await res.json();
        
        if (json.status === 'success') {
          // Filtro ESTRICTO validando IDs como strings para evitar pérdidas por tipos de datos
          const projectHitos = json.data.filter(ev => String(ev.proyectoId) === String(p.id));
          
          const parsedEvents = projectHitos.map(ev => {
            let fullDate = null;
            if(ev.date && ev.time) {
               const dateObj = new Date(`${ev.date}T${ev.time}:00`);
               if(!isNaN(dateObj.getTime())) fullDate = dateObj;
            }
            return { ...ev, fullDate };
          });
          setHitos(parsedEvents.filter(e => e.fullDate !== null).sort((a,b) => a.fullDate - b.fullDate));
        } else setFetchError(json.message);
      } catch(e) { setFetchError("Fallo de red al obtener hitos."); }
      setLoading(false);
    };

    useEffect(() => { fetchHitos(); }, []);

    const fetchDirectory = async () => {
      try {
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'getUsuarios' }) });
        const json = await res.json();
        if (json.status === 'success') setDirectory(json.data.filter(u => u.status === 'ACTIVO'));
      } catch(e) { showToast("No se pudo cargar el directorio."); }
    };

    const handleCreateHito = async (e) => {
      e.preventDefault(); setLoading(true);
      try {
        const payload = { ...form, proyectoId: p.id };
        const res = await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'createHito', payload }) });
        const json = await res.json();
        if (json.status === 'success') {
          showToast("Hito agendado."); setIsCreating(false); setForm({ title: '', location: '', date: '', time: '' }); fetchHitos();
        } else {
          showToast("Error del servidor: " + json.message); setLoading(false);
        }
      } catch(e) { showToast("Error al crear hito."); setLoading(false); }
    };

    const handleDeleteHito = async (id) => {
      setLoading(true);
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'deleteHito', payload: { id } }) });
        showToast("Hito eliminado."); fetchHitos();
      } catch(e) { showToast("Error al eliminar."); setLoading(false); }
    };

    const captureGPS = () => {
      if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setForm(prev => ({...prev, location: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`}));
          showToast("GPS Capturado correctamente");
        }, () => showToast("Error al obtener GPS. Activa los permisos."));
      } else showToast("Tu navegador no soporta GPS.");
    };

    const toggleAssign = (email) => {
      setAssigningHito(prev => {
        const isAssigned = prev.asignados.includes(email);
        const newAsignados = isAssigned ? prev.asignados.filter(e => e !== email) : [...prev.asignados, email];
        return { ...prev, asignados: newAsignados };
      });
    };

    const saveAsignaciones = async () => {
      setLoading(true);
      try {
        await fetch('/.netlify/functions/api', { method: 'POST', body: JSON.stringify({ action: 'updateHitoAsignaciones', payload: { id: assigningHito.id, asignados: assigningHito.asignados } }) });
        showToast("Asignaciones guardadas."); setAssigningHito(null); fetchHitos();
      } catch(e) { showToast("Error al guardar."); setLoading(false); }
    };

    const getStatus = (targetDate) => {
      const diffMs = targetDate - currentTime;
      if (diffMs <= 0) return { border: 'border-slate-700', bg: 'bg-slate-800/50', dot: 'bg-slate-500', text: 'En curso o Finalizado', timeText: '00h 00m 00s', pulse: false, textClass: 'text-slate-500' };
      const diffSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      const timeText = `Faltan ${hh}h ${mm}m ${ss}s`;

      if (hours < 2) return { border: 'border-red-500/50', bg: 'bg-red-500/10', dot: 'bg-red-500', text: '¡INMINENTE!', timeText, pulse: true, textClass: 'text-red-500' };
      else if (hours < 24) return { border: 'border-amber-500/50', bg: 'bg-amber-500/10', dot: 'bg-amber-500', text: 'En preparación', timeText, pulse: false, textClass: 'text-amber-500' };
      else return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', text: 'Agendado', timeText, pulse: false, textClass: 'text-emerald-500' };
    };

    return (
      <div className="space-y-6 animate-fade-in pb-24 max-w-4xl mx-auto">
        <button onClick={() => setCurrentView('DASHBOARD')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"><ChevronLeft size={20}/> Volver a Proyectos</button>
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div><span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 uppercase font-bold tracking-wider mb-2 inline-block">VISTA PROYECTO</span><h1 className="text-3xl font-black text-white leading-tight">{p.name}</h1><p className="text-sm text-slate-400 mt-1 flex items-center gap-2"><User size={14}/> Liderado por: {p.manager}</p></div>
          <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-xl flex items-center gap-3 shadow-inner"><Timer className="text-emerald-500 animate-pulse" size={20} /><div className="text-2xl font-black text-white tracking-widest font-mono">{currentTime.toLocaleTimeString()}</div></div>
        </header>

        <div className="flex justify-between items-center mt-8 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Clock className="text-emerald-500"/> Run of Show / Timing del Proyecto</h2>
          {canManage && !isCreating && <Button icon={Plus} onClick={() => setIsCreating(true)}>Agregar Hito</Button>}
        </div>

        {isCreating && (
          <Card className="p-6 border-emerald-500 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Agendar Nuevo Hito</h2>
            <form onSubmit={handleCreateHito} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Título del Hito</label>
                  <input list="hitos-list" required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" placeholder="Ej: Soundcheck, Load In..." value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
                  <datalist id="hitos-list"><option value="Load In (Montaje)" /><option value="Soundcheck (Prueba de Sonido)" /><option value="Puertas (Apertura al público)" /><option value="Show Telonero" /><option value="Show Principal" /><option value="Load Out (Desmontaje)" /></datalist>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ubicación / Locación</label>
                  <div className="flex items-center gap-2">
                    <input required className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" placeholder="Ej: Escenario Principal" value={form.location} onChange={e=>setForm({...form, location: e.target.value})} />
                    <Button type="button" variant="secondary" icon={MapPin} onClick={captureGPS} title="Usar mi ubicación actual" />
                  </div>
                </div>
                <div><label className="text-xs text-slate-400 block mb-1">Fecha</label><input required type="date" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" onChange={e=>setForm({...form, date: e.target.value})} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Hora</label><input required type="time" className="w-full bg-slate-900 border-slate-700 rounded p-2 text-white" onChange={e=>setForm({...form, time: e.target.value})} /></div>
              </div>
              <div className="flex gap-2 pt-2"><Button variant="secondary" className="flex-1" onClick={()=>setIsCreating(false)}>Cancelar</Button><Button type="submit" className="flex-1">Guardar Hito</Button></div>
            </form>
          </Card>
        )}

        {fetchError && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 flex items-center gap-3"><AlertCircle size={20} /> {fetchError}</div>}
        {loading && !fetchError ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-emerald-500" size={32}/></div> : !fetchError && hitos.length === 0 ? (
          <div className="text-center p-12 border border-slate-800 border-dashed rounded-xl bg-slate-900/50">
            <CalendarPlus className="mx-auto text-slate-600 mb-4" size={48} />
            <p className="text-slate-400 text-sm max-w-md mx-auto">Aún no has agregado hitos al timing de este proyecto.</p>
          </div>
        ) : !fetchError && (
          <div className="space-y-4">
            {hitos.map((event) => {
              const status = getStatus(event.fullDate);
              const isAssignedToMe = event.asignados.includes(currentUser.email);
              return (
                <div key={event.id} className={`p-5 rounded-xl border transition-all duration-500 relative group ${status.bg} ${status.border}`}>
                  {canManage && (
                    <button onClick={() => requestConfirm("¿Eliminar este Hito de forma permanente?", () => handleDeleteHito(event.id))} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                  )}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-3 h-3 rounded-full ${status.dot} ${status.pulse ? 'animate-pulse' : ''}`}></span>
                        <span className={`text-xs font-black uppercase tracking-wider ${status.textClass}`}>{status.text}</span>
                        {isAssignedToMe && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-500/50">Asignado a ti</span>}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1 pr-8">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 font-bold mb-3">
                        <span className="flex items-center gap-1"><Calendar size={14}/> {event.date}</span>
                        <span className="flex items-center gap-1 text-emerald-400"><Clock size={14}/> {event.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={14}/> {event.location}</span>
                      </div>
                      {canManage && (
                        <Button variant="ghost" className="bg-slate-900 border border-slate-700 text-xs py-1" icon={Users} onClick={() => { setAssigningHito(event); fetchDirectory(); }}>
                          Personal Asignado ({event.asignados.length})
                        </Button>
                      )}
                    </div>
                    <div className={`shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg border bg-slate-900 ${status.border} ${status.textClass} font-mono font-black text-lg tracking-wider`}>
                      <Hourglass size={18} className={status.pulse ? 'animate-spin-slow' : ''} />{status.timeText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de Asignación de Personal */}
        {assigningHito && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md p-6 bg-slate-900 border-emerald-500 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Asignar Crew a Hito</h2>
                <button onClick={() => setAssigningHito(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
              </div>
              <p className="text-sm text-emerald-400 font-bold mb-4">{assigningHito.title}</p>
              
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                {directory.length === 0 ? <p className="text-slate-500 text-sm text-center">Cargando directorio...</p> : directory.map(u => {
                  const isChecked = assigningHito.asignados.includes(u.email);
                  return (
                    <button key={u.email} onClick={() => toggleAssign(u.email)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${isChecked ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                      <div className="flex items-center gap-3">
                        {isChecked ? <CheckSquare className="text-emerald-500" size={20}/> : <Square size={20}/>}
                        <div className="text-left"><p className="font-bold text-sm">{u.name}</p><p className="text-[10px] uppercase tracking-wider">{u.role}</p></div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <Button onClick={saveAsignaciones} className="w-full py-3" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Guardar Asignaciones'}</Button>
            </Card>
          </div>
        )}
      </div>
    );
  };

  // --- MODAL DE CONFIRMACIÓN GLOBAL ---
  const ConfirmModal = () => {
    if (!confirmDialog.isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-sm p-6 bg-slate-900 border-red-500/50">
          <div className="flex items-center gap-3 text-red-500 mb-4"><AlertCircle size={28} /><h2 className="text-xl font-black text-white">¿Estás seguro?</h2></div>
          <p className="text-slate-300 mb-6">{confirmDialog.text}</p>
          <div className="flex gap-3"><Button variant="ghost" className="flex-1 bg-slate-800 hover:text-white" onClick={() => setConfirmDialog({ isOpen: false, text: '', onConfirm: null })}>Cancelar</Button><Button variant="danger" className="flex-1 bg-red-600 text-white hover:bg-red-500" onClick={confirmDialog.onConfirm}>Confirmar Acción</Button></div>
        </Card>
      </div>
    );
  };

  // --- RENDERIZADO PRINCIPAL ---
  if (!currentUser) return (
    <>
      {toastMessage && <div className="fixed top-4 right-4 z-[300] bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in"><CheckCircle2 size={20} /><span className="font-bold text-sm">{toastMessage}</span></div>}
      <AuthRouter />
    </>
  );
  
  if (currentUser.role === 'CONDUCTOR') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        {toastMessage && <div className="fixed top-4 right-4 z-[300] bg-blue-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in"><CheckCircle2 size={20} /><span className="font-bold text-sm">{toastMessage}</span></div>}
        <div className="p-4 flex justify-between items-center bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2"><Truck className="text-blue-500"/><span className="text-white font-bold tracking-widest">CONDUCTOR</span></div>
          <Button variant="ghost" className="text-red-400" onClick={() => setCurrentUser(null)} icon={LogOut}>Salir</Button>
        </div>
        <ConductorView />
      </div>
    );
  }

  const menuOptions = getMenuOptions();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      <ConfirmModal />
      {toastMessage && <div className="fixed top-4 right-4 z-[300] bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in"><CheckCircle2 size={20} /><span className="font-bold text-sm">{toastMessage}</span></div>}

      <aside className="bg-slate-900 border-r border-slate-800 w-64 shrink-0 hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800"><Music className="text-emerald-500" size={24} /><h1 className="text-xl font-black text-white tracking-widest">ESQUEMAPPS</h1></div>
        <div className="p-4 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {menuOptions.map(opt => (
            <button key={opt.id} onClick={() => setCurrentView(opt.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors text-left ${currentView === opt.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'}`}><opt.icon size={20} />{opt.label}</button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-sm font-black text-emerald-500 border border-emerald-500 shrink-0">{currentUser.name.charAt(0)}</div>
             <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{currentUser.name}</p><p className="text-[10px] text-slate-400 uppercase font-bold truncate">{currentUser.role}</p></div>
           </div>
           <Button variant="danger" icon={LogOut} onClick={() => requestConfirm("¿Cerrar sesión?", () => setCurrentUser(null))} className="w-full py-2.5 bg-transparent border-transparent hover:bg-red-500/10">Cerrar Sesión</Button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-y-auto h-screen bg-slate-950 custom-scrollbar">
        <div className="p-4 md:p-8">
          {currentView === 'DASHBOARD' && <Dashboard />}
          {currentView === 'PROJECT_DETAILS' && <ProjectDetailsView />}
          {currentView === 'ADMIN_PANEL' && <AdminPanel />}
          {currentView === 'PROFILE' && <ProfileView />}
          {currentView === 'STAFF' && <StaffDirectory />}
          {currentView === 'CHAT' && <ChatView />}
          {currentView === 'TIMING' && <TimingGlobalView />}
          {currentView === 'TRANSPORT' && <TransportView />}
          {currentView === 'RIDERS' && <RidersView />}
        </div>
      </main>
      
      <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-between px-2 pb-safe z-50 overflow-x-auto hide-scrollbar">
         {menuOptions.map(opt => (
            <button key={opt.id} onClick={() => setCurrentView(opt.id)} className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[70px] flex-1 transition-colors ${currentView === opt.id ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
              <opt.icon size={20} className="shrink-0" />
              <span className="text-[10px] font-bold truncate w-full text-center">{opt.label}</span>
            </button>
          ))}
      </nav>
    </div>
  );
}