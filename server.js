const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const session = require('express-session')
const multer = require('multer')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

const db = new sqlite3.Database('./social.db')

db.run("PRAGMA timezone = 'America/Sao_Paulo'")

function getCurrentLocalDateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

app.use(express.json())
app.use(express.static('public'))
app.use(cors())
app.use(session({
    secret: 'social-network-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}))

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Apenas imagens são permitidas!'))
        }
    }
})

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        bio TEXT,
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        image TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (post_id) REFERENCES posts (id),
        UNIQUE(user_id, post_id)
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (post_id) REFERENCES posts (id)
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS followers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        following_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users (id),
        FOREIGN KEY (following_id) REFERENCES users (id),
        UNIQUE(follower_id, following_id)
    )`)

    db.run(`CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        original_post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (original_post_id) REFERENCES posts (id),
        UNIQUE(user_id, original_post_id)
    )`)
})

const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next()
    } else {
        res.status(401).json({ error: 'Não autorizado' })
    }
}

app.post('/api/register', async (req, res) => {
    const { username, email, password, fullName } = req.body
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        
        db.run(
            'INSERT INTO users (username, email, password, full_name, created_at) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, fullName, getCurrentLocalDateTime()],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Usuário ou email já existe' })
                    }
                    return res.status(500).json({ error: 'Erro ao registrar usuário' })
                }
                
                req.session.userId = this.lastID
                res.json({ 
                    success: true, 
                    user: { id: this.lastID, username, email, fullName }
                })
            }
        )
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

app.post('/api/login', (req, res) => {
    const { username, password } = req.body
    
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' })
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' })
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Senha incorreta' })
        }
        
        req.session.userId = user.id
        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                fullName: user.full_name,
                avatar: user.avatar
            }
        })
    })
})

app.post('/api/logout', (req, res) => {
    req.session.destroy()
    res.json({ success: true })
})

app.post('/api/posts', requireAuth, upload.single('image'), (req, res) => {
    const { content } = req.body
    const userId = req.session.userId
    const image = req.file ? `/uploads/${req.file.filename}` : null
    
    db.run(
        'INSERT INTO posts (user_id, content, image, created_at) VALUES (?, ?, ?, ?)',
        [userId, content, image, getCurrentLocalDateTime()],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar post' })
            }
            res.json({ success: true, postId: this.lastID })
        }
    )
})

app.get('/api/posts', (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const userId = req.query.user_id
    const currentUserId = req.session.userId || null
    
    console.log('Buscando posts - Page:', page, 'Limit:', limit, 'Current User ID:', currentUserId)
    
    let query = `
        SELECT 
            p.*, 
            u.username, 
            u.full_name, 
            u.avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
            0 as isShared,
            'original' as post_type,
            p.created_at as sort_date,
            NULL as shared_by_user_id,
            NULL as shared_by_username,
            NULL as shared_by_full_name,
            NULL as shared_by_avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        
        UNION ALL
        
        SELECT 
            p.*, 
            u.username, 
            u.full_name, 
            u.avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
            1 as isShared,
            'shared' as post_type,
            s.created_at as sort_date,
            s.user_id as shared_by_user_id,
            (SELECT username FROM users WHERE id = s.user_id) as shared_by_username,
            (SELECT full_name FROM users WHERE id = s.user_id) as shared_by_full_name,
            (SELECT avatar FROM users WHERE id = s.user_id) as shared_by_avatar
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN shares s ON p.id = s.original_post_id
        WHERE s.user_id = ?
    `
    
    let params = [currentUserId]
    
    if (userId) {
        query = `
            SELECT 
                p.*, 
                u.username, 
                u.full_name, 
                u.avatar,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                0 as isShared,
                'original' as post_type,
                p.created_at as sort_date,
                NULL as shared_by_user_id,
                NULL as shared_by_username,
                NULL as shared_by_full_name,
                NULL as shared_by_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            
            UNION ALL
            
            SELECT 
                p.*, 
                u.username, 
                u.full_name, 
                u.avatar,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                1 as isShared,
                'shared' as post_type,
                s.created_at as sort_date,
                s.user_id as shared_by_user_id,
                (SELECT username FROM users WHERE id = s.user_id) as shared_by_username,
                (SELECT full_name FROM users WHERE id = s.user_id) as shared_by_full_name,
                (SELECT avatar FROM users WHERE id = s.user_id) as shared_by_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN shares s ON p.id = s.original_post_id
            WHERE s.user_id = ? AND p.user_id = ?
        `
        params = [userId, currentUserId, userId]
    }
    
    query += ' ORDER BY sort_date DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)
    
    console.log('Query SQL:', query)
    console.log('Parâmetros:', params)
    
    db.all(query, params, (err, posts) => {
        if (err) {
            console.error('Erro ao buscar posts:', err)
            return res.status(500).json({ error: 'Erro ao buscar posts' })
        }
        
        if (currentUserId) {
            db.get('SELECT username, full_name, avatar FROM users WHERE id = ?', [currentUserId], (err, user) => {
                if (!err && user) {
                    console.log('Dados do usuário atual (userteste):', user)
                }
            })
        }
        
        console.log('Posts encontrados:', posts.length)
        if (posts.length > 0) {
            console.log('Primeiro post:', {
                id: posts[0].id,
                isShared: posts[0].isShared,
                post_type: posts[0].post_type,
                user_id: posts[0].user_id,
                username: posts[0].username,
                shared_by_username: posts[0].shared_by_username,
                shared_by_full_name: posts[0].shared_by_full_name,
                shared_by_avatar: posts[0].shared_by_avatar
            })
        }
        
        res.json(posts)
    })
})

app.get('/api/posts/:postId', (req, res) => {
    const { postId } = req.params
    const currentUserId = req.session.userId
    
    const query = `
        SELECT p.*, u.username, u.full_name as user_name, u.avatar as user_avatar,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
               CASE WHEN l.user_id IS NOT NULL THEN 1 ELSE 0 END as isLiked,
               CASE WHEN s.user_id IS NOT NULL THEN 1 ELSE 0 END as isShared
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = ?
        LEFT JOIN shares s ON p.id = s.original_post_id AND s.user_id = ?
        WHERE p.id = ?
    `
    
    db.get(query, [currentUserId, currentUserId, postId], (err, post) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar post' })
        }
        
        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado' })
        }
        
        const formattedPost = {
            ...post,
            isLiked: post.isLiked === 1,
            isShared: post.isShared === 1
        }
        
        res.json(formattedPost)
    })
})

app.post('/api/posts/:postId/like', requireAuth, (req, res) => {
    const { postId } = req.params
    const userId = req.session.userId
    
    db.run(
        'INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)',
        [userId, postId, getCurrentLocalDateTime()],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Post já curtido' })
                }
                return res.status(500).json({ error: 'Erro ao curtir post' })
            }
            
            db.run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId])
            res.json({ success: true })
        }
    )
})

app.delete('/api/posts/:postId/like', requireAuth, (req, res) => {
    const { postId } = req.params
    const userId = req.session.userId
    
    db.run(
        'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
        [userId, postId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao descurtir post' })
            }
            
            db.run('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', [postId])
            res.json({ success: true })
        }
    )
})

app.post('/api/posts/:postId/comments', requireAuth, (req, res) => {
    const { postId } = req.params
    const { content } = req.body
    const userId = req.session.userId
    
    db.run(
        'INSERT INTO comments (user_id, post_id, content, created_at) VALUES (?, ?, ?, ?)',
        [userId, postId, content, getCurrentLocalDateTime()],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criar comentário' })
            }
            
            db.run('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId])
            res.json({ success: true, commentId: this.lastID })
        }
    )
})

app.get('/api/posts/:postId/comments', (req, res) => {
    const { postId } = req.params
    
    const query = `
        SELECT c.*, u.username, u.full_name, u.avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `
    
    db.all(query, [postId], (err, comments) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar comentários' })
        }
        res.json(comments)
    })
})

app.delete('/api/posts/:postId', requireAuth, (req, res) => {
    const { postId } = req.params
    const userId = req.session.userId
    
    db.get('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, userId], (err, post) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno do servidor' })
        }
        
        if (!post) {
            return res.status(404).json({ error: 'Post não encontrado ou você não tem permissão para excluí-lo' })
        }
        
        if (post.image) {
            const fs = require('fs')
            const imagePath = path.join(__dirname, 'public', post.image)
            
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Erro ao excluir arquivo de imagem:', err)
                    }
                })
            }
        }
        
        db.run('DELETE FROM likes WHERE post_id = ?', [postId], (err) => {
            if (err) {
                console.error('Erro ao excluir likes:', err)
            }
        })
        
        db.run('DELETE FROM comments WHERE post_id = ?', [postId], (err) => {
            if (err) {
                console.error('Erro ao excluir comentários:', err)
            }
        })
        
        db.run('DELETE FROM posts WHERE id = ?', [postId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao excluir post' })
            }
            
            res.json({ success: true, message: 'Post excluído com sucesso' })
        })
    })
})

app.post('/api/posts/:postId/share', requireAuth, (req, res) => {
    const { postId } = req.params
    const userId = req.session.userId
    
    console.log('Tentativa de compartilhamento - Post ID:', postId, 'User ID:', userId)
    
    db.get('SELECT * FROM posts WHERE id = ?', [postId], (err, originalPost) => {
        if (err) {
            console.error('Erro ao buscar post original:', err)
            return res.status(500).json({ error: 'Erro interno do servidor' })
        }
        
        if (!originalPost) {
            console.log('Post não encontrado:', postId)
            return res.status(404).json({ error: 'Post não encontrado' })
        }
        
        console.log('Post original encontrado:', originalPost)
        
        db.get('SELECT * FROM shares WHERE user_id = ? AND original_post_id = ?', [userId, postId], (err, existingShare) => {
            if (err) {
                console.error('Erro ao verificar compartilhamento existente:', err)
                return res.status(500).json({ error: 'Erro interno do servidor' })
            }
            
            if (existingShare) {
                console.log('Usuário já compartilhou este post')
                return res.status(400).json({ error: 'Você já compartilhou este post' })
            }
            
            console.log('Criando novo compartilhamento...')
            
            db.run('INSERT INTO shares (user_id, original_post_id, created_at) VALUES (?, ?, ?)', 
                [userId, postId, getCurrentLocalDateTime()], function(err) {
                if (err) {
                    console.error('Erro ao inserir compartilhamento:', err)
                    return res.status(500).json({ error: 'Erro ao compartilhar post' })
                }
                
                console.log('Compartilhamento criado com sucesso. Share ID:', this.lastID)
                res.json({ success: true, message: 'Post compartilhado com sucesso' })
            })
        })
    })
})

app.delete('/api/posts/:postId/share', requireAuth, (req, res) => {
    const { postId } = req.params
    const userId = req.session.userId
    
    console.log('Tentativa de remover compartilhamento - Post ID:', postId, 'User ID:', userId)
    
    db.run('DELETE FROM shares WHERE user_id = ? AND original_post_id = ?', [userId, postId], function(err) {
        if (err) {
            console.error('Erro ao remover compartilhamento:', err)
            return res.status(500).json({ error: 'Erro interno do servidor' })
        }
        
        console.log('Linhas afetadas na remoção:', this.changes)
        
        if (this.changes === 0) {
            console.log('Compartilhamento não encontrado para remoção')
            return res.status(404).json({ error: 'Compartilhamento não encontrado' })
        }
        
        console.log('Compartilhamento removido com sucesso')
        res.json({ success: true, message: 'Compartilhamento removido com sucesso' })
    })
})

app.get('/api/user/shares', requireAuth, (req, res) => {
    const userId = req.session.userId
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    
    const query = `
        SELECT p.*, u.username, u.full_name, u.avatar,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
               1 as isShared
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN shares s ON p.id = s.original_post_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
    `
    
    db.all(query, [userId, limit, offset], (err, posts) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar posts compartilhados' })
        }
        res.json(posts)
    })
})

app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autorizado' })
    }
    
    db.get('SELECT id, username, email, full_name, bio, avatar FROM users WHERE id = ?', 
        [req.session.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário' })
        }
        res.json(user)
    })
})

app.put('/api/user', requireAuth, upload.single('avatar'), (req, res) => {
    const { fullName, bio, removeAvatar } = req.body
    const userId = req.session.userId
    const avatar = req.file ? `/uploads/${req.file.filename}` : null
    
    let query = 'UPDATE users SET full_name = ?, bio = ?'
    let params = [fullName, bio]
    
    if (removeAvatar === 'true' || removeAvatar === true) {
        query += ', avatar = NULL'
    } else if (avatar) {
        query += ', avatar = ?'
        params.push(avatar)
    }
    
    query += ' WHERE id = ?'
    params.push(userId)
    
    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar perfil' })
        }
        res.json({ success: true })
    })
})

app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params
    const currentUserId = req.session.userId
    
    const query = `
        SELECT u.id, u.username, u.full_name, u.bio, u.avatar,
               (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
               (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
               CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END as isFollowing
        FROM users u
        LEFT JOIN followers f ON u.id = f.following_id AND f.follower_id = ?
        WHERE u.id = ?
    `
    
    db.get(query, [currentUserId, userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuário' })
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' })
        }
        
        const formattedUser = {
            ...user,
            isFollowing: user.isFollowing === 1
        }
        
        res.json(formattedUser)
    })
})

app.get('/api/user/:userId/stats', (req, res) => {
    const { userId } = req.params
    
    db.get('SELECT COUNT(*) as posts_count FROM posts WHERE user_id = ?', [userId], (err, postsResult) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar estatísticas' })
        }
        
        db.get('SELECT COUNT(*) as followers_count FROM followers WHERE following_id = ?', [userId], (err, followersResult) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar estatísticas' })
            }
            
            db.get('SELECT COUNT(*) as following_count FROM followers WHERE follower_id = ?', [userId], (err, followingResult) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao buscar estatísticas' })
                }
                
                res.json({
                    posts_count: postsResult.posts_count,
                    followers_count: followersResult.followers_count,
                    following_count: followingResult.following_count
                })
            })
        })
    })
})

app.get('/api/users', (req, res) => {
    const currentUserId = req.session.userId
    
    const query = `
        SELECT u.id, u.username, u.full_name, u.bio, u.avatar,
               (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count,
               (SELECT COUNT(*) FROM followers WHERE following_id = u.id) as followers_count,
               CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END as isFollowing
        FROM users u
        LEFT JOIN followers f ON u.id = f.following_id AND f.follower_id = ?
        WHERE u.id != ?
        ORDER BY u.username ASC
    `
    
    db.all(query, [currentUserId, currentUserId], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários' })
        }
        
        const formattedUsers = users.map(user => ({
            ...user,
            isFollowing: user.isFollowing === 1
        }))
        
        res.json(formattedUsers)
    })
})

app.post('/api/user/:userId/follow', requireAuth, (req, res) => {
    const { userId } = req.params
    const followerId = req.session.userId
    
    if (parseInt(userId) === followerId) {
        return res.status(400).json({ error: 'Você não pode seguir a si mesmo' })
    }
    
    db.run(
        'INSERT INTO followers (follower_id, following_id, created_at) VALUES (?, ?, ?)',
        [followerId, userId, getCurrentLocalDateTime()],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Você já segue este usuário' })
                }
                return res.status(500).json({ error: 'Erro ao seguir usuário' })
            }
            res.json({ success: true })
        }
    )
})

app.delete('/api/user/:userId/follow', requireAuth, (req, res) => {
    const { userId } = req.params
    const followerId = req.session.userId
    
    db.run(
        'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
        [followerId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao deixar de seguir usuário' })
            }
            res.json({ success: true })
        }
    )
})

app.get('/api/search', requireAuth, (req, res) => {
    const { q: query, filter = 'all' } = req.query
    const currentUserId = req.session.userId
    
    if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query de pesquisa é obrigatória' })
    }
    
    const searchTerm = `%${query.trim()}%`
    const results = { users: [], posts: [], topics: [] }
    
    if (filter === 'all' || filter === 'users') {
        const userQuery = `
            SELECT u.id, u.username, u.full_name, u.bio, u.avatar,
                   CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END as isFollowing
            FROM users u
            LEFT JOIN followers f ON u.id = f.following_id AND f.follower_id = ?
            WHERE (u.username LIKE ? OR u.full_name LIKE ? OR u.bio LIKE ?)
            AND u.id != ?
            ORDER BY u.username
            LIMIT 10
        `
        
        db.all(userQuery, [currentUserId, searchTerm, searchTerm, searchTerm, currentUserId], (err, users) => {
            if (!err) {
                results.users = users.map(user => ({
                    ...user,
                    isFollowing: user.isFollowing === 1
                }))
            }
            
            if (filter === 'all' || filter === 'posts') {
                const postQuery = `
                    SELECT p.*, u.username, u.full_name as user_name, u.avatar as user_avatar
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    WHERE p.content LIKE ?
                    ORDER BY p.created_at DESC
                    LIMIT 10
                `
                
                db.all(postQuery, [searchTerm], (err, posts) => {
                    if (!err) {
                        results.posts = posts
                    }
                    
                    if (filter === 'all' || filter === 'topics') {
                        const topicQuery = `
                            SELECT 
                                SUBSTR(content, INSTR(content, '#') + 1, 
                                       CASE 
                                           WHEN INSTR(SUBSTR(content, INSTR(content, '#') + 1), ' ') > 0 
                                           THEN INSTR(SUBSTR(content, INSTR(content, '#') + 1), ' ') - 1
                                           ELSE LENGTH(SUBSTR(content, INSTR(content, '#') + 1))
                                       END) as topic_name,
                                COUNT(*) as count
                            FROM posts 
                            WHERE content LIKE '%#%' 
                            AND content LIKE ?
                            GROUP BY topic_name
                            HAVING topic_name != ''
                            ORDER BY count DESC
                            LIMIT 5
                        `
                        
                        db.all(topicQuery, [searchTerm], (err, topics) => {
                            if (!err) {
                                results.topics = topics.map(topic => ({
                                    name: topic.topic_name,
                                    count: topic.count
                                }))
                            }
                            
                            res.json(results)
                        })
                    } else {
                        res.json(results)
                    }
                })
            } else {
                res.json(results)
            }
        })
    } else {
        const postQuery = `
            SELECT p.*, u.username, u.full_name as user_name, u.avatar as user_avatar
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.content LIKE ?
            ORDER BY p.created_at DESC
            LIMIT 10
        `
        
        db.all(postQuery, [searchTerm], (err, posts) => {
            if (!err) {
                results.posts = posts
            }
            
            if (filter === 'topics') {
                const topicQuery = `
                    SELECT 
                        SUBSTR(content, INSTR(content, '#') + 1, 
                               CASE 
                                   WHEN INSTR(SUBSTR(content, INSTR(content, '#') + 1), ' ') > 0 
                                   THEN INSTR(SUBSTR(content, INSTR(content, '#') + 1), ' ') - 1
                                   ELSE LENGTH(SUBSTR(content, INSTR(content, '#') + 1))
                               END) as topic_name,
                        COUNT(*) as count
                    FROM posts 
                    WHERE content LIKE '%#%' 
                    AND content LIKE ?
                    GROUP BY topic_name
                    HAVING topic_name != ''
                    ORDER BY count DESC
                    LIMIT 5
                `
                
                db.all(topicQuery, [searchTerm], (err, topics) => {
                    if (!err) {
                        results.topics = topics.map(topic => ({
                            name: topic.topic_name,
                            count: topic.count
                        }))
                    }
                    res.json(results)
                })
            } else {
                res.json(results)
            }
        })
    }
})

app.get('/api/trending-topics', requireAuth, (req, res) => {
    const query = `
        SELECT 
            SUBSTR(content, INSTR(content, '#') + 1, 
                   CASE 
                       WHEN INSTR(SUBSTR(content, INSTR(content, '#') + 1), ' ') > 0 
                       THEN INSTR(SUBSTR(content, INSTR(content, '#') + 1), ' ') - 1
                       ELSE LENGTH(SUBSTR(content, INSTR(content, '#') + 1))
                   END) as topic_name,
            COUNT(*) as count
        FROM posts 
        WHERE content LIKE '%#%' 
        AND created_at >= datetime('now', '-7 days')
        GROUP BY topic_name
        HAVING topic_name != ''
        ORDER BY count DESC
        LIMIT 10
    `
    
    db.all(query, [], (err, topics) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar temas em alta' })
        }
        
        const formattedTopics = topics.map(topic => ({
            name: topic.topic_name,
            count: topic.count
        }))
        
        res.json(formattedTopics)
    })
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => {
    console.log(`servidor rodando na porta ${PORT}`)
    console.log(`acesse: http://localhost:${PORT}`)
}) 