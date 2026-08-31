const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export async function api(path, options={}){const res=await fetch(`${API}${path}`,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});if(!res.ok)throw new Error(await res.text());return res.json();}
