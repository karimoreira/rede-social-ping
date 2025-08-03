# ping, uma rede social minimalista

# instalação do projeto
```bash

npm install

# rodar os dois serviços de uma vez:
npm run setup (acesse: http://localhost:3000)
rm social.db && npm run init-db (para apagar o db e reiniciar banco)

# rodar separadamente:
npm run init-db
npm start (acesse: http://localhost:3000)
```

tive a ideia de desenvolver o ping há algumas semanas. uma rede social sem excesso de anúncios, excesso de informações e repetitivas... tudo isso gera uma experiência desgastante quando o que queremos é simplesmente interagir com nossos amigos. ping é uma rede social minimalista e focada em conexões humanas, sem monetização e com uma visualização limpa. essa é a primeira versão da rede social, estou aberto a sugestões, colaborações descontraídas e contribuições via pull requests

# linguagens
backend: node.js + express
banco: SQLite3
frontend: javascript
autenticação: bcryptjs, express-session 

# funcionalidades iniciais 
autenticação, 
feed de posts com direito a imagens,
likes/comentários,
visualizar perfis de usuário,
sistema de seguidores

# banco de dados
tabelas: users, posts, likes, comments, followers
o arquivo social.db será criado automaticamente na primeira execução do projeto

# imagens migradas do /upload pós testes para o banco de dados
agora armazeno as imagens diretamente no banco de dados SQLite como base64, mais simples, com backup, armazenamento seguro e sem depender de nada externo. para outros projetos maiores é melhor armazenar um S3 por exemplo e uma CDN de alta performance. neste projeto fiz uma otimização para as imagens com redimensionamento e conversão

# reposts/avatares
fallbacks e lógica para os reposts trazerem os avatares que quem reposta e não do usuário original
