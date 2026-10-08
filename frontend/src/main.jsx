import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, CalendarDays, Check,
  ChevronDown, CircleUserRound, Clock3, Compass, Image as ImageIcon, LogOut, MapPin,
  Plus, Search, Users, UserRoundPlus, X
} from 'lucide-react';
import './style.css';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const PAGE_INFO = {
  resumo: { label: 'Visão geral', title: 'Caminhamos juntos.' },
  membros: { label: 'Membros', title: 'Pessoas da comunidade.' },
  eventos: { label: 'Encontros', title: 'O que vem pela frente.' },
  coordenadores: { label: 'Coordenação', title: 'Quem cuida do caminho.' },
  presencas: { label: 'Presenças', title: 'Quem esteve com a gente.' }
};

const toDate = value => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const formatDate = (value, options = { day: '2-digit', month: 'long', year: 'numeric' }) => {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat('pt-BR', options).format(date) : 'Data indisponível';
};
const formatTime = value => {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date) : '—';
};
const brazilianPhoneDigits = value => {
  let digits = String(value || '').replace(/\D/g, '');
  if (/^\s*\+55/.test(String(value || ''))) digits = digits.slice(2);
  return digits;
};
const hasUnsupportedPhoneCountryCode = value => {
  const phone = String(value || '').trim();
  return phone.includes('+') && (!phone.startsWith('+') || !phone.startsWith('+55'));
};
const isCompleteBrazilianPhone = value => [10, 11].includes(brazilianPhoneDigits(value).length);
const maskBrazilianPhone = value => {
  if (hasUnsupportedPhoneCountryCode(value)) return String(value || '');
  const digits = brazilianPhoneDigits(value);
  const limitedDigits = digits.slice(0, 11);
  if (!limitedDigits) return '';
  if (limitedDigits.length <= 2) return limitedDigits.length === 2 ? `(${limitedDigits})` : `(${limitedDigits}`;
  const ddd = limitedDigits.slice(0, 2);
  const number = limitedDigits.slice(2);
  const prefixLength = number.length > 8 ? 5 : 4;
  const prefix = number.slice(0, prefixLength);
  const suffix = number.slice(prefixLength);
  return `(${ddd}) ${prefix}${suffix ? `-${suffix}` : ''}`;
};
const formatStamp = value => {
  const date = toDate(value);
  if (!date) return { day: '—', month: '---', weekday: '' };
  return {
    day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
    weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)
  };
};
const dateValue = value => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const toLocalInput = value => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('jslg-token') || '');
  const [usuario, setUsuario] = useState(() => localStorage.getItem('jslg-usuario') || '');
  const [papel, setPapel] = useState(() => localStorage.getItem('jslg-papel') || 'COORDENADOR');
  const [coordenadores, setCoordenadores] = useState([]);
  const [posterRevision, setPosterRevision] = useState(0);
  const [page, setPage] = useState('resumo');
  const [agora, setAgora] = useState(() => new Date());
  const [membros, setMembros] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [presentes, setPresentes] = useState([]);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [busca, setBusca] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState(null);
  const searchRef = useRef(null);

  const call = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
    if (response.status === 401) {
      localStorage.removeItem('jslg-token');
      localStorage.removeItem('jslg-usuario');
      localStorage.removeItem('jslg-papel');
      setToken('');
      setUsuario('');
      setPapel('COORDENADOR');
      throw new Error('Sua sessão terminou. Entre novamente para continuar.');
    }
    if (!response.ok) {
      let message = `Não foi possível concluir a ação (${response.status}).`;
      try {
        const data = await response.json();
        message = Object.values(data.detalhes || {}).join(' ') || data.message || data.erro || message;
      } catch { /* A resposta pode não conter JSON. */ }
      throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const [people, meetings] = await Promise.all([call('/membros'), call('/eventos')]);
      setMembros(people);
      setEventos(meetings);
      setEventoSelecionado(current => current || (meetings[0] ? String(meetings[0].id) : ''));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }, [call, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const atualizarRelogio = () => setAgora(new Date());
    const timer = window.setInterval(atualizarRelogio, 30_000);
    window.addEventListener('focus', atualizarRelogio);
    document.addEventListener('visibilitychange', atualizarRelogio);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', atualizarRelogio);
      document.removeEventListener('visibilitychange', atualizarRelogio);
    };
  }, []);
  const loadCoordenadores = useCallback(async () => {
    if (!token || papel !== 'MASTER' || page !== 'coordenadores') return;
    try { setCoordenadores(await call('/coordenadores')); }
    catch (requestError) { setError(requestError.message); }
  }, [call, page, papel, token]);
  useEffect(() => { loadCoordenadores(); }, [loadCoordenadores]);
  useEffect(() => {
    if (!eventoSelecionado || !token) { setPresentes([]); setAttendanceBusy(false); return undefined; }
    let current = true;
    setPresentes([]);
    setAttendanceBusy(true);
    call(`/eventos/${eventoSelecionado}/presencas`)
      .then(records => { if (current) setPresentes(records); })
      .catch(requestError => { if (current) setError(requestError.message); })
      .finally(() => { if (current) setAttendanceBusy(false); });
    return () => { current = false; };
  }, [call, eventoSelecionado, token]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.title = token ? `${PAGE_INFO[page].label} — JSLG` : 'Coordenação — JSLG';
  }, [page, token]);

  const filteredMembros = useMemo(() => membros.filter(member =>
    `${member.nome} ${member.instagram || ''} ${member.telefone || ''}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))
  ), [membros, busca]);
  const upcoming = useMemo(() => eventos
    .filter(event => !event.cancelado && toDate(event.dataHora) >= agora)
    .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora)), [agora, eventos]);
  const selectedEvent = eventos.find(event => String(event.id) === eventoSelecionado);

  const login = async form => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error(response.status === 401 ? 'Usuário ou senha incorretos.' : 'Não foi possível entrar. Tente novamente.');
      const data = await response.json();
      localStorage.setItem('jslg-token', data.token);
      localStorage.setItem('jslg-usuario', data.usuario);
      localStorage.setItem('jslg-papel', data.papel || 'COORDENADOR');
      setToken(data.token);
      setUsuario(data.usuario);
      setPapel(data.papel || 'COORDENADOR');
      setPage('resumo');
      setToast('Acesso liberado. Bem-vindo ao JSLG.');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const logout = () => {
    localStorage.removeItem('jslg-token');
    localStorage.removeItem('jslg-usuario');
    localStorage.removeItem('jslg-papel');
    setToken(''); setUsuario(''); setPapel('COORDENADOR'); setCoordenadores([]); setMembros([]); setEventos([]); setPresentes([]); setError('');
  };
  const submit = async (path, method, data, success) => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await call(path, { method, body: JSON.stringify(data) });
      if (path.startsWith('/eventos')) {
        setPosterRevision(revision => revision + 1);
        setAgora(new Date());
      }
      setModal(null); setToast(success); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const cancelEvent = async id => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await call(`/eventos/${id}/cancelamento`, { method: 'PATCH' });
      setModal(null); setToast('Encontro cancelado. O registro permanece na agenda.'); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const deleteEvent = async id => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await call(`/eventos/${id}`, { method: 'DELETE' });
      setEventoSelecionado(current => current === String(id) ? '' : current);
      setModal(null);
      setToast('Encontro removido, incluindo presenças e arte.');
      setAgora(new Date());
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const deleteMember = async id => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await call(`/membros/${id}`, { method: 'DELETE' });
      setModal(null); setToast('Pessoa removida da lista.'); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const updateCoordinator = async (id, data) => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await call(`/coordenadores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setCoordenadores(await call('/coordenadores'));
      setModal(null); setToast('Acesso do coordenador atualizado.');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const deleteCoordinator = async () => {
    if (saving) return;
    setSaving(true); setError('');
    try {
      await call(`/coordenadores/${modal.item.id}`, { method: 'DELETE' });
      setCoordenadores(await call('/coordenadores'));
      setModal(null); setToast(`Acesso de ${modal.item.usuario} removido.`);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const addPresence = async memberId => {
    if (!memberId || saving || !eventoSelecionado) return;
    setSaving(true); setError('');
    try {
      await call(`/eventos/${eventoSelecionado}/presencas`, { method: 'POST', body: JSON.stringify({ membroId: Number(memberId) }) });
      setPresentes(await call(`/eventos/${eventoSelecionado}/presencas`));
      setToast('Presença registrada.');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const removePresence = async memberId => {
    if (saving || !eventoSelecionado) return;
    setSaving(true); setError('');
    try {
      await call(`/eventos/${eventoSelecionado}/presencas/${memberId}`, { method: 'DELETE' });
      setPresentes(await call(`/eventos/${eventoSelecionado}/presencas`));
      setToast('Presença removida.');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const openHistory = async member => {
    setError(''); setModal({ type: 'history', item: member, loading: true, records: [] });
    try {
      const records = await call(`/membros/${member.id}/presencas`);
      setModal(current => current?.type === 'history' && current.item.id === member.id ? { ...current, loading: false, records } : current);
    } catch (requestError) {
      setModal(current => current?.type === 'history' && current.item.id === member.id ? { ...current, loading: false, error: requestError.message } : current);
    }
  };
  const nav = [
    { id: 'resumo', label: 'Visão geral', icon: Compass },
    { id: 'membros', label: 'Membros', icon: Users },
    { id: 'eventos', label: 'Encontros', icon: CalendarDays },
    ...(papel === 'MASTER' ? [{ id: 'coordenadores', label: 'Coordenação', icon: UserRoundPlus }] : []),
    { id: 'presencas', label: 'Presenças', icon: Check }
  ];

  if (!token) return <Login onLogin={login} error={error} saving={saving} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('resumo')} aria-label="Ir para a visão geral">
        <img className="brand-logo" src="/logo-jslg.png" alt="" />
        <span className="brand-lockup"><b>JSLG</b><small>Jovens de São Luís<br/>Gonzaga</small></span>
      </button>
      <div className="community-mark"><span className="mark-line"/><span>CAMINHO · COMUNIDADE · MISSÃO</span></div>
      <nav className="primary-nav" aria-label="Navegação principal">
        {nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setError(''); }} aria-current={page === item.id ? 'page' : undefined}>
          <item.icon size={18} strokeWidth={1.8}/><span>{item.label}</span><ArrowRight className="nav-arrow" size={15}/>
        </button>)}
      </nav>
      <div className="sidebar-note"><span>“</span><p>O Deus que me chama<br/>é amor.</p></div>
      <div className="sidebar-bottom">
        <div className="user-card"><span className="avatar"><CircleUserRound size={20}/></span><span className="user-info"><b>{usuario}</b><small>{papel === 'MASTER' ? 'Coordenador master' : 'Coordenador'}</small></span><button aria-label="Sair da conta" title="Sair" className="icon-button" onClick={logout}><LogOut size={17}/></button></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="mobile-brand"><img src="/logo-jslg.png" alt=""/><span>JSLG</span></div>
        <p className="topbar-date">{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</p>
        <div className="topbar-actions"><button className="refresh-button" onClick={load} disabled={busy} aria-label="Atualizar informações" title="Atualizar"><Activity size={17}/></button><button className="mobile-logout" onClick={logout} aria-label="Sair"><LogOut size={17}/></button></div>
      </header>
      <main className="content">
        <div className="page-heading"><h1>{PAGE_INFO[page].title}</h1><span className="heading-rule"/></div>
        {error && !modal && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="Fechar aviso"><X size={17}/></button></div>}
        {page === 'resumo' && <Dashboard
          usuario={usuario} membros={membros} upcoming={upcoming} eventos={eventos} presentes={presentes}
          onNewEvent={() => { setError(''); setModal({ type: 'event', item: null }); }}
          onNewMember={() => { setError(''); setModal({ type: 'member', item: null }); }}
          onAttendance={id => { setEventoSelecionado(String(id)); setPage('presencas'); }}
          onPage={setPage}
        />}
        {page === 'membros' && <MembersPage members={filteredMembros} total={membros.length} query={busca} onQuery={setBusca} searchRef={searchRef} onNew={() => { setError(''); setModal({ type: 'member', item: null }); }} onHistory={openHistory} onEdit={item => setModal({ type: 'member', item })} onDelete={item => setModal({ type: 'delete-member', item })}/>}
        {page === 'eventos' && <EventsPage events={eventos} upcoming={upcoming} agora={agora} token={token} posterRevision={posterRevision} onNew={() => { setError(''); setModal({ type: 'event', item: null }); }} onEdit={item => setModal({ type: 'event', item })} onCancel={item => setModal({ type: 'cancel-event', item })} onDelete={item => setModal({ type: 'delete-event', item })} onAttendance={id => { setEventoSelecionado(String(id)); setPage('presencas'); }}/>}
        {page === 'presencas' && <AttendancePage
          events={eventos} members={membros} selected={eventoSelecionado} onSelect={setEventoSelecionado}
          selectedEvent={selectedEvent} records={presentes} busy={attendanceBusy} saving={saving} onAdd={addPresence} onRemove={removePresence}
        />}
        {page === 'coordenadores' && papel === 'MASTER' && <CoordinatorsPage coordenadores={coordenadores} saving={saving} onCreate={async dados => {
          setSaving(true); setError('');
          try {
            await call('/coordenadores', { method: 'POST', body: JSON.stringify(dados) });
            setCoordenadores(await call('/coordenadores'));
            setToast(`Acesso de ${dados.usuario.trim()} criado como coordenador.`);
            return true;
          } catch (requestError) { setError(requestError.message); return false; }
          finally { setSaving(false); }
        }} onEdit={item => { setError(''); setModal({ type: 'edit-coordinator', item }); }} onDelete={item => { setError(''); setModal({ type: 'delete-coordinator', item }); }} />}
        {busy && <div className="sync-status" role="status"><span className="spinner"/> Atualizando os registros…</div>}
      </main>
      <footer className="workspace-footer"><span>Jovens de São Luís Gonzaga</span><span>Servir também é caminhar junto.</span></footer>
    </div>
    {modal && <ModalLayer modal={modal} error={error} onClose={() => { setModal(null); setError(''); }} saving={saving} onSave={(data) => modal.type === 'member'
      ? submit(modal.item ? `/membros/${modal.item.id}` : '/membros', modal.item ? 'PUT' : 'POST', data, modal.item ? 'Cadastro atualizado.' : 'Pessoa adicionada à comunidade.')
      : submit(modal.item ? `/eventos/${modal.item.id}` : '/eventos', modal.item ? 'PUT' : 'POST', data, modal.item ? 'Encontro atualizado.' : 'Encontro adicionado à agenda.')}
      onDelete={() => deleteMember(modal.item.id)} onDeleteEvent={() => deleteEvent(modal.item.id)} onCancelEvent={() => cancelEvent(modal.item.id)} onSaveCoordinator={updateCoordinator} onDeleteCoordinator={deleteCoordinator}/>}
    {toast && <div className="toast" role="status" aria-live="polite"><Check size={17}/><span>{toast}</span><button onClick={() => setToast('')} aria-label="Fechar"><X size={16}/></button></div>}
    <nav className={`mobile-nav ${papel === 'MASTER' ? 'has-master' : ''}`} aria-label="Navegação principal">
      {nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setError(''); }} aria-current={page === item.id ? 'page' : undefined}><item.icon size={19}/><span>{item.label}</span></button>)}
    </nav>
  </div>;
}

function CoordinatorsPage({ coordenadores, saving, onCreate, onEdit, onDelete }) {
  const [usuarioNovo, setUsuarioNovo] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (await onCreate({ usuario: usuarioNovo.trim(), senha: senhaNova })) {
      setUsuarioNovo('');
      setSenhaNova('');
    }
  };
  return <section className="coordinator-page">
    <div className="page-lead"><div><p>Uma equipe que caminha junto.</p><span>Cadastre pessoas de confiança para ajudar a cuidar da comunidade.</span></div></div>
    <div className="coordinator-layout">
      <form className="coordinator-form" onSubmit={submit}>
        <span className="modal-kicker">NOVO ACESSO</span>
        <h2>Adicionar coordenador</h2>
        <p>Essa pessoa poderá organizar membros, encontros e presenças.</p>
        <label className="field"><span>Nome de usuário</span><input value={usuarioNovo} onChange={event => setUsuarioNovo(event.target.value)} maxLength="80" autoComplete="username" required/></label>
        <label className="field"><span>Senha inicial</span><input type="password" value={senhaNova} onChange={event => setSenhaNova(event.target.value)} minLength="12" maxLength="72" autoComplete="new-password" required/><small className="field-hint">Use pelo menos 12 caracteres. Compartilhe a senha inicial diretamente com a pessoa.</small></label>
        <button className="button button-primary" disabled={saving} aria-busy={saving}><UserRoundPlus size={17}/>{saving ? 'Criando acesso…' : 'Criar acesso'}</button>
      </form>
      <section className="coordinator-roster" aria-labelledby="coordinator-list-title">
        <div className="section-title"><div><h2 id="coordinator-list-title">Acessos da coordenação</h2><p>{coordenadores.length} conta{coordenadores.length === 1 ? '' : 's'} cadastrada{coordenadores.length === 1 ? '' : 's'}</p></div></div>
        {coordenadores.length ? <ul className="coordinator-list">{coordenadores.map(item => <li key={item.id}>
          <span className="coordinator-avatar"><CircleUserRound size={18}/></span>
          <span className="coordinator-account"><b>{item.usuario}</b><small>{item.papel === 'MASTER' ? 'Coordenador master' : 'Coordenador'}</small></span>
          <span className={`coordinator-status ${item.ativo ? '' : 'is-inactive'}`}>{item.ativo ? 'Ativo' : 'Inativo'}</span>
          {item.papel === 'COORDENADOR' && <span className="coordinator-actions"><button className="text-action" onClick={() => onEdit(item)}>Editar acesso</button><button className="text-action danger" onClick={() => onDelete(item)}>Excluir</button></span>}
        </li>)}</ul> : <div className="empty-state"><div><h3>Nenhum acesso cadastrado</h3><p>Adicione um coordenador para dividir as tarefas do grupo.</p></div></div>}
        <p className="coordinator-note">A senha não aparece nesta lista. Você pode alterar os dados de acesso dos coordenadores; a conta master é protegida.</p>
      </section>
    </div>
  </section>;
}

