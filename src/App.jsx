import {Routes,Route,Link} from 'react-router-dom';import {Navbar,Guard} from './components.jsx';import {useStore} from './store.jsx';
import * as P from './pages.jsx';
export default function App(){const {flash,setFlash}=useStore();const A=['adopter'],O=['owner','ngo','volunteer','admin'];
return <><Navbar/>{flash&&<div role="status" className={`mx-auto mt-3 flex max-w-6xl justify-between rounded-xl px-4 py-2 text-sm ${flash.ok?'bg-green-100 text-green-900':'bg-red-100 text-red-800'}`}><span>{flash.m}</span><button onClick={()=>setFlash(null)}>✕</button></div>}<Routes>
<Route path="/" element={<P.Home/>}/><Route path="/browse" element={<P.Browse/>}/><Route path="/pets/:id" element={<P.PetDetails/>}/>
<Route path="/login" element={<P.Auth/>}/>
<Route path="/dashboard" element={<Guard roles={A}><P.AdopterDash/></Guard>}/>
<Route path="/applications" element={<Guard roles={A}><P.MyApps/></Guard>}/>
<Route path="/apply/:id" element={<Guard roles={A}><P.Apply/></Guard>}/>
<Route path="/admin" element={<Guard roles={['admin']}><P.AdminPanel/></Guard>}/>
<Route path="/owner" element={<Guard roles={O}><P.OwnerDash/></Guard>}/>
<Route path="/notifications" element={<Guard><P.Notifications/></Guard>}/>
<Route path="/community" element={<P.Community/>}/><Route path="/support" element={<P.Support/>}/>
<Route path="/add-pet" element={<Guard roles={['owner','ngo','admin']}><P.AddPet/></Guard>}/>
<Route path="/profile" element={<Guard><P.Profile/></Guard>}/>
<Route path="*" element={<div className="p-20 text-center">Page not found. <Link className="underline" to="/">Home</Link></div>}/></Routes>
<footer className="mt-16 border-t border-cream-200 py-6 text-center text-sm text-sage-600">© PawConnect · Accounts and data stored in Supabase (requires configuration)</footer></>}
