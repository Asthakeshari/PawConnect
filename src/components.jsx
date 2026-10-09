import {useState} from 'react';import {Link,NavLink,useNavigate,Navigate} from 'react-router-dom';import {useStore} from './store.jsx';
export const EMOJI={Dog:'🐕',Cat:'🐈',Rabbit:'🐇',Bird:'🦜'};
export function Img({src,species,className=''}){const [bad,setBad]=useState(false);
return bad||!src?<div className={`flex items-center justify-center bg-sage-100 text-6xl ${className}`}>{EMOJI[species]||'🐾'}</div>:<img src={src} alt={species} loading="lazy" onError={()=>setBad(true)} className={`object-cover ${className}`}/>}
export const Spinner=()=><div className="flex justify-center py-16"><div className="h-10 w-10 animate-spin rounded-full border-4 border-sage-100 border-t-sage-600"/></div>;
export const Badge=({children,tone='sage'})=><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone==='green'?'bg-green-100 text-green-800':tone==='red'?'bg-red-100 text-red-700':tone==='amber'?'bg-amber-100 text-amber-800':'bg-sage-100 text-sage-700'}`}>{children}</span>;
export const statusTone=s=>s==='Approved'?'green':s==='Rejected'?'red':'amber';
export function Field({label,error,children}){return <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}{error&&<span className="mt-1 block text-xs text-red-600">{error}</span>}</label>}
export const Page=({title,sub,children})=><main className="mx-auto max-w-6xl px-4 py-10"><h1 className="font-display text-3xl font-bold">{title}</h1>{sub&&<p className="mt-1 text-sage-600">{sub}</p>}<div className="mt-8">{children}</div></main>;
export function Guard({roles,children}){const {user,authLoading}=useStore();if(authLoading)return <Spinner/>;if(!user)return <Navigate to="/login" replace/>;if(roles&&!roles.includes(user.role))return <Navigate to="/" replace/>;return children}
export function PetCard({pet}){return <Link to={`/pets/${pet.id}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-md">
<Img src={pet.photos[0]} species={pet.species} className="h-48 w-full transition group-hover:scale-105"/>
<div className="p-4"><div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold">{pet.name}</h3><span className="text-sm text-sage-600">{pet.gender}</span></div>
<p className="text-sm text-sage-700">{pet.breed} · {pet.age} yr</p><p className="mt-1 text-xs text-sage-500">📍 {pet.location}</p>
<div className="mt-3 flex gap-2"><Badge>{pet.size}</Badge>{pet.vaccinated?<Badge tone="green">Vaccinated</Badge>:<Badge tone="amber">Not vaccinated</Badge>}</div></div></Link>}
export function Navbar(){const {user,logout,notes}=useStore();const unread=notes.filter(n=>!n.read).length;const nav=useNavigate();const [open,setOpen]=useState(false);
const home=user&&(user.role==='adopter'?'/dashboard':user.role==='admin'?'/admin':'/owner');
const links=[['/','Home'],['/browse','Browse Pets'],['/community','Community'],['/support','Support'],...(user?[[home,user.role==='admin'?'Admin':'Dashboard'],...(user.role==='admin'?[['/owner','Listings']]:[]),...(user.role==='adopter'?[['/applications','My Applications']]:[['/add-pet','Add Pet']]),['/profile','Profile'],['/notifications','🔔'+(unread?' '+unread:'')]]:[])];
const cls=({isActive})=>`block rounded-full px-3 py-1.5 text-sm ${isActive?'bg-sage-600 text-white':'hover:bg-sage-100'}`;
return <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream-50/90 backdrop-blur"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
<Link to="/" className="font-display text-xl font-bold text-sage-700">🐾 PawConnect</Link>
<button className="md:hidden text-2xl" aria-label="Menu" onClick={()=>setOpen(!open)}>{open?'✕':'☰'}</button>
<nav className={`${open?'flex':'hidden'} absolute left-0 top-full w-full flex-col gap-1 border-b bg-cream-50 p-4 md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`} onClick={()=>setOpen(false)}>
{links.map(([to,l])=><NavLink key={l} to={to} end className={cls}>{l}</NavLink>)}
{user?<button className="btn-ghost md:ml-2" onClick={()=>{logout();nav('/')}}>Log out</button>:<Link to="/login" className="btn md:ml-2">Login / Register</Link>}</nav></div></header>}
export function ChatBox({app}){const {user,sendMsg,person}=useStore();const [t,setT]=useState('');
const send=e=>{e.preventDefault();if(!t.trim())return;sendMsg(app.id,t.trim());setT('')};
return <div className="mt-3 rounded-xl bg-cream-100 p-3"><div className="max-h-40 space-y-1 overflow-y-auto text-sm">
{app.messages.length===0&&<p className="text-sage-500">No messages yet. Say hello 👋</p>}
{app.messages.map((m,i)=><p key={i} className={m.from===user.id?'text-right':''}><span className={`inline-block rounded-2xl px-3 py-1 ${m.from===user.id?'bg-sage-600 text-white':'bg-white'}`}><b className="text-xs opacity-70">{m.name} </b>{m.text}</span></p>)}</div>
<form onSubmit={send} className="mt-2 flex gap-2"><input className="input" value={t} onChange={e=>setT(e.target.value)} placeholder="Type a message…"/><button className="btn">Send</button></form>
<p className="mt-1 text-[11px] text-sage-500">🔒 Private: only you and the other party can read this chat.</p></div>}
