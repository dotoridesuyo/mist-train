import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');const target=path.resolve(root,relative);if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);return res.end();}const data=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
const port=Number(process.env.PORT)||4173;
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