function Dashboard({ usuario, membros, upcoming, eventos, presentes, onNewEvent, onNewMember, onAttendance, onPage }) {
  const next = upcoming[0];
  const nextStamp = next ? formatStamp(next.dataHora) : null;
  const today = formatDate(new Date(), { day: 'numeric', month: 'long' });
  return <section className="dashboard-page" aria-label="Resumo da comunidade">
    <div className="dashboard-intro"><p>Que bom ter você por aqui, {usuario}.</p><span>{today}</span></div>
    {next ? <section className="next-gathering" aria-labelledby="next-title">
      <div className="next-date"><span>{nextStamp.weekday}</span><b>{nextStamp.day}</b><strong>{nextStamp.month}</strong></div>
      <div className="next-detail"><span className="section-overline">NOSSO PRÓXIMO ENCONTRO</span><h2 id="next-title">{next.titulo}</h2><div className="next-meta"><span><Clock3 size={16}/>{formatTime(next.dataHora)}</span><span><MapPin size={16}/>{next.local}</span></div></div>
      <button className="next-action" onClick={() => onAttendance(next.id)}><span>Fazer chamada</span><ArrowDownRight size={21}/></button>
    </section> : <section className="next-gathering next-empty"><div className="next-date empty-date"><CalendarDays size={26}/></div><div className="next-detail"><span className="section-overline">AGENDA DA COMUNIDADE</span><h2>Nenhum encontro marcado.</h2><p>Quando a próxima data estiver definida, ela aparece por aqui.</p></div><button className="next-action" onClick={onNewEvent}><span>Marcar encontro</span><Plus size={20}/></button></section>}

    <div className="dashboard-columns">
      <section className="journey-section" aria-labelledby="journey-title">
        <div className="section-title"><div><h2 id="journey-title">O caminho à frente</h2><p>Encontros já combinados</p></div><button className="text-link" onClick={() => onPage('eventos')}>Ver agenda <ArrowRight size={15}/></button></div>
        {upcoming.length > 1 ? <ol className="journey-list">{upcoming.slice(1, 5).map(event => <JourneyStop key={event.id} event={event} onOpen={() => onAttendance(event.id)}/>)}</ol> : <div className="journey-empty"><span className="journey-node"/><p>{upcoming.length ? 'Este é o único encontro futuro marcado.' : 'Sua agenda está aberta para novos encontros.'}</p><button className="text-link" onClick={onNewEvent}>Adicionar uma data <ArrowRight size={15}/></button></div>}
      </section>
      <aside className="community-brief" aria-label="Retrato da comunidade">
        <div className="brief-heading"><span className="brief-emblem"><Users size={18}/></span><span>COMUNIDADE</span></div>
        <div className="brief-count"><b>{membros.length.toString().padStart(2, '0')}</b><span>pessoas<br/>cadastradas</span></div>
        <div className="brief-divider"/>
        <div className="brief-foot"><span>{eventos.length} {eventos.length === 1 ? 'encontro na agenda' : 'encontros na agenda'}</span><button onClick={() => onPage('membros')}>Ver membros <ArrowRight size={15}/></button></div>
      </aside>
    </div>

    <section className="dashboard-actions" aria-label="Ações da coordenação">
      <span>UM GESTO DE CADA VEZ</span>
      <button onClick={onNewMember}><Plus size={17}/><b>Acolher alguém</b><small>Adicionar à comunidade</small><ArrowRight className="action-arrow" size={17}/></button>
      <button onClick={() => onPage('presencas')}><Check size={17}/><b>Registrar presença</b><small>Marcar quem esteve com a gente</small><ArrowRight className="action-arrow" size={17}/></button>
    </section>
  </section>;
}

