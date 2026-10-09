import {useEffect,useState} from 'react';import {Link,useNavigate,useParams} from 'react-router-dom';
import {useStore} from './store.jsx';import {ROLES,PUBLIC_ROLES} from './data.js';
import {AgreementBox,NgoVerification,ReportButton} from './pages2.jsx';
import {Img,Spinner,Badge,Field,Page,PetCard,ChatBox,statusTone} from './components.jsx';
const useLoading=(ms=500)=>{const [l,setL]=useState(true);useEffect(()=>{const t=setTimeout(()=>setL(false),ms);return()=>clearTimeout(t)},[]);return l};

export function Home(){const {pets,user}=useStore();return <>
<section className="bg-gradient-to-b from-sage-100 to-cream-50"><div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
<div><h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">Every pet deserves a loving home.</h1>
<p className="mt-4 text-sage-700">PawConnect links caring adopters with owners, shelters and NGOs for safe, transparent rehoming.</p>
<div className="mt-6 flex gap-3"><Link to="/browse" className="btn">Find a pet</Link><Link to={user?'/add-pet':'/login'} className="btn-ghost">Rehome a pet</Link></div></div>
<div className="text-center text-[8rem] md:text-[11rem]">🐶🐱</div></div></section>
<main className="mx-auto max-w-6xl px-4 py-12"><h2 className="font-display text-2xl font-bold">Featured pets</h2>
<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{pets.slice(0,4).map(p=><PetCard key={p.id} pet={p}/>)}</div>
<div className="mt-14 grid gap-6 md:grid-cols-3">{[['🔍','Browse','Filter by species, breed, age, size and vaccination.'],['📝','Apply','Complete a detailed questionnaire for the owner.'],['💬','Connect','Chat with the owner and get a decision.']].map(([i,t,d])=><div key={t} className="card p-6 text-center"><div className="text-4xl">{i}</div><h3 className="mt-2 font-bold">{t}</h3><p className="text-sm text-sage-600">{d}</p></div>)}</div></main></>}

export function Browse(){const {pets}=useStore();const loading=useLoading();
const [f,setF]=useState({q:'',species:'',breed:'',age:'',size:'',location:'',vax:''});const set=k=>e=>setF({...f,[k]:e.target.value});
const ok=p=>(!f.q||(p.name+p.breed).toLowerCase().includes(f.q.toLowerCase()))&&(!f.species||p.species===f.species)&&(!f.breed||p.breed.toLowerCase().includes(f.breed.toLowerCase()))&&(!f.size||p.size===f.size)&&(!f.location||p.location.toLowerCase().includes(f.location.toLowerCase()))&&(!f.vax||String(p.vaccinated)===f.vax)&&(!f.age||(f.age==='0'?p.age<2:f.age==='2'?p.age>=2&&p.age<=5:p.age>5));
const list=pets.filter(ok);
return <Page title="Browse Pets" sub={`${list.length} pets looking for homes`}>
<div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
<input className="input" placeholder="Search name or breed" value={f.q} onChange={set('q')}/>
<select className="input" value={f.species} onChange={set('species')}><option value="">All species</option>{['Dog','Cat','Rabbit','Bird'].map(s=><option key={s}>{s}</option>)}</select>
<input className="input" placeholder="Breed" value={f.breed} onChange={set('breed')}/>
<select className="input" value={f.age} onChange={set('age')}><option value="">Any age</option><option value="0">Under 2 yrs</option><option value="2">2–5 yrs</option><option value="6">Over 5 yrs</option></select>
<select className="input" value={f.size} onChange={set('size')}><option value="">Any size</option>{['Small','Medium','Large'].map(s=><option key={s}>{s}</option>)}</select>
<input className="input" placeholder="Location" value={f.location} onChange={set('location')}/>
<select className="input" value={f.vax} onChange={set('vax')}><option value="">Vaccination: any</option><option value="true">Vaccinated</option><option value="false">Not vaccinated</option></select>
<button className="btn-ghost" onClick={()=>setF({q:'',species:'',breed:'',age:'',size:'',location:'',vax:''})}>Clear filters</button></div>
{loading?<Spinner/>:list.length?<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{list.map(p=><PetCard key={p.id} pet={p}/>)}</div>:<p className="py-16 text-center text-sage-600">No pets match your filters 🐾</p>}</Page>}

