# ping, uma rede social minimalista

# instalação do projeto
```bash

cd redesocial
npm install

# rodar os dois serviços de uma vez:
npm run setup (acesse: http://localhost:3000)
rm social.db && npm run init-db (para apagar o db e reiniciar banco)

# rodar separadamente:
npm run init-db
npm start (acesse: http://localhost:3000)
```

tive a ideia de desenvolver o ping depois de sentir uma sensação de sobrecarga ao navegar pelas redes sociais atuais. O excesso de anúncios, conteúdo saturado e a mesma informação em excesso criam uma experiência desgastante e poluída quando o que queremos na maioria das vezes é apenas interagir com nossos amigos... ping é uma rede social minimalista, focada apenas no essencial... conexões humanas e sem monetizações em excesso

# linguagens
backend: node.js + express
banco: SQLite3
frontend: javascript
autenticação: bcryptjs, express-session 
upload: multer

# funcionalidades iniciais 
- autenticação
- feed de posts com direito a imagens
- likes/comentários
- perfis de usuário
- sistema de seguidores
- interface responsiva 

# banco de dados
tabelas: users, posts, likes, comments, followers
o arquivo social.db será criado automaticamente na primeira execução