function JourneyStop({ event, onOpen }) {
  const stamp = formatStamp(event.dataHora);
  return <li className="journey-stop"><span className="journey-node"/><div className="journey-date"><b>{stamp.day}</b><span>{stamp.month}</span></div><div className="journey-copy"><h3>{event.titulo}</h3><p>{stamp.weekday} · {formatTime(event.dataHora)} · {event.local}</p></div><button onClick={onOpen} aria-label={`Fazer chamada de ${event.titulo}`}><ArrowRight size={17}/></button></li>;
}

function MembersPage({ members, total, query, onQuery, searchRef, onNew, onHistory, onEdit, onDelete }) {
  return <section className="records-page">
    <div className="page-lead"><div><p>Gente que faz o caminho.</p><span>{total} {total === 1 ? 'pessoa na comunidade' : 'pessoas na comunidade'}</span></div><button className="button button-primary" onClick={onNew}><Plus size={17}/> Adicionar pessoa</button></div>
    <div className="list-toolbar"><label className="search-box"><Search size={17}/><span className="sr-only">Buscar pessoas</span><input ref={searchRef} value={query} onChange={event => onQuery(event.target.value)} placeholder="Buscar por nome, Instagram ou telefone"/></label><span className="result-count">{members.length} encontrados</span></div>
    {members.length ? <div className="table-scroll"><table className="member-table"><caption className="sr-only">Lista de pessoas da comunidade</caption><thead><tr><th scope="col">PESSOA</th><th scope="col">TELEFONE</th><th scope="col">INSTAGRAM</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>{members.map(member => <tr key={member.id}>
      <td><div className="person-cell"><span className="person-avatar">{member.nome.slice(0, 1).toLocaleUpperCase('pt-BR')}</span><span className="person-details"><b>{member.nome}</b><small>Jovem da comunidade</small></span></div></td>
      <td>{member.telefone ? <>{member.telefone}{!isCompleteBrazilianPhone(member.telefone) && <small className="phone-incomplete">Número incompleto</small>}</> : <span className="value-muted">Não informado</span>}</td><td>{member.instagram ? <a className="instagram-link" href={`https://www.instagram.com/${member.instagram}/`} target="_blank" rel="noreferrer">@{member.instagram}</a> : <span className="value-muted">Não informado</span>}</td>
      <td><div className="row-actions"><button className="text-action" onClick={() => onHistory(member)}>Histórico</button><button className="text-action" onClick={() => onEdit(member)}>Editar</button><button className="text-action danger" onClick={() => onDelete(member)}>Remover</button></div></td>
    </tr>)}</tbody></table></div> : <EmptyState icon={Users} title={query ? 'Ninguém com esse nome por aqui.' : 'A comunidade começa com um primeiro encontro.'} text={query ? 'Tente outro nome, telefone ou Instagram.' : 'Adicione pessoas para manter os contatos e as presenças no mesmo lugar.'} action={!query ? 'Adicionar primeira pessoa' : null} onAction={onNew}/>}
  </section>;
}

