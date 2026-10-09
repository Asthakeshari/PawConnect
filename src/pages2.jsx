import {useEffect,useState} from 'react';import {useNavigate} from 'react-router-dom';
import {useStore} from './store.jsx';import {ROLES} from './data.js';import {supabase} from './supabase.js';
import {Spinner,Badge,Field,Page} from './components.jsx';
const Unconfigured=()=><p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">This feature needs Supabase to be configured (see README). Nothing here works until then.</p>;

export function Notifications(){const {notes,markRead}=useStore();const nav=useNavigate();
return <Page title="Notifications">{!notes.length?<p className="text-sage-600">You're all caught up.</p>:<div className="space-y-2">{notes.map(n=><button key={n.id} onClick={()=>{markRead(n.id);n.link&&nav(n.link)}} className={`card block w-full p-4 text-left ${n.read?'opacity-60':''}`}><b>{n.title}</b><p className="text-sm">{n.body}</p><span className="text-xs text-sage-500">{new Date(n.created_at).toLocaleString()}</span></button>)}</div>}</Page>}

export function ReportButton({type,id}){const {run}=useStore();const [open,setOpen]=useState(false);const [r,setR]=useState('');const [err,setErr]=useState('');
const send=async()=>{if(r.trim().length<5)return setErr('Please describe the problem (at least 5 characters)');setErr('');const e=await run(supabase.from('reports').insert({target_type:type,target_id:id,reason:r.trim()}),'Report sent to moderators');if(!e){setOpen(false);setR('')}};
return !open?<button className="mt-3 text-xs underline" onClick={()=>setOpen(true)}>Report this listing</button>:<div className="mt-3 space-y-2"><input className="input" placeholder="What is wrong?" value={r} onChange={e=>setR(e.target.value)}/>{err&&<p className="text-xs text-red-600">{err}</p>}<button className="btn" onClick={send}>Send report</button></div>}

export function NgoVerification(){const {user,run,setFlash}=useStore();const [v,setV]=useState(undefined);const [d,setD]=useState({org:'',reg:''});const [file,setFile]=useState(null);const [err,setErr]=useState({});const [busy,setBusy]=useState(false);
const load=()=>supabase.from('ngo_verifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).then(({data})=>setV(data?.[0]||null));useEffect(()=>{load()},[]);
const submit=async e=>{e.preventDefault();const x={};if(d.org.trim().length<2)x.org='Enter the organisation name';if(d.reg.trim().length<3)x.reg='Enter the registration number';
if(!file)x.file='Upload a registration document';else if(!/^(application\/pdf|image\/(jpeg|png))$/.test(file.type)||file.size>5e6)x.file='PDF, JPG or PNG up to 5 MB';setErr(x);if(Object.keys(x).length)return;setBusy(true);
try{const path=`${user.id}/${crypto.randomUUID()}.${file.name.split('.').pop().toLowerCase()}`;const up=await supabase.storage.from('ngo-docs').upload(path,file,{contentType:file.type});if(up.error)throw up.error;
const er=await run(supabase.from('ngo_verifications').insert({org_name:d.org.trim(),registration_no:d.reg.trim(),document_path:path}),'Verification request submitted');if(!er)load()}catch(ex){setFlash({m:ex.message,ok:false})}setBusy(false)};
return <div className="card mx-auto mt-6 max-w-md space-y-3 p-6"><h2 className="font-bold">NGO verification</h2>
{v===undefined?<Spinner/>:user.ngo_verified?<Badge tone="green">✔ Verified NGO</Badge>:v?.status==='pending'?<p className="text-sm">Your request is awaiting admin review.</p>:
<form onSubmit={submit} noValidate className="space-y-3">{v?.status==='rejected'&&<p className="text-sm text-red-600">Rejected{v.note?': '+v.note:''}. You may resubmit.</p>}
<Field label="Organisation name" error={err.org}><input className="input" value={d.org} onChange={e=>setD({...d,org:e.target.value})}/></Field>
<Field label="Registration number" error={err.reg}><input className="input" value={d.reg} onChange={e=>setD({...d,reg:e.target.value})}/></Field>
<Field label="Registration document (private; only you and admins can view it)" error={err.file}><input type="file" accept=".pdf,image/jpeg,image/png" onChange={e=>setFile(e.target.files[0]||null)}/></Field>
<button className="btn w-full" disabled={busy}>{busy?'Uploading…':'Submit for verification'}</button></form>}</div>}

export function AgreementBox({app}){const {user,run}=useStore();if(app.status!=='Approved')return null;const ag=app.agreement;const mine=user.id===app.adopterId?'adopter':'owner';
return <div className="mt-3 rounded-xl border border-sage-300 p-3 text-sm"><b>Adoption agreement & follow-ups</b>
{!ag?<p>Agreement not available yet.</p>:<><p className="mt-1 whitespace-pre-line text-sage-700">{ag.terms}</p>
<p className="mt-2">Adopter: {ag.adopter_signed_at?'signed '+ag.adopter_signed_at.slice(0,10):'not signed'} · Owner: {ag.owner_signed_at?'signed '+ag.owner_signed_at.slice(0,10):'not signed'}</p>
{!ag[mine+'_signed_at']&&<button className="btn mt-2" onClick={()=>run(supabase.rpc('sign_agreement',{a:app.id}),'Agreement signed')}>Sign agreement</button>}</>}
<ul className="mt-2 space-y-1">{app.followUps.map(f=><li key={f.id}>Follow-up due {f.due_date} · {f.status}{f.status==='due'&&<button className="ml-2 underline" onClick={()=>run(supabase.from('follow_ups').update({status:'done'}).eq('id',f.id),'Follow-up marked done')}>Mark done</button>}</li>)}</ul></div>}

const TABS={volunteer:['Volunteer opportunities',['volunteer']],foster:['Foster care',['foster_offer','foster_need']],lostfound:['Lost & Found',['lost','found']]};
const KIND={volunteer:'Volunteer opportunity',foster_offer:'Foster offer',foster_need:'Foster needed',lost:'Lost pet',found:'Found pet'};
function Post({p,resp,reload}){const {user,run,people}=useStore();const [m,setM]=useState('');const [err,setErr]=useState('');const mineP=user?.id===p.author_id;
const send=async()=>{if(m.trim().length<2)return setErr('Write a short message');setErr('');const e=await run(supabase.from('post_responses').insert({post_id:p.id,message:m.trim()}),'Response sent');if(!e){setM('');reload()}};
const rs=resp.filter(r=>r.post_id===p.id);
return <div className="card p-4"><div className="flex items-center justify-between"><h3 className="font-bold">{p.title}</h3><Badge>{KIND[p.kind]}</Badge></div>
<p className="mt-1 text-sm">{p.description}</p><p className="mt-1 text-xs text-sage-500">📍 {p.location} · by {people[p.author_id]?.name||'Unknown'}{people[p.author_id]?.ngo_verified&&' ✔'}</p>
{mineP?rs.map(r=><p key={r.id} className="mt-2 rounded-xl bg-cream-100 p-2 text-sm"><b>{people[r.user_id]?.name}:</b> {r.message}</p>):user&&<div className="mt-3 flex gap-2"><input className="input" placeholder="Your message to the poster" value={m} onChange={e=>setM(e.target.value)}/><button className="btn" onClick={send}>Respond</button></div>}
{err&&<p className="text-xs text-red-600">{err}</p>}</div>}
export function Community(){const {user,configured,run}=useStore();const [tab,setTab]=useState('volunteer');const [posts,setPosts]=useState(null);const [resp,setResp]=useState([]);const kinds=TABS[tab][1];
const blank={kind:kinds[0],title:'',description:'',location:'',species:''};const [d,setD]=useState(blank);const [err,setErr]=useState({});
const load=async()=>{setPosts(null);const [p,r]=await Promise.all([supabase.from('community_posts').select('*').in('kind',kinds).neq('status','removed').order('created_at',{ascending:false}),supabase.from('post_responses').select('*')]);setPosts(p.data||[]);setResp(r.data||[])};
useEffect(()=>{if(configured){setD({...blank,kind:kinds[0]});load()}},[tab]);
const canVol=user&&(user.role==='admin'||(user.role==='ngo'&&user.ngo_verified));
const create=async e=>{e.preventDefault();const x={};if(d.title.trim().length<3)x.title='Title needs 3+ characters';if(d.description.trim().length<10)x.description='Describe in 10+ characters';if(!d.location.trim())x.location='Location required';if(d.kind==='volunteer'&&!canVol)x.kind='Only verified NGOs can post volunteer opportunities';setErr(x);if(Object.keys(x).length)return;
const er=await run(supabase.from('community_posts').insert({kind:d.kind,title:d.title.trim(),description:d.description.trim(),location:d.location.trim(),species:d.species||null}),'Posted');if(!er){setD({...blank,kind:d.kind});load()}};
return <Page title="Community" sub="Volunteer opportunities, foster care and lost & found pets">{!configured?<Unconfigured/>:<>
<div className="mb-6 flex flex-wrap gap-2">{Object.entries(TABS).map(([k,[l]])=><button key={k} onClick={()=>setTab(k)} className={tab===k?'btn':'btn-ghost'}>{l}</button>)}</div>
{user?<form onSubmit={create} noValidate className="card mb-6 grid gap-3 p-4 sm:grid-cols-2"><Field label="Type" error={err.kind}><select className="input" value={d.kind} onChange={e=>setD({...d,kind:e.target.value})}>{kinds.map(k=><option key={k} value={k}>{KIND[k]}</option>)}</select></Field>
<Field label="Location" error={err.location}><input className="input" value={d.location} onChange={e=>setD({...d,location:e.target.value})}/></Field>
<Field label="Title" error={err.title}><input className="input" value={d.title} onChange={e=>setD({...d,title:e.target.value})}/></Field>
<Field label="Species (optional)"><input className="input" value={d.species} onChange={e=>setD({...d,species:e.target.value})}/></Field>
<div className="sm:col-span-2"><Field label="Details (don't include phone numbers or home addresses)" error={err.description}><textarea rows={3} className="input" value={d.description} onChange={e=>setD({...d,description:e.target.value})}/></Field></div>
<button className="btn sm:col-span-2">Post</button></form>:<p className="mb-6 text-sm">Log in to post or respond.</p>}
{!posts?<Spinner/>:posts.length?<div className="space-y-4">{posts.map(p=><Post key={p.id} p={p} resp={resp} reload={load}/>)}</div>:<p className="text-sage-600">Nothing posted yet.</p>}</>}</Page>}

export function Support(){return <Page title="Support PawConnect" sub="Donations, NGO subscriptions and sponsorships"><div className="grid gap-4 md:grid-cols-3">{[['💛','Donate to an NGO'],['🏢','NGO subscription plans'],['🐾','Sponsor a pet']].map(([i,t])=><div key={t} className="card p-5 text-center"><div className="text-3xl">{i}</div><h3 className="mt-2 font-bold">{t}</h3><button disabled className="btn mt-3">Payments not enabled</button></div>)}</div>
<p className="mt-6 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Not live: no payments are processed and nothing is collected. The tables (donations, subscriptions, sponsorships) exist with read-only client access; writes will come from a server-side payment webhook once a provider is configured.</p></Page>}

export function AdminPanel(){const {user,listProfiles,grantRole,run,pets}=useStore();const [rows,setRows]=useState(null);const [ngos,setNgos]=useState([]);const [reps,setReps]=useState([]);const [posts,setPosts]=useState([]);
const refresh=async()=>{listProfiles().then(r=>setRows(r.data));const [n,r,c]=await Promise.all([supabase.from('ngo_verifications').select('*').eq('status','pending'),supabase.from('reports').select('*').eq('status','open'),supabase.from('community_posts').select('*').order('created_at',{ascending:false}).limit(30)]);setNgos(n.data||[]);setReps(r.data||[]);setPosts(c.data||[])};
useEffect(()=>{refresh()},[]);const act=async(p,ok)=>{await run(p,ok);refresh()};
const doc=async path=>{const {data,error}=await supabase.storage.from('ngo-docs').createSignedUrl(path,300);error?alert(error.message):window.open(data.signedUrl,'_blank','noopener')};
const H=({children})=><h2 className="mb-2 mt-8 font-bold">{children}</h2>;
return <Page title="Admin Panel" sub="Role changes, NGO verification and moderation are enforced in the database."><H>NGO verification queue</H>
{!ngos.length?<p className="text-sm text-sage-600">No pending requests.</p>:ngos.map(n=><div key={n.id} className="card mb-2 flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><span><b>{n.org_name}</b> · Reg. {n.registration_no}</span><span className="flex gap-2"><button className="btn-ghost" onClick={()=>doc(n.document_path)}>View document</button><button className="btn" onClick={()=>act(supabase.rpc('review_ngo',{p_id:n.id,p_approve:true,p_note:''}),'NGO approved')}>Approve</button><button className="btn-ghost" onClick={()=>act(supabase.rpc('review_ngo',{p_id:n.id,p_approve:false,p_note:'Documents could not be verified'}),'NGO rejected')}>Reject</button></span></div>)}
<H>Open reports</H>{!reps.length?<p className="text-sm text-sage-600">No open reports.</p>:reps.map(r=><div key={r.id} className="card mb-2 flex items-center justify-between gap-2 p-3 text-sm"><span>[{r.target_type}] {r.reason}</span><button className="btn-ghost" onClick={()=>act(supabase.from('reports').update({status:'resolved'}).eq('id',r.id),'Report resolved')}>Mark resolved</button></div>)}
<H>Pet listings</H>{pets.map(p=><div key={p.id} className="card mb-2 flex items-center justify-between p-3 text-sm"><span>{p.name} · {p.ownerName} · <Badge tone={p.status==='removed'?'red':'sage'}>{p.status}</Badge></span><button className="btn-ghost" onClick={()=>act(supabase.rpc('set_pet_status',{p_id:p.id,p_status:p.status==='removed'?'active':'removed'}),'Listing updated')}>{p.status==='removed'?'Restore':'Remove'}</button></div>)}
<H>Community posts</H>{posts.map(p=><div key={p.id} className="card mb-2 flex items-center justify-between p-3 text-sm"><span>{p.title} · <Badge tone={p.status==='removed'?'red':'sage'}>{p.status}</Badge></span><button className="btn-ghost" onClick={()=>act(supabase.rpc('set_post_status',{p_id:p.id,p_status:p.status==='removed'?'open':'removed'}),'Post updated')}>{p.status==='removed'?'Restore':'Remove'}</button></div>)}
<H>Users & roles</H>{!rows?<Spinner/>:<div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-cream-100"><tr><th className="p-3">Name</th><th>Email</th><th>Role</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t border-cream-200"><td className="p-3">{r.name||'—'}</td><td>{r.email}</td><td><select className="input max-w-[11rem]" value={r.role} disabled={r.id===user.id} onChange={e=>act(grantRole(r.id,e.target.value),'Role updated')}>{ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td></tr>)}</tbody></table></div>}</Page>}
