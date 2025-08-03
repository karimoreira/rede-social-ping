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

tive a ideia de desenvolver o ping há algumas semanas, navegar pelas redes sociais atuais tem sido estranho, quase uma ressaca social. excesso de anúncios, informações em excesso e repetitivas... tudo isso gera uma experiência desgastante quando o que queremos é simplesmente interagir com nossos amigos. ping é uma rede social minimalista e focada em conexões humanas, sem monetização excessiva e com uma visualização limpa. essa é a primeira versão da rede social, estou aberto a sugestões, colaborações descontraídas e contribuições via pull requests

# linguagens
backend: node.js + express
banco: SQLite3
frontend: javascript
autenticação: bcryptjs, express-session 
upload: multer

# funcionalidades iniciais 
autenticação, 
feed de posts com direito a imagens,
likes/comentários,
visualizar perfis de usuário,
sistema de seguidores

# banco de dados
tabelas: users, posts, likes, comments, followers
o arquivo social.db será criado automaticamente na primeira execução do projeto