function EventsPage({ events, upcoming, agora, token, posterRevision, onNew, onEdit, onCancel, onDelete, onAttendance }) {
  const realizados = events.filter(event => !event.cancelado && toDate(event.dataHora) < agora)
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  const cancelados = events.filter(event => event.cancelado)
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
  return <section className="records-page event-page">
    <div className="page-lead"><div><p>Um tempo para estar juntos.</p><span>{upcoming.length} próximos · {realizados.length} realizados</span></div><button className="button button-primary" onClick={onNew}><Plus size={17}/> Marcar encontro</button></div>
    <section className="agenda-block"><h2 className="list-heading">À frente <span>{upcoming.length.toString().padStart(2, '0')}</span></h2>
      {upcoming.length ? <ol className="event-card-grid">{upcoming.map(event => <EventCard key={event.id} event={event} token={token} posterRevision={posterRevision} status="upcoming" onEdit={onEdit} onCancel={onCancel} onAttendance={onAttendance}/>)}</ol> : <EmptyState icon={CalendarDays} title="Ainda sem datas combinadas." text="Quando definirem o próximo encontro, registrem a data aqui." action="Marcar o primeiro encontro" onAction={onNew}/>}
    </section>
    <section className="agenda-block archive-block"><h2 className="list-heading">Encontros realizados <span>{realizados.length.toString().padStart(2, '0')}</span></h2>
      {realizados.length ? <ol className="event-card-grid">{realizados.map(event => <EventCard key={event.id} event={event} token={token} posterRevision={posterRevision} status="completed" onEdit={onEdit} onDelete={onDelete} onAttendance={onAttendance}/>)}</ol> : <EmptyState icon={Check} title="Os encontros realizados aparecerão aqui." text="Quando a data e o horário passarem, o encontro será movido automaticamente para esta seção."/>}
    </section>
    {cancelados.length > 0 && <section className="agenda-block archive-block"><h2 className="list-heading">Encontros cancelados <span>{cancelados.length.toString().padStart(2, '0')}</span></h2><ol className="event-card-grid">{cancelados.map(event => <EventCard key={event.id} event={event} token={token} posterRevision={posterRevision} status="cancelled" onAttendance={onAttendance}/>)}</ol></section>}
  </section>;
}

