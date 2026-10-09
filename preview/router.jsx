/* Hash router with the react-router-dom API subset PawConnect uses (preview build only) */
import React,{useState,useEffect,createContext,useContext} from 'react';
const ParamsCtx=createContext({});
const g=()=>(location.hash.slice(1)||'/').split('?')[0];
function useHash(){const [h,setH]=useState(g());useEffect(()=>{const f=()=>setH(g());addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);return h}
export const BrowserRouter=({children})=>children;
export const useParams=()=>useContext(ParamsCtx);
export const useNavigate=()=>to=>{location.hash=to};
export const Link=({to,className,children,...r})=><a href={'#'+to} className={className} {...r}>{children}</a>;
export const NavLink=({to,className,children})=>{const h=useHash();return <a href={'#'+to} className={typeof className==='function'?className({isActive:h===to}):className}>{children}</a>};
export const Navigate=({to})=>{useEffect(()=>{location.replace('#'+to)},[]);return null};
export const Route=()=>null;
export function Routes({children}){const h=useHash();useEffect(()=>{window.scrollTo(0,0)},[h]);let star=null;
for(const c of React.Children.toArray(children)){const pt=c.props.path;if(pt==='*'){star=c;continue}const names=[];
const re=new RegExp('^'+pt.replace(/:([^/]+)/g,(_,n)=>{names.push(n);return '([^/]+)'})+'/?$');const m=h.match(re);
if(m){const params={};names.forEach((n,i)=>params[n]=decodeURIComponent(m[i+1]));return <ParamsCtx.Provider value={params}>{c.props.element}</ParamsCtx.Provider>}}
return star?star.props.element:null}