export function PetDetails(){const {id}=useParams();const {pet,person,user,apps,dataLoading}=useStore();const p=pet(id);const [i,setI]=useState(0);const loading=useLoading(300);
if(loading||dataLoading)return <Spinner/>;if(!p)return <Page title="Pet not found"><Link className="underline" to="/browse">Back to browse</Link></Page>;
const owner={name:p.ownerName||person(p.ownerId).name,role:p.ownerRole||person(p.ownerId).role,verified:p.ownerVerified};const applied=user&&apps.some(a=>a.petId===p.id&&a.adopterId===user.id);
return <Page title={p.name} sub={`${p.breed} · ${p.age} yr · ${p.gender} · ${p.location}`}><div className="grid gap-8 md:grid-cols-2">
<div><Img src={p.photos[i]} species={p.species} className="h-80 w-full rounded-2xl"/><div className="mt-3 flex gap-2">{p.photos.map((ph,k)=><button key={k} onClick={()=>setI(k)} className={`overflow-hidden rounded-xl border-2 ${k===i?'border-sage-600':'border-transparent'}`}><Img src={ph} species={p.species} className="h-16 w-20"/></button>)}</div>
{p.video&&<video controls src={p.video} className="mt-4 w-full rounded-2xl"/>}</div>
<div className="card space-y-3 p-6 text-sm">{[['Size',p.size],['Vaccination',p.vaccinated?'Vaccinated':'Pending'],['Medical',p.medical],['Behaviour',p.behaviour],['Reason for rehoming',p.reason],['Listed by',`${owner.name} (${owner.role}${owner.verified?' · ✔ verified NGO':''})`]].map(([k,v])=><p key={k}><b>{k}:</b> {v}</p>)}
<div className="pt-3">{!user?<Link to="/login" className="btn">Login to adopt</Link>:user.role!=='adopter'?<Badge>Only adopters can apply</Badge>:applied?<Link to="/applications" className="btn-ghost">Already applied – view status</Link>:<Link to={`/apply/${p.id}`} className="btn">Apply to adopt {p.name}</Link>}</div>{user&&p.ownerId!==user.id&&<ReportButton type="pet" id={p.id}/>}</div></div></Page>}