function EventCard({ event, token, posterRevision, status, onEdit, onCancel, onDelete, onAttendance }) {
  const statusLabel = { upcoming: 'Agendado', completed: 'Realizado', cancelled: 'Cancelado' }[status];
  return <li className={`event-card ${status === 'cancelled' ? 'is-cancelled' : ''}`}>
    <EventArtwork event={event} token={token} posterRevision={posterRevision}/>
    <article className="event-card-body">
      <div className="event-card-status"><span className={`status-tag ${status === 'completed' ? 'is-complete' : ''}`}>{statusLabel}</span></div>
      <h3>{event.titulo}</h3>
      <p className="event-card-description">{event.descricao || 'Sem descrição informada.'}</p>
      <ul className="event-card-meta" aria-label="Detalhes do encontro">
        <li><CalendarDays size={15}/><span>{formatDate(event.dataHora, { day: 'numeric', month: 'long', year: 'numeric' })}</span></li>
        <li><Clock3 size={15}/><span>{formatTime(event.dataHora)}</span></li>
        <li><MapPin size={15}/><span>{event.local}</span></li>
      </ul>
      {!event.cancelado && <div className="event-card-actions">
        <button className="button button-outline event-card-primary" aria-label={`${status === 'completed' ? 'Ver presenças de' : 'Fazer chamada de'} ${event.titulo}`} onClick={() => onAttendance(event.id)}>{status === 'completed' ? 'Ver presenças' : 'Fazer chamada'}</button>
        {status === 'upcoming' && <div className="event-card-secondary"><button className="text-action" aria-label={`Editar ${event.titulo}`} onClick={() => onEdit(event)}>Editar</button><button className="text-action danger" aria-label={`Cancelar ${event.titulo}`} onClick={() => onCancel(event)}>Cancelar</button></div>}
        {status === 'completed' && <div className="event-card-secondary"><button className="text-action" aria-label={`Editar ${event.titulo}`} onClick={() => onEdit(event)}>Editar</button><button className="text-action danger" aria-label={`Excluir ${event.titulo}`} onClick={() => onDelete(event)}>Excluir</button></div>}
      </div>}
    </article>
  </li>;
}

function EventArtwork({ event, token, posterRevision }) {
  const containerRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [src, setSrc] = useState('');
  const [falha, setFalha] = useState(false);
  useEffect(() => {
    setShouldLoad(false);
    if (!event.temArte) return undefined;
    const element = containerRef.current;
    if (!element || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setShouldLoad(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [event.id, event.temArte]);
  useEffect(() => {
    setSrc('');
    setFalha(false);
    if (!event.temArte || !shouldLoad) return undefined;
    let ativo = true;
    let url;
    fetch(`${API}/eventos/${event.id}/arte`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => { if (!response.ok) throw new Error('Arte indisponível.'); return response.blob(); })
      .then(blob => { if (ativo) { url = URL.createObjectURL(blob); setSrc(url); } })
      .catch(() => { if (ativo) setFalha(true); });
    return () => { ativo = false; if (url) URL.revokeObjectURL(url); };
  }, [event.id, event.temArte, posterRevision, shouldLoad, token]);
  const placeholder = !event.temArte ? 'Sem arte cadastrada' : falha ? 'Arte indisponível' : 'Carregando arte';
  return <div className="event-artwork" ref={containerRef}>{src ? <img src={src} alt={`Arte do encontro ${event.titulo}`} loading="lazy"/> : <span className="event-artwork-empty"><ImageIcon size={20}/><small>{placeholder}</small></span>}</div>;
}

function AttendancePage({ events, members, selected, onSelect, selectedEvent, records, busy, saving, onAdd, onRemove }) {
  const available = members.filter(member => !records.some(record => record.membroId === member.id));
  const canceled = selectedEvent?.cancelado;
  return <section className="records-page attendance-page">
    <div className="page-lead"><div><p>A presença também conta uma história.</p><span>Escolha um encontro para conferir quem participou.</span></div></div>
    <div className="attendance-picker">
      <label className="field"><span>Encontro</span><span className="select-wrap"><select value={selected} onChange={event => onSelect(event.target.value)}><option value="">Selecione uma data</option>{[...events].sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora)).map(event => <option key={event.id} value={event.id}>{event.titulo} · {dateValue(event.dataHora)}{event.cancelado ? ' · cancelado' : ''}</option>)}</select><ChevronDown size={17}/></span></label>
      <label className="field"><span>Adicionar presença</span><span className="select-wrap"><select value="" disabled={!selectedEvent || canceled || !available.length || saving} onChange={event => onAdd(event.target.value)}><option value="">{!selectedEvent ? 'Escolha um encontro primeiro' : canceled ? 'Encontro cancelado' : !available.length ? 'Todas as pessoas já estão na lista' : 'Selecione uma pessoa'}</option>{available.map(member => <option key={member.id} value={member.id}>{member.nome}</option>)}</select><ChevronDown size={17}/></span></label>
    </div>
    {selectedEvent ? <section className="attendance-register" aria-live="polite">
      <div className="register-heading"><div><span className="section-overline">{formatDate(selectedEvent.dataHora, { day: 'numeric', month: 'long', year: 'numeric' })}</span><h2>{selectedEvent.titulo}</h2><p><Clock3 size={15}/>{formatTime(selectedEvent.dataHora)}<span>·</span><MapPin size={15}/>{selectedEvent.local}</p></div><div className="attendance-total"><b>{records.length.toString().padStart(2, '0')}</b><span>{records.length === 1 ? 'presença' : 'presenças'}</span></div></div>
      {busy ? <div className="modal-loading"><span className="spinner"/> Carregando a chamada…</div> : records.length ? <ul className="attendance-list">{records.map((record, index) => <li className="attendance-person" key={record.id}><span className="attendance-sequence">{(index + 1).toString().padStart(2, '0')}</span><span className="person-avatar">{record.membroNome.slice(0, 1).toLocaleUpperCase('pt-BR')}</span><span className="attendance-person-info"><b>{record.membroNome}</b><small>Registrada às {formatTime(record.dataRegistro)}</small></span><button className="text-action danger" onClick={() => onRemove(record.membroId)} disabled={saving}>Remover</button></li>)}</ul> : <EmptyState icon={Check} title="A chamada ainda está vazia." text={canceled ? 'Este encontro foi cancelado e não aceita novos registros.' : 'Use o campo acima para registrar quem veio.'}/>}
    </section> : <EmptyState icon={CalendarDays} title="Escolha um encontro." text="A lista de presenças aparece aqui, junto com o horário e local da reunião."/>}
  </section>;
}

function Login({ onLogin, error, saving }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  return <main className="login-page">
    <section className="login-panel">
      <div className="login-brand"><img src="/logo-jslg.png" alt=""/><span><b>JSLG</b><small>Jovens de São Luís Gonzaga</small></span></div>
      <div className="login-thesis"><span className="route-symbol"><i/><i/><i/></span><p>O Deus que me<br/>chama &#233; amor.</p></div>
      <div className="login-footer"><span>São Luís Gonzaga</span><span>CAMINHO · COMUNIDADE · MISSÃO</span></div>
      <div className="login-contour" aria-hidden="true"/>
    </section>
    <section className="login-form-wrap">
      <form className="login-form" onSubmit={event => { event.preventDefault(); onLogin({ usuario, senha }); }}>
        <h1>Entre para<br/>seguir cuidando.</h1><p>Acesse a agenda, os membros e os encontros da comunidade.</p>
        {error && <div className="login-error" role="alert"><span>{error}</span></div>}
        <label className="field"><span>Usuário</span><input autoComplete="username" value={usuario} onChange={event => setUsuario(event.target.value)} placeholder="Seu usuário" required/></label>
        <label className="field"><span>Senha</span><input type="password" autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} placeholder="Sua senha" required/></label>
        <button className="button button-primary login-submit" disabled={saving} aria-busy={saving}>{saving ? <><span className="spinner light-spinner"/> Entrando…</> : <>Entrar na coordenação <ArrowRight size={17}/></>}</button>
      </form>
    </section>
  </main>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return <div className="empty-state"><span className="empty-mark"><Icon size={19}/></span><div><h3>{title}</h3><p>{text}</p>{action && <button className="text-link" onClick={onAction}>{action} <ArrowRight size={15}/></button>}</div></div>;
}

