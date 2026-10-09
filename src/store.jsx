import {createContext,useContext,useEffect,useState} from 'react';
import {SEED_PETS,SEED_PEOPLE} from './data.js';
import {supabase,isConfigured} from './supabase.js';
const Ctx=createContext();export const useStore=()=>useContext(Ctx);
const NOCFG={message:'Supabase is not configured (see README).'};
const one=x=>[].concat(x||[])[0]||null;
/* Everything persists in Supabase (RLS-protected). Without Supabase config the app only shows read-only sample pets. */
export function StoreProvider({children}){
const [pets,setPets]=useState(isConfigured?[]:SEED_PETS);const [apps,setApps]=useState([]);const [notes,setNotes]=useState([]);const [people,setPeople]=useState({});
const [user,setUser]=useState(null);const [authLoading,setAL]=useState(isConfigured);const [dataLoading,setDL]=useState(isConfigured);const [flash,setFlash]=useState(null);
useEffect(()=>{if(!flash)return;const t=setTimeout(()=>setFlash(null),6000);return()=>clearTimeout(t)},[flash]);
const loadAll=async()=>{if(!isConfigured)return;
 const [p,a,m,n,pp]=await Promise.all([supabase.from('pets').select('*').order('created_at',{ascending:false}),
  supabase.from('applications').select('*, agreements(*), follow_ups(*)').order('created_at',{ascending:false}),
  supabase.from('messages').select('*').order('created_at'),supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(50),
  supabase.from('public_profiles').select('*')]);
 const ppl=Object.fromEntries((pp.data||[]).map(x=>[x.id,x]));setPeople(ppl);
 setPets((p.data||[]).map(r=>({...r,ownerId:r.owner_id,ownerName:ppl[r.owner_id]?.name||'Unknown',ownerRole:ppl[r.owner_id]?.role,ownerVerified:ppl[r.owner_id]?.ngo_verified,video:r.video||''})));
 setApps((a.data||[]).map(r=>({...r,petId:r.pet_id,adopterId:r.adopter_id,adopterName:ppl[r.adopter_id]?.name||'Unknown',date:r.created_at.slice(0,10),agreement:one(r.agreements),followUps:r.follow_ups||[],
  messages:(m.data||[]).filter(x=>x.application_id===r.id).map(x=>({from:x.sender_id,name:ppl[x.sender_id]?.name,text:x.body,t:x.created_at}))})));
 setNotes(n.data||[]);setDL(false)};
const loadProfile=async session=>{if(!session){setUser(null);return}
 const {data}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();setUser(data?{...data,email:session.user.email}:null)};
useEffect(()=>{if(!isConfigured)return;
 supabase.auth.getSession().then(({data})=>loadProfile(data.session)).finally(()=>setAL(false));
 const {data:sub}=supabase.auth.onAuthStateChange((_e,session)=>{setTimeout(()=>loadProfile(session),0)});return()=>sub.subscription.unsubscribe()},[]);
useEffect(()=>{if(isConfigured&&!authLoading)loadAll()},[user?.id,authLoading]);
useEffect(()=>{if(!isConfigured||!user)return;const ch=supabase.channel('pc-'+user.id)
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},loadAll).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},loadAll).subscribe();
 return()=>{supabase.removeChannel(ch)}},[user?.id]);
/* run(): awaits a Supabase call; success message shown ONLY if the database accepted it */
const run=async(p,ok)=>{const {error}=await p;if(error){setFlash({m:error.message,ok:false});return error}if(ok)setFlash({m:ok,ok:true});await loadAll();return null};
const upload=async(bucket,f)=>{const path=`${user.id}/${crypto.randomUUID()}.${f.name.split('.').pop().toLowerCase()}`;
 const {error}=await supabase.storage.from(bucket).upload(path,f,{contentType:f.type});if(error)throw error;return path};
const api={pets,apps,notes,people,user,authLoading,dataLoading,flash,setFlash,run,reload:loadAll,upload,configured:isConfigured,
login:async(email,password)=>{if(!isConfigured)return NOCFG;const {error}=await supabase.auth.signInWithPassword({email,password});
 return error?{message:/confirm/i.test(error.message)?'Please confirm your email first.':'Invalid email or password'}:null},
register: async ({ name, email, password, role }) => {
  if (!isConfigured) return { error: NOCFG };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin + '/login',
      data: { name, role },
    },
  });

  return { data, error };
},
updateProfile:async d=>{const {error}=await supabase.from('profiles').update(d).eq('id',user.id);if(!error)setUser(u=>({...u,...d}));return error},
listProfiles:async()=>{const {data,error}=await supabase.from('profiles').select('id,name,email,role,city').order('created_at');return {data:data||[],error}},
grantRole:(id,role)=>supabase.rpc('grant_role',{target:id,new_role:role}),
addPet:async(d,files)=>{try{const photos=await Promise.all(files.photos.map(async f=>supabase.storage.from('pet-media').getPublicUrl(await upload('pet-media',f)).data.publicUrl));
 const video=files.video?supabase.storage.from('pet-media').getPublicUrl(await upload('pet-media',files.video)).data.publicUrl:null;
 const {data,error}=await supabase.from('pets').insert({...d,photos,video}).select('id').single();if(error)throw error;await loadAll();return {id:data.id}}catch(e){return {error:e}}},
apply:(petId,answers)=>run(supabase.from('applications').insert({pet_id:petId,answers}),'Application submitted'),
setStatus:(id,status)=>run(supabase.from('applications').update({status}).eq('id',id),'Application '+status.toLowerCase()),
sendMsg:(id,text)=>run(supabase.from('messages').insert({application_id:id,body:text})),
markRead:id=>run(supabase.from('notifications').update({read:true}).eq('id',id)),
pet:id=>pets.find(p=>p.id===id),person:id=>user&&id===user.id?user:people[id]||SEED_PEOPLE[id]||{name:'Unknown'}};
return <Ctx.Provider value={api}>{children}</Ctx.Provider>}