export function Auth(){const {login,register,configured}=useStore();const nav=useNavigate();const [mode,setMode]=useState('login');const [busy,setBusy]=useState(false);const [info,setInfo]=useState('');
const [d,setD]=useState({name:'',email:'',password:'',confirm:'',role:'adopter'});const [err,setErr]=useState({});const set=k=>e=>setD({...d,[k]:e.target.value});
const validate=()=>{const x={},reg=mode==='register';if(reg&&d.name.trim().length<2)x.name='Enter your full name';if(!/^\S+@\S+\.\S+$/.test(d.email.trim()))x.email='Enter a valid email address';
if(reg){if(d.password.length<8||!/[A-Za-z]/.test(d.password)||!/\d/.test(d.password))x.password='At least 8 characters, with a letter and a number';if(d.confirm!==d.password)x.confirm='Passwords do not match';if(!PUBLIC_ROLES.some(r=>r[0]===d.role))x.role='Choose a valid role'}else if(!d.password)x.password='Enter your password';return x};
const submit=async e=>{e.preventDefault();const x=validate();setErr(x);setInfo('');if(Object.keys(x).length)return;setBusy(true);
if(mode==='login'){const er=await login(d.email.trim(),d.password);setBusy(false);er?setErr({form:er.message}):nav('/')}
else{const r=await register({...d,name:d.name.trim(),email:d.email.trim()});setBusy(false);if(r.error)return setErr({form:r.error.message});r.confirm?setInfo('Account created. Check your email to confirm it, then log in.'):nav('/')}};
return <Page title={mode==='login'?'Welcome back':'Join PawConnect'}><form onSubmit={submit} noValidate className="card mx-auto max-w-md space-y-4 p-6">
{!configured&&<p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900"><b>Authentication is not configured.</b> Login and registration are disabled until Supabase is set up (see README: add <code>.env</code> and run <code>supabase/schema.sql</code>).</p>}
{mode==='register'&&<Field label="Full name" error={err.name}><input className="input" autoComplete="name" value={d.name} onChange={set('name')}/></Field>}
<Field label="Email" error={err.email}><input type="email" className="input" autoComplete="email" value={d.email} onChange={set('email')}/></Field>
<Field label="Password" error={err.password}><input type="password" className="input" autoComplete={mode==='login'?'current-password':'new-password'} value={d.password} onChange={set('password')}/></Field>
{mode==='register'&&<><Field label="Confirm password" error={err.confirm}><input type="password" className="input" autoComplete="new-password" value={d.confirm} onChange={set('confirm')}/></Field>
<Field label="I am a…" error={err.role}><select className="input" value={d.role} onChange={set('role')}>{PUBLIC_ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
<p className="text-xs text-sage-500">Admin access cannot be requested here; an existing admin must grant it.</p></>}
{err.form&&<p className="text-sm text-red-600">{err.form}</p>}{info&&<p className="text-sm text-sage-700">{info}</p>}
<button className="btn w-full" disabled={busy||!configured}>{busy?'Please wait…':mode==='login'?'Login':'Create account'}</button>
<p className="text-center text-sm">{mode==='login'?'New here?':'Have an account?'} <button type="button" className="underline" onClick={()=>{setMode(mode==='login'?'register':'login');setErr({});setInfo('')}}>{mode==='login'?'Register':'Login'}</button></p></form></Page>}

const Stat=({n,l})=><div className="card p-5 text-center"><div className="text-3xl font-bold text-sage-600">{n}</div><div className="text-sm">{l}</div></div>;
export function AdopterDash(){const {user,apps,pet}=useStore();const mine=apps.filter(a=>a.adopterId===user.id);
return <Page title={`Hello, ${user.name.split(' ')[0]} 👋`} sub="Your adoption journey at a glance"><div className="grid gap-4 sm:grid-cols-3">
<Stat n={mine.length} l="Applications"/><Stat n={mine.filter(a=>a.status==='Pending').length} l="Pending"/><Stat n={mine.filter(a=>a.status==='Approved').length} l="Approved"/></div>
<div className="mt-8 flex gap-3"><Link to="/browse" className="btn">Browse pets</Link><Link to="/applications" className="btn-ghost">My applications</Link></div>
<h2 className="mt-10 font-bold">Recent</h2><div className="mt-3 space-y-2">{mine.slice(0,3).map(a=><div key={a.id} className="card flex justify-between p-4"><span>{pet(a.petId)?.name}</span><Badge tone={statusTone(a.status)}>{a.status}</Badge></div>)}{!mine.length&&<p className="text-sage-600">No applications yet.</p>}</div></Page>}

export function MyApps(){const {user,apps,pet}=useStore();const [open,setOpen]=useState(null);const mine=apps.filter(a=>a.adopterId===user.id);
return <Page title="My Applications">{!mine.length?<p>Nothing yet. <Link className="underline" to="/browse">Find a pet</Link></p>:<div className="space-y-4">{mine.map(a=>{const p=pet(a.petId);return <div key={a.id} className="card p-4"><div className="flex items-center gap-4"><Img src={p?.photos[0]} species={p?.species} className="h-16 w-16 rounded-xl"/><div className="flex-1"><Link to={`/pets/${a.petId}`} className="font-bold">{p?.name}</Link><p className="text-xs text-sage-600">Applied {a.date}</p></div><Badge tone={statusTone(a.status)}>{a.status}</Badge><button className="btn-ghost" onClick={()=>setOpen(open===a.id?null:a.id)}>Chat</button></div><AgreementBox app={a}/>{open===a.id&&<ChatBox app={a}/>}</div>})}</div>}</Page>}

export function OwnerDash(){const {user,pets,apps,pet,person,setStatus}=useStore();const [open,setOpen]=useState(null);
const mineP=user.role==='admin'?pets:pets.filter(p=>p.ownerId===user.id);const ids=mineP.map(p=>p.id);const inc=apps.filter(a=>ids.includes(a.petId));const canAct=user.role!=='volunteer';
return <Page title="Owner Dashboard" sub={`${ROLES.find(r=>r[0]===user.role)[1]} view${canAct?'':' (read-only)'}`}><div className="grid gap-4 sm:grid-cols-3"><Stat n={mineP.length} l="Listings"/><Stat n={inc.length} l="Applications"/><Stat n={inc.filter(a=>a.status==='Pending').length} l="Awaiting review"/></div>
<h2 className="mt-10 font-bold">Applications</h2><div className="mt-3 space-y-4">{!inc.length&&<p className="text-sage-600">No applications yet.</p>}{inc.map(a=>{const ad=person(a.adopterId);return <div key={a.id} className="card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><b>{a.adopterName||ad?.name}</b> → {pet(a.petId)?.name}<p className="text-xs text-sage-600">{a.date}</p></div><div className="flex items-center gap-2"><Badge tone={statusTone(a.status)}>{a.status}</Badge>
{canAct&&a.status==='Pending'&&<><button className="btn" onClick={()=>setStatus(a.id,'Approved')}>Approve</button><button className="btn-ghost" onClick={()=>setStatus(a.id,'Rejected')}>Reject</button></>}
<button className="btn-ghost" onClick={()=>setOpen(open===a.id?null:a.id)}>Details & chat</button></div></div>
<AgreementBox app={a}/>{open===a.id&&<><dl className="mt-3 grid gap-1 rounded-xl bg-cream-100 p-3 text-sm sm:grid-cols-2">{Object.entries(a.answers).map(([k,v])=><div key={k}><dt className="font-medium capitalize">{k}</dt><dd>{String(v)}</dd></div>)}</dl><ChatBox app={a}/></>}</div>})}</div>
<h2 className="mt-10 font-bold">Listings</h2><div className="mt-3 grid gap-4 sm:grid-cols-3">{mineP.map(p=><PetCard key={p.id} pet={p}/>)}</div></Page>}

const EMPTY={name:'',species:'Dog',breed:'',age:'',gender:'Male',size:'Medium',location:'',vaccinated:'true',medical:'',behaviour:'',reason:''};
export function AddPet(){const {addPet}=useStore();const nav=useNavigate();const [d,setD]=useState(EMPTY);const [files,setFiles]=useState({photos:[],video:null});const [err,setErr]=useState({});const [busy,setBusy]=useState(false);const set=k=>e=>setD({...d,[k]:e.target.value});
const pickP=e=>{const fl=[...e.target.files];if(fl.length>4||fl.some(f=>!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size>5e6)){e.target.value='';return setErr({...err,photos:'Up to 4 JPG/PNG/WebP images, 5 MB each'})}setErr({...err,photos:''});setFiles({...files,photos:fl})};
const pickV=e=>{const f=e.target.files[0];if(f&&(!/^video\/(mp4|webm)$/.test(f.type)||f.size>30e6)){e.target.value='';return setErr({...err,video:'MP4 or WebM up to 30 MB'})}setErr({...err,video:''});setFiles({...files,video:f||null})};
const submit=async e=>{e.preventDefault();const x={};['name','breed','location','behaviour','reason'].forEach(k=>{if(!d[k].trim())x[k]='Required'});if(!(+d.age>=0&&d.age!==''&&+d.age<=40))x.age='Enter age in years (0-40)';if(!files.photos.length)x.photos='Add at least one photo';setErr(x);if(Object.keys(x).length)return;
setBusy(true);const r=await addPet({name:d.name.trim(),species:d.species,breed:d.breed.trim(),age:+d.age,gender:d.gender,size:d.size,location:d.location.trim(),vaccinated:d.vaccinated==='true',medical:d.medical.trim(),behaviour:d.behaviour.trim(),reason:d.reason.trim()},files);setBusy(false);r.error?setErr({form:r.error.message}):nav(`/pets/${r.id}`)};
const T=(k,l,p={})=><Field label={l} error={err[k]}><input className="input" value={d[k]} onChange={set(k)} {...p}/></Field>;
const S=(k,l,o)=><Field label={l}><select className="input" value={d[k]} onChange={set(k)}>{o.map(v=>Array.isArray(v)?<option key={v[0]} value={v[0]}>{v[1]}</option>:<option key={v}>{v}</option>)}</select></Field>;
return <Page title="Add Pet Listing"><form onSubmit={submit} noValidate className="card grid gap-4 p-6 sm:grid-cols-2">{T('name','Pet name')}{S('species','Species',['Dog','Cat','Rabbit','Bird','Other'])}{T('breed','Breed')}{T('age','Age (years)',{type:'number',min:0})}{S('gender','Gender',['Male','Female'])}{S('size','Size',['Small','Medium','Large'])}{T('location','Location')}{S('vaccinated','Vaccinated?',[['true','Yes'],['false','No']])}
<div className="sm:col-span-2">{T('medical','Medical notes')}</div><div className="sm:col-span-2">{T('behaviour','Behaviour')}</div><div className="sm:col-span-2">{T('reason','Reason for rehoming')}</div>
<Field label="Photos (1-4, uploaded to private-write storage)" error={err.photos}><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={pickP}/></Field><Field label="Video (optional)" error={err.video}><input type="file" accept="video/mp4,video/webm" onChange={pickV}/></Field>
{err.form&&<p className="text-sm text-red-600 sm:col-span-2">{err.form}</p>}<button className="btn sm:col-span-2" disabled={busy}>{busy?'Uploading & publishing…':'Publish listing'}</button></form></Page>}

const Q={experience:['Pet experience',['First-time owner','Some experience','Experienced']],housing:['Housing',['Own house','Rented home','Apartment']],familyConsent:['Everyone at home agrees?',['Yes','No']],allergies:['Allergies in household?',['None','Yes – manageable','Yes – serious']],hours:['Hours/day available',['Under 2','2–5','5+']]};
export function Apply(){const {id}=useParams();const {pet,apply}=useStore();const nav=useNavigate();const p=pet(id);const [d,setD]=useState({experience:'',housing:'',familyConsent:'',allergies:'',hours:'',carePlan:'',vet:'',why:''});const [err,setErr]=useState({});const [busy,setBusy]=useState(false);
if(!p)return <Page title="Pet not found"/>;
const submit=e=>{e.preventDefault();const x={};Object.keys(d).forEach(k=>{if(!d[k])x[k]='Required'});if(d.familyConsent==='No')x.familyConsent='Family consent is required to apply';if(d.why&&d.why.length<20)x.why='Please write at least 20 characters';setErr(x);if(Object.keys(x).length)return;setBusy(true);apply(p.id,d).then(er=>{setBusy(false);if(!er)nav('/applications')})};
return <Page title={`Adopt ${p.name}`} sub="Tell the owner about yourself"><form onSubmit={submit} className="card mx-auto max-w-2xl space-y-4 p-6">
{Object.entries(Q).map(([k,[l,o]])=><Field key={k} label={l} error={err[k]}><select className="input" value={d[k]} onChange={e=>setD({...d,[k]:e.target.value})}><option value="">Select…</option>{o.map(v=><option key={v}>{v}</option>)}</select></Field>)}
{[['carePlan','Care plan (food, exercise, vet, when you travel)'],['vet','Vet / medical plan'],['why','Why do you want to adopt?']].map(([k,l])=><Field key={k} label={l} error={err[k]}><textarea rows={3} className="input" value={d[k]} onChange={e=>setD({...d,[k]:e.target.value})}/></Field>)}
<button className="btn w-full" disabled={busy}>{busy?'Submitting…':'Submit application'}</button></form></Page>}

export function Profile(){const {user,updateProfile}=useStore();const [d,setD]=useState({name:user.name,phone:user.phone||'',city:user.city||''});const [msg,setMsg]=useState('');const [err,setErr]=useState({});
const save=async e=>{e.preventDefault();const x={};if(d.name.trim().length<2)x.name='Enter your name';if(d.phone&&!/^[+\d\s-]{7,15}$/.test(d.phone))x.phone='Invalid phone';setErr(x);if(Object.keys(x).length)return;const er=await updateProfile({...d,name:d.name.trim()});setMsg(er?'Could not save: '+er.message:'Saved ✓')};
return <Page title="Profile" sub={`${user.email} · ${ROLES.find(r=>r[0]===user.role)[1]}`}><form onSubmit={save} className="card mx-auto max-w-md space-y-4 p-6">
{[['name','Name'],['phone','Phone'],['city','City']].map(([k,l])=><Field key={k} label={l} error={err[k]}><input className="input" value={d[k]} onChange={e=>{setD({...d,[k]:e.target.value});setMsg('')}}/></Field>)}
<button className="btn w-full">Save changes</button>{msg&&<p className="text-center text-sm text-sage-600">{msg}</p>}</form>{user.role==='ngo'&&<NgoVerification/>}</Page>}

export {AdminPanel,Notifications,Community,Support} from './pages2.jsx';