function ModalLayer({ modal, error, onClose, saving, onSave, onDelete, onDeleteEvent, onCancelEvent, onSaveCoordinator, onDeleteCoordinator }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    panelRef.current?.querySelector('input, button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        if (document.querySelector('.calendar-popover:popover-open')) return;
        closeRef.current();
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = [...panelRef.current.querySelectorAll('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled), select:not(:disabled), a[href]')].filter(element => element.getClientRects().length > 0);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus?.(); };
  }, []);

  const memberForm = modal.type === 'member';
  const eventForm = modal.type === 'event';
  const coordinatorForm = modal.type === 'edit-coordinator';
  const deleteCoordinator = modal.type === 'delete-coordinator';
  const deleteEventConfirmation = modal.type === 'delete-event';
  const item = modal.item || {};
  const title = memberForm ? item.id ? 'Atualizar cadastro' : 'Acolher alguém' : item.id ? 'Atualizar encontro' : 'Marcar encontro';
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    {coordinatorForm ? <CoordinatorEditor key={item.id} item={item} error={error} onClose={onClose} onSave={onSaveCoordinator} saving={saving} panelRef={panelRef}/> : memberForm || eventForm ? <Editor key={`${modal.type}-${item.id || 'new'}`} ref={panelRef} modal={modal} title={title} onClose={onClose} onSave={onSave} saving={saving} error={error}/> : <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={panelRef} tabIndex="-1">
      {modal.type !== 'history' && <button className="modal-close" onClick={onClose} aria-label="Fechar"><X size={19}/></button>}
      {modal.type === 'history' ? <HistoryContent modal={modal} onClose={onClose}/> : deleteCoordinator ? <>
        <span className="confirm-mark"><CircleUserRound size={20}/></span>
        <h2 id="modal-title">Excluir acesso de {item.usuario}?</h2>
        <p>Esta pessoa perderá o acesso à coordenação imediatamente. A conta não poderá ser recuperada.</p>
        {error && <div className="error-banner modal-error" role="alert">{error}</div>}
        <div className="modal-actions"><button className="button button-outline" onClick={onClose}>Manter conta</button><button className="button button-danger" onClick={onDeleteCoordinator} disabled={saving} aria-busy={saving}>{saving ? 'Excluindo…' : 'Excluir coordenador'}</button></div>
      </> : deleteEventConfirmation ? <>
        <span className="confirm-mark"><CalendarDays size={20}/></span>
        <h2 id="modal-title">Excluir encontro {item.titulo}?</h2>
        <p>O encontro, as presenças registradas e a arte serão excluídos permanentemente. Esta ação não pode ser desfeita.</p>
        {error && <div className="error-banner modal-error" role="alert">{error}</div>}
        <div className="modal-actions"><button className="button button-outline" onClick={onClose}>Manter encontro</button><button className="button button-danger" onClick={onDeleteEvent} disabled={saving} aria-busy={saving}>{saving ? 'Excluindo...' : 'Excluir encontro'}</button></div>
      </> : <>
        <span className="confirm-mark">{modal.type === 'delete-member' ? <Users size={20}/> : <CalendarDays size={20}/>}</span>
        <h2 id="modal-title">{modal.type === 'delete-member' ? `Remover ${item.nome}?` : `Cancelar “${item.titulo}”?`}</h2>
        <p>{modal.type === 'delete-member' ? 'A remoção é definitiva. Se houver presenças vinculadas, o sistema poderá impedir a exclusão para preservar o histórico.' : 'O encontro continuará no histórico, mas não aceitará novos registros de presença.'}</p>
        <div className="modal-actions"><button className="button button-outline" onClick={onClose}>Manter</button><button className="button button-danger" onClick={modal.type === 'delete-member' ? onDelete : onCancelEvent} disabled={saving} aria-busy={saving}>{saving ? 'Salvando…' : modal.type === 'delete-member' ? 'Remover pessoa' : 'Cancelar encontro'}</button></div>
      </>}
    </div>}
  </div>;
}

function CoordinatorEditor({ item, error, onClose, onSave, saving, panelRef }) {
  const [usuario, setUsuario] = useState(item.usuario || '');
  const [senha, setSenha] = useState('');
  const submit = event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    onSave(item.id, { usuario: usuario.trim(), senha: senha || null });
  };
  return <form className="modal editor-modal" onSubmit={submit} ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-header"><div><span className="modal-kicker">ACESSO DA COORDENAÇÃO</span><h2 id="modal-title">Editar coordenador</h2><p>Atualize o nome de usuário ou defina uma nova senha.</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>
    {error && <div className="error-banner modal-error" role="alert">{error}</div>}
    <label className="field"><span>Nome de usuário</span><input value={usuario} onChange={event => setUsuario(event.target.value)} maxLength="80" autoComplete="username" required/></label>
    <label className="field"><span>Nova senha <small>opcional</small></span><input type="password" value={senha} onChange={event => setSenha(event.target.value)} minLength="12" maxLength="72" autoComplete="new-password"/><small className="field-hint">Deixe em branco para manter a senha atual. Ao trocar a senha, a sessão aberta será encerrada.</small></label>
    <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Voltar</button><button className="button button-primary" disabled={saving} aria-busy={saving}>{saving ? <><span className="spinner light-spinner"/> Salvando…</> : <><Check size={17}/> Salvar acesso</>}</button></div>
  </form>;
}

const Editor = React.forwardRef(function Editor({ modal, title, onClose, onSave, saving, error }, ref) {
  const member = modal.type === 'member';
  const item = modal.item || {};
  const initialDateTime = toLocalInput(item.dataHora);
  const [form, setForm] = useState(member
    ? { nome: item.nome || '', instagram: item.instagram || '', telefone: item.id ? item.telefone || '' : maskBrazilianPhone(item.telefone || '') }
    : { titulo: item.titulo || '', data: initialDateTime.slice(0, 10), hora: initialDateTime.slice(11, 16), local: item.local || '', descricao: item.descricao || '' });
  const [dateError, setDateError] = useState('');
  const [instagramError, setInstagramError] = useState('');
  const [telefoneError, setTelefoneError] = useState('');
  const [arte, setArte] = useState('');
  const [arteError, setArteError] = useState('');
  const [lendoArte, setLendoArte] = useState(false);
  const arquivoArteRef = useRef(null);
  const dateButtonRef = useRef(null);
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const escolherArte = event => {
    const arquivo = event.target.files?.[0];
    setArteError('');
    setLendoArte(false);
    if (!arquivo) { setArte(''); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      setArteError('Escolha uma imagem PNG, JPEG ou WebP.'); event.target.value = ''; return;
    }
    if (arquivo.size > 1_048_576) {
      setArteError('A imagem deve ter no máximo 1 MB.'); event.target.value = ''; return;
    }
    const leitor = new FileReader();
    setLendoArte(true);
    leitor.onload = () => { setArte(String(leitor.result)); setLendoArte(false); };
    leitor.onerror = () => { setArteError('Não foi possível ler esta imagem. Tente outro arquivo.'); setLendoArte(false); };
    leitor.readAsDataURL(arquivo);
  };
  const submitForm = event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (member) {
      if (hasUnsupportedPhoneCountryCode(form.telefone)) {
        setTelefoneError('Use o codigo internacional brasileiro +55 ou informe o telefone sem codigo de pais.');
        requestAnimationFrame(() => document.getElementById('member-phone')?.focus());
        return;
      }
      const telefoneDigits = brazilianPhoneDigits(form.telefone);
      if (telefoneDigits && ![10, 11].includes(telefoneDigits.length)) {
        setTelefoneError('Informe DDD e número completo: 10 dígitos para telefone fixo ou 11 para celular.');
        requestAnimationFrame(() => document.getElementById('member-phone')?.focus());
        return;
      }
      setTelefoneError('');
      const instagram = form.instagram.trim();
      if (instagram && !/^@?[A-Za-z0-9._]{1,30}$/.test(instagram)) {
        setInstagramError('O Instagram não aceita acentos. Use letras sem acento, números, ponto ou sublinhado (por exemplo, @joaoteste).');
        requestAnimationFrame(() => document.getElementById('member-instagram')?.focus());
        return;
      }
      setInstagramError('');
    }
    if (lendoArte) return;
    if (!member && arteError) { arquivoArteRef.current?.focus(); return; }
    if (!member && !form.data) {
      setDateError('Escolha uma data para o encontro.');
      dateButtonRef.current?.focus();
      return;
    }
    onSave(member
      ? { nome: form.nome.trim(), instagram: form.instagram.trim(), telefone: form.telefone.trim() }
      : { titulo: form.titulo, dataHora: `${form.data}T${form.hora}:00`, local: form.local, descricao: form.descricao, arte: arte || undefined });
  };
  return <form className="modal editor-modal" onSubmit={submitForm} ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div className="modal-header"><div><span className="modal-kicker">{member ? 'COMUNIDADE' : 'AGENDA'}</span><h2 id="modal-title">{title}</h2><p>{member ? 'Os dados ajudam a manter contato e organizar a participação.' : 'Combine uma data, um horário e um lugar para estarem juntos.'}</p></div><button type="button" className="modal-close" onClick={onClose} aria-label="Fechar"><X size={19}/></button></div>
    {error && <div className="error-banner modal-error" role="alert">{error}</div>}
    {member ? <>
      <label className="field"><span>Nome completo</span><input name="nome" value={form.nome} onChange={update} maxLength="120" autoComplete="name" required/></label>
      <label className="field"><span>Usuário do Instagram <small>opcional</small></span><input id="member-instagram" name="instagram" value={form.instagram} onChange={event => { update(event); if (instagramError) setInstagramError(''); }} maxLength="31" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="@seuusuario" aria-invalid={Boolean(instagramError)} aria-describedby={instagramError ? 'member-instagram-error' : undefined}/>{instagramError && <span className="field-error" id="member-instagram-error" role="alert">{instagramError}</span>}</label>
      <label className="field"><span>Telefone <small>opcional</small></span><input id="member-phone" name="telefone" type="tel" inputMode="tel" value={form.telefone} onChange={event => { setForm(current => ({ ...current, telefone: maskBrazilianPhone(event.target.value) })); if (telefoneError) setTelefoneError(''); }} maxLength="20" autoComplete="tel" placeholder="(11) 99999-9999" aria-invalid={Boolean(telefoneError)} aria-describedby={telefoneError ? 'member-phone-error' : undefined}/>{telefoneError && <span className="field-error" id="member-phone-error" role="alert">{telefoneError}</span>}</label>
    </> : <>
      <label className="field"><span>Nome do encontro</span><input name="titulo" value={form.titulo} onChange={update} maxLength="150" required/></label>
      <div className="date-time-fields">
        <div className={`field ${dateError ? 'has-error' : ''}`}><span id="event-date-label">Data</span><DatePicker id="event-date" value={form.data} buttonRef={dateButtonRef} invalid={Boolean(dateError)} onChange={date => { setForm(current => ({ ...current, data: date })); setDateError(''); }}/>{dateError && <span className="field-error" id="event-date-error" role="alert">{dateError}</span>}</div>
        <label className="field"><span>Horário</span><span className="time-control"><Clock3 size={17}/><input name="hora" type="time" value={form.hora} onChange={event => { update(event); setDateError(''); }} required/></span></label>
      </div>
      <label className="field"><span>Local</span><input name="local" value={form.local} onChange={update} maxLength="200" required/></label>
      <label className="field"><span>Descrição <small>opcional</small></span><textarea name="descricao" value={form.descricao} onChange={update} maxLength="2000" rows="4" placeholder="Conte um pouco sobre o encontro."/></label>
      <label className="field"><span>Arte do encontro <small>opcional</small></span><input ref={arquivoArteRef} type="file" accept="image/png,image/jpeg,image/webp" aria-invalid={Boolean(arteError)} aria-describedby={arteError ? 'poster-help poster-error' : 'poster-help'} onChange={escolherArte}/><small className="field-hint" id="poster-help">PNG, JPEG ou WebP de até 1 MB.{item.temArte && !arte ? ' A arte atual será mantida.' : ''}</small>{arteError && <span className="field-error" id="poster-error" role="alert">{arteError}</span>}{lendoArte && <span className="field-hint" role="status">Preparando a imagem…</span>}{arte && <img className="poster-preview" src={arte} alt="Prévia da arte selecionada"/>}</label>
    </>}
    <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Voltar</button><button className="button button-primary" disabled={saving || lendoArte} aria-busy={saving || lendoArte}>{saving ? <><span className="spinner light-spinner"/> Salvando…</> : lendoArte ? 'Preparando imagem…' : <><Check size={17}/> {member ? 'Salvar cadastro' : 'Salvar encontro'}</>}</button></div>
  </form>;
});

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function parseDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function DatePicker({ id, value, minValue, buttonRef, invalid, onChange }) {
  const uid = useId();
  const controlRef = useRef(null);
  const popoverRef = useRef(null);
  const moveFocusRef = useRef(false);
  const minDate = minValue ? parseDateKey(minValue.slice(0, 10)) : null;
  const minKey = minDate ? dateKey(minDate) : '';
  const selectedDate = parseDateKey(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selectedDate || minDate || new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [activeDate, setActiveDate] = useState(() => selectedDate || minDate || new Date());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const activeKey = dateKey(activeDate);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(visibleMonth);
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const startDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - ((firstOfMonth.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + index));
  const minMonth = minDate ? monthKey(minDate) : '';
  const currentMonth = monthKey(visibleMonth);
  const previousMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
  const previousDisabled = Boolean(minMonth && monthKey(previousMonth) < minMonth);
  const formattedDate = selectedDate
    ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(selectedDate).replace('.', '')
    : 'Selecionar data';

  const updatePosition = useCallback(() => {
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(416, window.innerWidth - 24);
    const estimatedHeight = 390;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    const below = rect.bottom + 8;
    const top = below + estimatedHeight <= window.innerHeight - 10
      ? below
      : Math.max(10, rect.top - estimatedHeight - 8);
    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
      const popover = popoverRef.current;
      if (popover && !popover.matches(':popover-open')) popover.showPopover();
      if (moveFocusRef.current) {
        popoverRef.current?.querySelector(`[data-date="${activeKey}"]`)?.focus();
        moveFocusRef.current = false;
      }
    } else {
      const popover = popoverRef.current;
      if (popover?.matches(':popover-open')) popover.hidePopover();
    }
  }, [open, activeKey, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => {
      if (!controlRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const onViewportChange = () => updatePosition();
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updatePosition]);

  const showCalendar = () => {
    const initial = selectedDate || minDate || new Date();
    setActiveDate(initial);
    setVisibleMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
    setOpen(true);
  };
  const focusDate = date => {
    const key = dateKey(date);
    const next = minKey && key < minKey ? minDate : date;
    moveFocusRef.current = true;
    setActiveDate(next);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };
  const shiftMonth = amount => {
    const month = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1);
    const day = Math.min(activeDate.getDate(), new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate());
    focusDate(new Date(month.getFullYear(), month.getMonth(), day));
  };
  const handleDayKeyDown = (event, day) => {
    let next = null;
    if (event.key === 'ArrowLeft') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1);
    if (event.key === 'ArrowRight') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    if (event.key === 'ArrowUp') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() - 7);
    if (event.key === 'ArrowDown') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7);
    if (event.key === 'Home') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7));
    if (event.key === 'End') next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + (6 - ((day.getDay() + 6) % 7)));
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      const amount = event.key === 'PageUp' ? -1 : 1;
      const month = new Date(day.getFullYear(), day.getMonth() + amount, 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      next = new Date(month.getFullYear(), month.getMonth(), Math.min(day.getDate(), lastDay));
    }
    if (!next) return;
    event.preventDefault();
    focusDate(next);
  };
  const handlePopoverKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };
  const selectDate = date => {
    const key = dateKey(date);
    if (minKey && key < minKey) return;
    onChange(key);
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };
  const selectToday = () => {
    const today = new Date();
    if (!minKey || dateKey(today) >= minKey) selectDate(today);
  };
  const today = new Date();
  const todayKey = dateKey(today);

  return <div className="date-control" ref={controlRef}>
    <button ref={buttonRef} className="date-trigger" type="button" id={id} aria-labelledby={`event-date-label ${uid}-value`} aria-haspopup="dialog" aria-controls={`${uid}-calendar`} aria-expanded={open} aria-required="true" aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined} onClick={() => open ? setOpen(false) : showCalendar()}>
      <CalendarDays size={17}/><span id={`${uid}-value`}>{formattedDate}</span><ChevronDown size={15} className="date-chevron"/>
    </button>
    <div ref={popoverRef} className="calendar-popover" id={`${uid}-calendar`} popover="manual" role="dialog" aria-label="Escolher data do encontro" onKeyDownCapture={handlePopoverKeyDown} onToggle={event => { if (event.newState === 'closed') setOpen(false); }} style={{ top: position.top, left: position.left }}>
      <div className="calendar-header"><button type="button" className="month-step" onClick={() => shiftMonth(-1)} disabled={previousDisabled} aria-label="Mês anterior"><ArrowLeft size={17}/></button><h3 aria-live="polite">{monthLabel}</h3><button type="button" className="month-step" onClick={() => shiftMonth(1)} aria-label="Próximo mês"><ArrowRight size={17}/></button></div>
      <div className="calendar-grid" role="grid" aria-label={`Calendário de ${monthLabel}`}>
        <div className="calendar-weekday-row" role="row">{dayLabels.map(label => <span role="columnheader" key={label}>{label}</span>)}</div>
        {Array.from({ length: 6 }, (_, week) => <div className="calendar-week" role="row" key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
          const key = dateKey(day);
          const disabled = Boolean(minKey && key < minKey);
          const inMonth = monthKey(day) === currentMonth;
          return <span className="calendar-cell" role="gridcell" key={key} aria-selected={key === value || undefined}>
            <button type="button" data-date={key} className={`calendar-day ${inMonth ? '' : 'outside-month'} ${key === todayKey ? 'is-today' : ''} ${key === value ? 'is-selected' : ''}`} tabIndex={key === activeKey ? 0 : -1} disabled={disabled} aria-label={formatDate(day)} aria-pressed={key === value} onClick={() => selectDate(day)} onFocus={() => setActiveDate(day)} onKeyDown={event => handleDayKeyDown(event, day)}>{day.getDate()}</button>
          </span>;
        })}</div>)}
      </div>
      <div className="calendar-footer"><span>Horário local</span><button type="button" onClick={selectToday} disabled={Boolean(minKey && todayKey < minKey)}>Hoje</button></div>
    </div>
  </div>;
}

function HistoryContent({ modal, onClose }) {
  return <>
    <div className="modal-header"><div><span className="modal-kicker">CAMINHO NA COMUNIDADE</span><h2 id="modal-title">Encontros de {modal.item.nome}</h2><p>Presenças registradas para esta pessoa.</p></div><button className="modal-close" onClick={onClose} aria-label="Fechar histórico"><X size={19}/></button></div>
    {modal.error ? <div className="login-error" role="alert">{modal.error}</div> : modal.loading ? <div className="modal-loading"><span className="spinner"/> Buscando o histórico…</div> : modal.records.length ? <ul className="history-list">{modal.records.map((record, index) => <li key={record.id}><span className="attendance-sequence">{(index + 1).toString().padStart(2, '0')}</span><span><b>{record.eventoTitulo}</b><small>{dateValue(record.dataRegistro)}</small></span></li>)}</ul> : <EmptyState icon={CalendarDays} title="Ainda não há presenças." text="Quando esta pessoa participar de um encontro, o registro aparecerá aqui."/>}
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
