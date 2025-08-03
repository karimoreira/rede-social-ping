const API_BASE = '/api';
let currentUser = null;
let currentPage = 1;
let isLoading = false;

const elements = {
    authSection: document.getElementById('authSection'),
    blogSection: document.getElementById('blogSection'),
    profileSection: document.getElementById('profileSection'),
    
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    
    navLinks: document.querySelectorAll('.nav-link'),
    userAvatar: document.getElementById('userAvatar'),
    dropdownMenu: document.getElementById('dropdownMenu'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    postsFeed: document.getElementById('postsFeed'),
    postContent: document.getElementById('postContent'),
    postImage: document.getElementById('postImage'),
    createPostBtn: document.getElementById('createPostBtn'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    removeImage: document.getElementById('removeImage'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    
    createPostAvatar: document.getElementById('createPostAvatar'),
    avatarImg: document.getElementById('avatarImg'),
    profilePosts: document.getElementById('profilePosts'),
    editAvatarBtn: document.getElementById('editAvatarBtn'),
    
    avatarFallback: document.getElementById('avatarFallback'),
    createPostAvatarFallback: document.getElementById('createPostAvatarFallback'),
    profileAvatarFallback: document.getElementById('profileAvatarFallback'),
    
    avatarModalOverlay: document.getElementById('avatarModalOverlay'),
    avatarModal: document.getElementById('avatarModal'),
    avatarModalClose: document.getElementById('avatarModalClose'),
    currentAvatarImg: document.getElementById('currentAvatarImg'),
    avatarUpload: document.getElementById('avatarUpload'),
    avatarPreview: document.getElementById('avatarPreview'),
    avatarPreviewImg: document.getElementById('avatarPreviewImg'),
    removeAvatar: document.getElementById('removeAvatar'),
    removeCurrentAvatarBtn: document.getElementById('removeCurrentAvatarBtn'),
    saveAvatarBtn: document.getElementById('saveAvatarBtn'),
    cancelAvatarBtn: document.getElementById('cancelAvatarBtn'),
    
    modalOverlay: document.getElementById('modalOverlay'),
    modal: document.getElementById('modal'),
    modalTitle: document.getElementById('modalTitle'),
    modalContent: document.getElementById('modalContent'),
    modalClose: document.getElementById('modalClose'),
    
    loadingSpinner: document.getElementById('loadingSpinner'),
    toastContainer: document.getElementById('toastContainer')
};

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchAuthTab(tab);
        });
    });
    
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
    
    elements.userAvatar.addEventListener('click', toggleDropdown);
    document.addEventListener('click', (e) => {
        if (!elements.userAvatar.contains(e.target) && !elements.dropdownMenu.contains(e.target)) {
            hideDropdown();
        }
    });
    
    const profileLink = document.getElementById('profileLink');
    const logoutBtn = document.getElementById('logoutBtn');
    
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideDropdown();
        switchSection('profile');
    });
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideDropdown();
        handleLogout();
    });
    
    elements.postImage.addEventListener('change', handleImagePreview);
    elements.removeImage.addEventListener('click', removeImagePreview);
}

function setupEventListeners() {
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    elements.createPostBtn.addEventListener('click', createPost);
    
    elements.loadMoreBtn.addEventListener('click', loadMorePosts);
    
    elements.editAvatarBtn.addEventListener('click', openAvatarModal);
    elements.avatarUpload.addEventListener('change', handleAvatarPreview);
    elements.removeAvatar.addEventListener('click', removeAvatarPreview);
    elements.removeCurrentAvatarBtn.addEventListener('click', removeCurrentAvatar);
    elements.saveAvatarBtn.addEventListener('click', saveAvatar);
    elements.cancelAvatarBtn.addEventListener('click', closeAvatarModal);
    elements.avatarModalClose.addEventListener('click', closeAvatarModal);
    
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });
    
    elements.avatarModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.avatarModalOverlay) {
            closeAvatarModal();
        }
    });
    
    const editProfileModalOverlay = document.getElementById('editProfileModalOverlay');
    const editProfileModalClose = document.getElementById('editProfileModalClose');
    const cancelEditProfile = document.getElementById('cancelEditProfile');
    const editProfileForm = document.getElementById('editProfileForm');
    
    editProfileModalClose.addEventListener('click', closeEditProfileModal);
    cancelEditProfile.addEventListener('click', closeEditProfileModal);
    editProfileModalOverlay.addEventListener('click', (e) => {
        if (e.target === editProfileModalOverlay) {
            closeEditProfileModal();
        }
    });
    
    editProfileForm.addEventListener('submit', handleEditProfile);
    
    const editProfileBtn = document.getElementById('editProfileBtn');
    editProfileBtn.addEventListener('click', openEditProfileModal);
}

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_BASE}/user`);
        if (response.ok) {
            currentUser = await response.json();
            showBlog();
            loadPosts();
            updateUserInterface();
        } else {
            showAuth();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        showAuth();
    }
}

function switchSection(section) {
    elements.navLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    switch (section) {
        case 'feed':
            showBlog();
            loadPosts();
            break;
        case 'profile':
            showProfile();
            loadProfileData();
            loadUserPosts();
            break;
        case 'explore':
            showExplore();
            loadTrendingTopics();
            break;
    }
}

function showAuth() {
    elements.authSection.classList.remove('hidden');
    elements.blogSection.classList.add('hidden');
    elements.profileSection.classList.add('hidden');
    document.getElementById('exploreSection').classList.add('hidden');
    
    const userMenu = document.querySelector('.user-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (userMenu) {
        userMenu.style.display = 'none';
    }
    if (navMenu) {
        navMenu.style.display = 'none';
    }
}

function showBlog() {
    elements.authSection.classList.add('hidden');
    elements.blogSection.classList.remove('hidden');
    elements.profileSection.classList.add('hidden');
    document.getElementById('exploreSection').classList.add('hidden');
}

function showProfile() {
    elements.authSection.classList.add('hidden');
    elements.blogSection.classList.add('hidden');
    elements.profileSection.classList.remove('hidden');
    document.getElementById('exploreSection').classList.add('hidden');
}

function showExplore() {
    elements.authSection.classList.add('hidden');
    elements.blogSection.classList.add('hidden');
    elements.profileSection.classList.add('hidden');
    document.getElementById('exploreSection').classList.remove('hidden');
    
    loadExploreContent();
}

function switchAuthTab(tab) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    authForms.forEach(form => form.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Login realizado com sucesso!', 'success');
            showBlog();
            loadPosts();
            updateUserInterface();
        } else {
            showToast(data.error || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('registerFullName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!fullName || !username || !email || !password) {
        showToast('Preencha todos os campos', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showToast('Conta criada com sucesso!', 'success');
            showBlog();
            loadPosts();
            updateUserInterface();
        } else {
            showToast(data.error || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE}/logout`, { method: 'POST' });
        currentUser = null;
        showAuth();
        hideDropdown();
        showToast('Logout realizado com sucesso', 'success');
    } catch (error) {
        showToast('Erro ao fazer logout', 'error');
    }
}

function updateUserInterface() {
    const userMenu = document.querySelector('.user-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!currentUser) {
        if (userMenu) {
            userMenu.style.display = 'none';
        }
        if (navMenu) {
            navMenu.style.display = 'none';
        }
        return;
    }
    
    if (userMenu) {
        userMenu.style.display = 'flex';
    }
    if (navMenu) {
        navMenu.style.display = 'flex';
    }
    
    if (currentUser.avatar) {
        elements.avatarImg.src = currentUser.avatar;
        elements.avatarImg.style.display = 'block';
        elements.avatarFallback.style.display = 'none';
        elements.avatarImg.onerror = function() {
            this.style.display = 'none';
            elements.avatarFallback.style.display = 'flex';
        };
    } else {
        elements.avatarImg.style.display = 'none';
        elements.avatarFallback.style.display = 'flex';
        const userInitial = (currentUser.full_name || currentUser.username).charAt(0).toUpperCase();
        elements.avatarFallback.innerHTML = `<i class="fas fa-user"></i>`;
    }
    
    if (currentUser.avatar) {
        elements.createPostAvatar.src = currentUser.avatar;
        elements.createPostAvatar.style.display = 'block';
        elements.createPostAvatarFallback.style.display = 'none';
        elements.createPostAvatar.onerror = function() {
            this.style.display = 'none';
            elements.createPostAvatarFallback.style.display = 'flex';
        };
    } else {
        elements.createPostAvatar.style.display = 'none';
        elements.createPostAvatarFallback.style.display = 'flex';
        const userInitial = (currentUser.full_name || currentUser.username).charAt(0).toUpperCase();
        elements.createPostAvatarFallback.innerHTML = `<i class="fas fa-user"></i>`;
    }
    
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        if (currentUser.avatar) {
            profileAvatar.src = currentUser.avatar;
            profileAvatar.style.display = 'block';
            elements.profileAvatarFallback.style.display = 'none';
            profileAvatar.onerror = function() {
                this.style.display = 'none';
                elements.profileAvatarFallback.style.display = 'flex';
            };
        } else {
            profileAvatar.style.display = 'none';
            elements.profileAvatarFallback.style.display = 'flex';
            const userInitial = (currentUser.full_name || currentUser.username).charAt(0).toUpperCase();
            elements.profileAvatarFallback.innerHTML = `<i class="fas fa-user"></i>`;
        }
    }
    
    const profileUserName = document.getElementById('profileUserName');
    const profileUserBio = document.getElementById('profileUserBio');
    
    if (profileUserName) {
        profileUserName.textContent = currentUser.full_name || currentUser.username;
    }
    
    if (profileUserBio) {
        profileUserBio.textContent = currentUser.bio || 'sem bio';
    }
}

function toggleDropdown() {
    elements.dropdownMenu.classList.toggle('show');
}

function hideDropdown() {
    elements.dropdownMenu.classList.remove('show');
}

function openAvatarModal() {
    if (currentUser.avatar) {
        elements.currentAvatarImg.src = currentUser.avatar;
        elements.currentAvatarImg.style.display = 'block';
        elements.removeCurrentAvatarBtn.style.display = 'block';
    } else {
        elements.currentAvatarImg.style.display = 'none';
        elements.removeCurrentAvatarBtn.style.display = 'none';
    }
    elements.avatarModalOverlay.classList.remove('hidden');
}

function closeAvatarModal() {
    elements.avatarModalOverlay.classList.add('hidden');
    removeAvatarPreview();
}

function handleAvatarPreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.avatarPreviewImg.src = e.target.result;
            elements.avatarPreview.style.display = 'block';
            elements.saveAvatarBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

function removeAvatarPreview() {
    elements.avatarUpload.value = '';
    elements.avatarPreview.style.display = 'none';
    elements.avatarPreviewImg.src = '';
    elements.saveAvatarBtn.disabled = true;
}

async function saveAvatar() {
    const file = elements.avatarUpload.files[0];
    if (!file) {
        showToast('Selecione uma imagem', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch(`${API_BASE}/user`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            
            const userResponse = await fetch(`${API_BASE}/user`);
            if (userResponse.ok) {
                currentUser = await userResponse.json();
                updateUserInterface();
            }
            
            showToast('Avatar atualizado com sucesso!', 'success');
            closeAvatarModal();
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao atualizar avatar', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

async function removeCurrentAvatar() {
    if (!currentUser.avatar) {
        showToast('Você não tem um avatar para remover', 'error');
        return;
    }
    
    if (!confirm('Tem certeza que deseja remover seu avatar?')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                removeAvatar: true
            })
        });
        
        if (response.ok) {
            const userResponse = await fetch(`${API_BASE}/user`);
            if (userResponse.ok) {
                currentUser = await userResponse.json();
                updateUserInterface();
            }
            
            showToast('Avatar removido com sucesso!', 'success');
            closeAvatarModal();
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao remover avatar', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

async function createPost() {
    const content = elements.postContent.value.trim();
    const imageFile = elements.postImage.files[0];
    
    if (!content && !imageFile) {
        showToast('Adicione conteúdo ou uma imagem', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('content', content);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Post criado com sucesso!', 'success');
            elements.postContent.value = '';
            elements.postImage.value = '';
            removeImagePreview();
            loadPosts();
        } else {
            showToast(data.error || 'Erro ao criar post', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

async function loadPosts(page = 1) {
    if (isLoading) return;
    
    isLoading = true;
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/posts?page=${page}&limit=10`);
        const posts = await response.json();
        
        if (page === 1) {
            elements.postsFeed.innerHTML = '';
            currentPage = 1;
        }
        
        if (posts.length > 0) {
            posts.forEach(post => {
                const postElement = createPostElement(post);
                elements.postsFeed.appendChild(postElement);
            });
            
            currentPage = page;
            elements.loadMoreBtn.style.display = 'block';
        } else {
            if (page === 1) {
                elements.postsFeed.innerHTML = '<p class="no-posts">Nenhum post encontrado</p>';
            }
            elements.loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        showToast('Erro ao carregar posts', 'error');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

async function loadUserPosts() {
    if (!currentUser) return;
    
    try {
        const [originalPostsResponse, sharedPostsResponse] = await Promise.all([
            fetch(`${API_BASE}/posts?user_id=${currentUser.id}&limit=20`),
            fetch(`${API_BASE}/user/shares`)
        ]);
        
        const originalPosts = await originalPostsResponse.json();
        const sharedPosts = await sharedPostsResponse.json();
        
        elements.profilePosts.innerHTML = '';
        
        const allPosts = [
            ...originalPosts.map(post => ({ ...post, isOriginal: true })),
            ...sharedPosts.map(post => ({ ...post, isShared: true }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (allPosts.length > 0) {
            allPosts.forEach(post => {
                const postElement = createPostElement(post);
                elements.profilePosts.appendChild(postElement);
            });
        } else {
            elements.profilePosts.innerHTML = '<p class="no-posts">Você ainda não tem posts. Crie seu primeiro post!</p>';
        }
    } catch (error) {
        showToast('Erro ao carregar posts do perfil', 'error');
        elements.profilePosts.innerHTML = '<p class="no-posts">Erro ao carregar posts</p>';
    }
}

async function loadMorePosts() {
    await loadPosts(currentPage + 1);
}

function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card fade-in';
    postElement.dataset.postId = post.id;
    
    const timeAgo = formatTimeAgo(new Date(post.created_at));
    
    const isReposted = post.isShared || post.isShared === 1;
    
    if (isReposted) {
        console.log('Post repostado:', {
            id: post.id,
            username: post.username,
            shared_by_username: post.shared_by_username,
            full_name: post.full_name,
            shared_by_full_name: post.shared_by_full_name,
            avatar: post.avatar,
            shared_by_avatar: post.shared_by_avatar
        });
    }
    
    const displayUsername = isReposted && post.shared_by_username ? post.shared_by_username : post.username;
    const displayFullName = isReposted && post.shared_by_full_name ? post.shared_by_full_name : post.full_name;
    const displayAvatar = isReposted && post.shared_by_avatar ? post.shared_by_avatar : post.avatar;
    
    if (isReposted) {
        console.log('Valores finais para exibição:', {
            displayUsername,
            displayFullName,
            displayAvatar
        });
    }
    
    const repostIndicator = isReposted ? `
        <div class="repost-indicator">
            <i class="fas fa-retweet"></i>
            <span>Repostado de @${post.username}</span>
        </div>
    ` : '';
    
    const displayAvatarHtml = displayAvatar 
        ? `<img src="${displayAvatar}" alt="Avatar" class="post-user-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="post-user-avatar avatar-fallback" style="display: none;">
             <i class="fas fa-user"></i>
           </div>`
        : `<div class="post-user-avatar avatar-fallback">
             <i class="fas fa-user"></i>
           </div>`;
    
    postElement.innerHTML = `
        ${repostIndicator}
        <div class="post-header">
            <div class="post-user-avatar-container">
                ${displayAvatarHtml}
            </div>
            <div class="post-user-info">
                <h4>${displayFullName || displayUsername}</h4>
                <span>@${displayUsername} • ${timeAgo}</span>
            </div>
        </div>
        
        <div class="post-content">
            ${post.content}
        </div>
        
        ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
        
        <div class="post-actions-bar">
            <button class="post-action like-btn" data-post-id="${post.id}">
                <i class="fas fa-heart"></i>
                <span class="like-count">${post.likes_count || 0}</span>
            </button>
            <button class="post-action comment-btn" data-post-id="${post.id}">
                <i class="fas fa-comment"></i>
                <span class="comment-count">${post.comments_count || 0}</span>
            </button>
            <button class="post-action share-btn ${post.isShared === 1 ? 'shared' : ''}" data-post-id="${post.id}">
                <i class="fas fa-share"></i>
            </button>
            ${post.user_id === currentUser?.id ? `
                <button class="post-action delete-btn" data-post-id="${post.id}">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
        </div>
        
        <div class="comments-section" style="display: none;">
            <div class="comments-list"></div>
            <form class="comment-form">
                <input type="text" class="comment-input" placeholder="Adicione um comentário...">
                <button type="submit" class="btn btn-primary">Comentar</button>
            </form>
        </div>
    `;
    
    const likeBtn = postElement.querySelector('.like-btn');
    const commentBtn = postElement.querySelector('.comment-btn');
    const shareBtn = postElement.querySelector('.share-btn');
    const commentForm = postElement.querySelector('.comment-form');
    const deleteBtn = postElement.querySelector('.delete-btn');
    
    likeBtn.addEventListener('click', () => handleLike(post.id, likeBtn));
    commentBtn.addEventListener('click', () => toggleComments(postElement));
    shareBtn.addEventListener('click', () => handleShare(post.id, post));
    commentForm.addEventListener('submit', (e) => handleComment(e, post.id, postElement));
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePost(post.id, postElement));
    }
    
    return postElement;
}

async function handleLike(postId, likeBtn) {
    if (!currentUser) {
        showToast('Faça login para curtir posts', 'error');
        return;
    }
    
    try {
        const isLiked = likeBtn.classList.contains('liked');
        const method = isLiked ? 'DELETE' : 'POST';
        
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: method
        });
        
        if (response.ok) {
            const likeCount = likeBtn.querySelector('.like-count');
            const currentCount = parseInt(likeCount.textContent);
            
            if (isLiked) {
                likeBtn.classList.remove('liked');
                likeCount.textContent = currentCount - 1;
            } else {
                likeBtn.classList.add('liked');
                likeCount.textContent = currentCount + 1;
            }
        }
    } catch (error) {
        showToast('Erro ao curtir post', 'error');
    }
}

async function handleShare(postId, post) {
    if (!currentUser) {
        showToast('Faça login para compartilhar posts', 'error');
        return;
    }
    
    console.log('Tentando compartilhar post:', postId, 'Post data:', post);
    
    try {
        const hasShared = post.isShared === 1;
        console.log('Post já compartilhado?', hasShared);
        
        if (hasShared) {
            console.log('Removendo compartilhamento...');
            const response = await fetch(`${API_BASE}/posts/${postId}/share`, {
                method: 'DELETE'
            });
            
            console.log('Resposta da remoção:', response.status, response.statusText);
            
            if (response.ok) {
                showToast('Post removido dos seus compartilhamentos', 'success');
                const shareBtn = document.querySelector(`[data-post-id="${postId}"].share-btn`);
                if (shareBtn) {
                    shareBtn.classList.remove('shared');
                    shareBtn.innerHTML = '<i class="fas fa-share"></i>';
                }
            } else {
                const data = await response.json();
                console.error('Erro na remoção:', data);
                showToast(data.error || 'Erro ao remover compartilhamento', 'error');
            }
        } else {
            console.log('Compartilhando post...');
            const response = await fetch(`${API_BASE}/posts/${postId}/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    original_post_id: postId
                })
            });
            
            console.log('Resposta do compartilhamento:', response.status, response.statusText);
            
            if (response.ok) {
                showToast('Post compartilhado com sucesso!', 'success');
                const shareBtn = document.querySelector(`[data-post-id="${postId}"].share-btn`);
                if (shareBtn) {
                    shareBtn.classList.add('shared');
                    shareBtn.innerHTML = '<i class="fas fa-share"></i>';
                }
            } else {
                const data = await response.json();
                console.error('Erro no compartilhamento:', data);
                showToast(data.error || 'Erro ao compartilhar post', 'error');
            }
        }
    } catch (error) {
        console.error('Erro de conexão ao compartilhar:', error);
        showToast('Erro de conexão', 'error');
    }
}

async function handleShareFromModal(postId) {
    if (!currentUser) {
        showToast('Faça login para compartilhar posts', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}`);
        const post = await response.json();
        
        if (response.ok) {
            const hasShared = post.isShared === 1;
            
            if (hasShared) {
                const shareResponse = await fetch(`${API_BASE}/posts/${postId}/share`, {
                    method: 'DELETE'
                });
                
                if (shareResponse.ok) {
                    showToast('Post removido dos seus compartilhamentos', 'success');
                    // Atualizar o botão no modal
                    const shareBtn = document.querySelector('.post-details-actions .post-action[onclick*="handleShareFromModal"]');
                    if (shareBtn) {
                        shareBtn.classList.remove('shared');
                        shareBtn.innerHTML = '<i class="fas fa-share"></i>';
                    }
                } else {
                    const data = await shareResponse.json();
                    showToast(data.error || 'Erro ao remover compartilhamento', 'error');
                }
            } else {
                const shareResponse = await fetch(`${API_BASE}/posts/${postId}/share`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        original_post_id: postId
                    })
                });
                
                if (shareResponse.ok) {
                    showToast('Post compartilhado com sucesso!', 'success');
                    // Atualizar o botão no modal
                    const shareBtn = document.querySelector('.post-details-actions .post-action[onclick*="handleShareFromModal"]');
                    if (shareBtn) {
                        shareBtn.classList.add('shared');
                        shareBtn.innerHTML = '<i class="fas fa-share"></i>';
                    }
                } else {
                    const data = await shareResponse.json();
                    showToast(data.error || 'Erro ao compartilhar post', 'error');
                }
            }
        } else {
            showToast('Erro ao carregar dados do post', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

function toggleComments(postElement) {
    const commentsSection = postElement.querySelector('.comments-section');
    const isVisible = commentsSection.style.display !== 'none';
    
    if (!isVisible) {
        commentsSection.style.display = 'block';
        loadComments(postElement);
    } else {
        commentsSection.style.display = 'none';
    }
}

async function handleDeletePost(postId, postElement) {
    if (!currentUser) {
        showToast('Faça login para excluir posts', 'error');
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Post excluído com sucesso!', 'success');
            postElement.style.opacity = '0';
            setTimeout(() => {
                postElement.remove();
            }, 300);
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao excluir post', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

async function loadComments(postElement) {
    const postId = postElement.dataset.postId;
    const commentsList = postElement.querySelector('.comments-list');
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`);
        const comments = await response.json();
        
        commentsList.innerHTML = comments.map(comment => {
            const avatarHtml = comment.avatar 
                ? `<img src="${comment.avatar}" alt="Avatar" class="comment-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="comment-avatar avatar-fallback" style="display: none;">
                     <i class="fas fa-user"></i>
                   </div>`
                : `<div class="comment-avatar avatar-fallback">
                     <i class="fas fa-user"></i>
                   </div>`;
            const timeAgo = formatTimeAgo(new Date(comment.created_at));
            
            return `
                <div class="comment">
                    <div class="comment-avatar-container">
                        ${avatarHtml}
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-username">${comment.full_name || comment.username}</span>
                            <span class="comment-time">${timeAgo}</span>
                        </div>
                        <div class="comment-text">${comment.content}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        commentsList.innerHTML = '<p>Erro ao carregar comentários</p>';
    }
}

async function handleComment(e, postId, postElement) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Faça login para comentar', 'error');
        return;
    }
    
    const commentInput = postElement.querySelector('.comment-input');
    const content = commentInput.value.trim();
    
    if (!content) {
        showToast('Adicione um comentário', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            commentInput.value = '';
            loadComments(postElement);
            
            const commentCount = postElement.querySelector('.comment-count');
            const currentCount = parseInt(commentCount.textContent);
            commentCount.textContent = currentCount + 1;
        }
    } catch (error) {
        showToast('Erro ao adicionar comentário', 'error');
    }
}

function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            elements.previewImg.src = e.target.result;
            elements.imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeImagePreview() {
    elements.postImage.value = '';
    elements.imagePreview.style.display = 'none';
    elements.previewImg.src = '';
}

async function loadProfileData() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/user`);
        const userData = await response.json();
        
        document.getElementById('profileUserName').textContent = userData.full_name || userData.username;
        document.getElementById('profileUserBio').textContent = userData.bio || 'sem bio';
        
        const profileAvatar = document.getElementById('profileAvatar');
        if (userData.avatar) {
            profileAvatar.src = userData.avatar;
            profileAvatar.style.display = 'block';
            elements.profileAvatarFallback.style.display = 'none';
        } else {
            profileAvatar.style.display = 'none';
            elements.profileAvatarFallback.style.display = 'flex';
        }
        
        await loadUserStats();
    } catch (error) {
        showToast('Erro ao carregar perfil', 'error');
    }
}

async function loadUserStats() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/user/${currentUser.id}/stats`);
        const stats = await response.json();
        
        document.getElementById('profilePostsCount').textContent = stats.posts_count;
        document.getElementById('profileFollowersCount').textContent = stats.followers_count;
        document.getElementById('profileFollowingCount').textContent = stats.following_count;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        document.getElementById('profilePostsCount').textContent = '0';
        document.getElementById('profileFollowersCount').textContent = '0';
        document.getElementById('profileFollowingCount').textContent = '0';
    }
}


function formatTimeAgo(date) {
    const now = new Date();
    const postDate = new Date(date);
    
    if (isNaN(postDate.getTime())) {
        return 'Data inválida';
    }
    
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 0 || diffInSeconds > 2592000) {
        return formatFullDate(postDate);
    }
    
    if (diffInSeconds < 60) {
        return 'Agora mesmo';
    }
    
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min${minutes > 1 ? 's' : ''}`;
    }
    
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h`;
    }
    
    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} dia${days > 1 ? 's' : ''}`;
    }
    
    if (diffInSeconds < 2592000) {
        const weeks = Math.floor(diffInSeconds / 604800);
        return `${weeks} sem${weeks > 1 ? 'anas' : 'ana'}`;
    }
    
    return formatFullDate(postDate);
}

function formatFullDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function showLoading() {
    elements.loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingSpinner.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            elements.toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalContent.innerHTML = content;
    elements.modalOverlay.classList.remove('hidden');
}

function closeModal() {
    elements.modalOverlay.classList.add('hidden');
}

function openEditProfileModal() {
    if (!currentUser) return;
    
    document.getElementById('editFullName').value = currentUser.full_name || currentUser.username;
    document.getElementById('editBio').value = currentUser.bio || '';
    
    document.getElementById('editProfileModalOverlay').classList.remove('hidden');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModalOverlay').classList.add('hidden');
}

async function handleEditProfile(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const fullName = document.getElementById('editFullName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    
    if (!fullName) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fullName, bio })
        });
        
        if (response.ok) {
            // Atualizar dados do usuário
            const userResponse = await fetch(`${API_BASE}/user`);
            if (userResponse.ok) {
                currentUser = await userResponse.json();
                updateUserInterface();
                loadProfileData();
            }
            
            showToast('Perfil atualizado com sucesso!', 'success');
            closeEditProfileModal();
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao atualizar perfil', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    } finally {
        hideLoading();
    }
}

if (currentUser) {
    loadPosts();
}

async function loadExploreContent() {
    const searchResults = document.getElementById('searchResults');
    
    try {
        const [usersResponse, postsResponse] = await Promise.all([
            fetch(`${API_BASE}/users`),
            fetch(`${API_BASE}/posts?limit=20`)
        ]);
        
        const users = await usersResponse.json();
        const posts = await postsResponse.json();
        
        let contentHTML = '';
        
        if (usersResponse.ok && users.length > 0) {
            contentHTML += `
                <div class="explore-section-users">
                    <h3>usuários que talvez você conheça</h3>
                    <div class="users-grid">
            `;
            
            users.forEach(user => {
                contentHTML += createUserResultHTML(user);
            });
            
            contentHTML += `
                    </div>
                </div>
            `;
        }
        
        if (postsResponse.ok && posts.length > 0) {
            const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            if (sortedPosts.length > 0) {
                contentHTML += `
                    <div class="explore-section-posts">
                        <h3>posts públicos globais</h3>
                        <div class="posts-grid">
                `;
                
                sortedPosts.forEach(post => {
                    contentHTML += createPostResultHTML(post);
                });
                
                contentHTML += `
                        </div>
                    </div>
                `;
            }
        }
        
        if (contentHTML) {
            searchResults.innerHTML = contentHTML;
            
            document.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', handleFollowUser);
            });
        } else {
            searchResults.innerHTML = `
                <div class="no-search-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Nenhum conteúdo encontrado</h3>
                    <p>Não há usuários ou posts disponíveis no momento</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        searchResults.innerHTML = `
            <div class="no-search-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar conteúdo</h3>
                <p>Tente novamente mais tarde</p>
            </div>
        `;
    }
}







function createUserResultHTML(user) {
    const avatarHtml = user.avatar 
        ? `<img src="${user.avatar}" alt="Avatar" class="user-result-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="user-result-avatar avatar-fallback" style="display: none;">
             <i class="fas fa-user"></i>
           </div>`
        : `<div class="user-result-avatar avatar-fallback">
             <i class="fas fa-user"></i>
           </div>`;
    
    const isFollowing = user.isFollowing ? 'following' : '';
    const followText = user.isFollowing ? 'Seguindo' : 'Seguir';
    
    return `
        <div class="user-result">
            <div class="user-result-avatar-container">
                ${avatarHtml}
            </div>
            <div class="user-result-info">
                <div class="user-result-name" onclick="viewUserProfile(${user.id})" style="cursor: pointer; color: var(--accent-color);">${user.full_name || user.username}</div>
                <div class="user-result-username">@${user.username}</div>
                ${user.bio ? `<div class="user-result-bio">${user.bio}</div>` : ''}
            </div>
            <button class="follow-btn ${isFollowing}" data-user-id="${user.id}">
                ${followText}
            </button>
        </div>
    `;
}

function createPostResultHTML(post) {
    const isReposted = post.isShared || post.isShared === 1;
    
    const displayUsername = isReposted && post.shared_by_username ? post.shared_by_username : post.username;
    const displayFullName = isReposted && post.shared_by_full_name ? post.shared_by_full_name : post.full_name;
    const displayAvatar = isReposted && post.shared_by_avatar ? post.shared_by_avatar : post.avatar;
    
    const avatarHtml = displayAvatar 
        ? `<img src="${displayAvatar}" alt="Avatar" class="post-result-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="post-result-avatar avatar-fallback" style="display: none;">
             <i class="fas fa-user"></i>
           </div>`
        : `<div class="post-result-avatar avatar-fallback">
             <i class="fas fa-user"></i>
           </div>`;
    
    const imageHTML = post.image ? `<img src="${post.image}" alt="Post image" class="post-result-image">` : '';
    
    const repostIndicator = isReposted ? `
        <div class="repost-indicator">
            <i class="fas fa-retweet"></i>
            <span>Repostado de @${post.username}</span>
        </div>
    ` : '';
    
    return `
        <div class="post-result" onclick="showPostDetails(${post.id})">
            ${repostIndicator}
            <div class="post-result-header">
                <div class="post-result-avatar-container">
                    ${avatarHtml}
                </div>
                <div class="post-result-user-info">
                    <h4>${displayFullName || displayUsername}</h4>
                    <span>@${displayUsername} • ${formatTimeAgo(post.created_at)}</span>
                </div>
            </div>
            <div class="post-result-content">${post.content}</div>
            ${imageHTML}
        </div>
    `;
}

async function showPostDetails(postId) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}`);
        const post = await response.json();
        
        if (response.ok) {
            console.log('Post object in showPostDetails:', post);
            console.log('post.avatar:', post.avatar);
            console.log('post.user_avatar:', post.user_avatar);
            console.log('post.user:', post.user);
            
            const isLiked = post.isLiked || false;
            const likeIconClass = isLiked ? 'fas fa-heart' : 'far fa-heart';
            const likeBtnClass = isLiked ? 'post-action liked' : 'post-action';
            
            const avatarUrl = post.avatar || post.user_avatar || (post.user && post.user.avatar);
            
            const avatarHtml = avatarUrl 
                ? `<img src="${avatarUrl}" alt="Avatar" class="post-details-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="post-details-avatar avatar-fallback" style="display: none;">
                     <i class="fas fa-user"></i>
                   </div>`
                : `<div class="post-details-avatar avatar-fallback">
                     <i class="fas fa-user"></i>
                   </div>`;

            showModal('detalhes do post', `
                <div class="post-details">
                    <div class="post-details-header">
                        <div class="post-details-avatar-container">
                            ${avatarHtml}
                        </div>
                        <div class="post-details-user-info">
                            <h4>${post.user_name || post.username}</h4>
                            <span>${formatTimeAgo(post.created_at)}</span>
                        </div>
                    </div>
                    <div class="post-details-content">${post.content}</div>
                    ${post.image ? `<img src="${post.image}" alt="Post image" class="post-details-image">` : ''}
                    <div class="post-details-actions">
                        <button class="${likeBtnClass}" onclick="handleLikeFromModal(${post.id}, this)">
                            <i class="${likeIconClass}"></i>
                            <span class="likes-count">${post.likes_count || 0}</span>
                        </button>
                        <button class="post-action" onclick="toggleCommentsFromModal(${post.id})">
                            <i class="far fa-comment"></i>
                            <span class="comments-count">${post.comments_count || 0}</span>
                        </button>
                        <button class="post-action" onclick="handleShareFromModal(${post.id})">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                    <div class="post-details-comments" id="modal-comments-${post.id}" style="display: none;">
                        <div class="comments-list" id="modal-comments-list-${post.id}">
                            <!-- Comentários serão carregados aqui -->
                        </div>
                        <div class="comment-form">
                            <input type="text" class="comment-input" placeholder="Adicione um comentário..." id="modal-comment-input-${post.id}">
                            <button class="btn btn-primary" onclick="handleCommentFromModal(${post.id})">Comentar</button>
                        </div>
                    </div>
                </div>
            `);
        } else {
            showToast('Erro ao carregar detalhes do post', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes do post:', error);
        showToast('Erro de conexão', 'error');
    }
}


async function handleFollowUser(e) {
    const userId = e.target.dataset.userId;
    const isFollowing = e.target.classList.contains('following');
    
    try {
        const method = isFollowing ? 'DELETE' : 'POST';
        const response = await fetch(`${API_BASE}/user/${userId}/follow`, {
            method: method
        });
        
        if (response.ok) {
            if (isFollowing) {
                e.target.classList.remove('following');
                e.target.textContent = 'Seguir';
            } else {
                e.target.classList.add('following');
                e.target.textContent = 'Seguindo';
            }
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao seguir usuário', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function viewUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE}/user/${userId}`);
        const user = await response.json();
        
        if (response.ok) {
            showModal(`Perfil de ${user.full_name || user.username}`, `
                <div class="user-profile-details">
                    <div class="user-profile-header">
                        <img src="${user.avatar || 'https://via.placeholder.com/100x100/d4af37/ffffff?text=U'}" alt="Avatar" class="user-profile-avatar" onerror="this.src='https://via.placeholder.com/100x100/d4af37/ffffff?text=U';">
                        <div class="user-profile-info">
                            <h3>${user.full_name || user.username}</h3>
                            <p>@${user.username}</p>
                            ${user.bio ? `<p class="user-bio">${user.bio}</p>` : ''}
                        </div>
                    </div>
                    <div class="user-profile-stats">
                        <div class="stat">
                            <span class="stat-number">${user.posts_count || 0}</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${user.followers_count || 0}</span>
                            <span class="stat-label">Seguidores</span>
                        </div>
                    </div>
                    <div class="user-profile-actions">
                        <button class="btn btn-primary" onclick="handleFollowUserFromModal(${userId}, this)">
                            ${user.isFollowing ? 'Seguindo' : 'Seguir'}
                        </button>
                    </div>
                </div>
            `);
        } else {
            showToast('Erro ao carregar perfil do usuário', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        showToast('Erro de conexão', 'error');
    }
}

async function handleFollowUserFromModal(userId, button) {
    const isFollowing = button.textContent === 'Seguindo';
    
    try {
        const method = isFollowing ? 'DELETE' : 'POST';
        const response = await fetch(`${API_BASE}/user/${userId}/follow`, {
            method: method
        });
        
        if (response.ok) {
            if (isFollowing) {
                button.textContent = 'Seguir';
                button.classList.remove('btn-outline');
                button.classList.add('btn-primary');
            } else {
                button.textContent = 'Seguindo';
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline');
            }
            
            const followBtn = document.querySelector(`[data-user-id="${userId}"]`);
            if (followBtn) {
                if (isFollowing) {
                    followBtn.classList.remove('following');
                    followBtn.textContent = 'Seguir';
                } else {
                    followBtn.classList.add('following');
                    followBtn.textContent = 'Seguindo';
                }
            }
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao seguir usuário', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function handleLikeFromModal(postId, button) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: 'POST'
        });
        
        if (response.ok) {
            const isLiked = button.classList.contains('liked');
            const icon = button.querySelector('i');
            const countSpan = button.querySelector('.likes-count');
            
            if (isLiked) {
                button.classList.remove('liked');
                icon.className = 'far fa-heart';
                countSpan.textContent = parseInt(countSpan.textContent) - 1;
            } else {
                button.classList.add('liked');
                icon.className = 'fas fa-heart';
                countSpan.textContent = parseInt(countSpan.textContent) + 1;
            }
        } else {
            showToast('Erro ao curtir post', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function toggleCommentsFromModal(postId) {
    const commentsContainer = document.getElementById(`modal-comments-${postId}`);
    const commentsList = document.getElementById(`modal-comments-list-${postId}`);
    
    if (commentsContainer.style.display === 'none') {
        commentsContainer.style.display = 'block';
        await loadCommentsFromModal(postId, commentsList);
    } else {
        commentsContainer.style.display = 'none';
    }
}

async function loadCommentsFromModal(postId, commentsList) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`);
        const comments = await response.json();
        
        if (response.ok) {
            if (comments.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">Nenhum comentário ainda. Seja o primeiro!</p>';
            } else {
                commentsList.innerHTML = comments.map(comment => {
                    const avatarHtml = comment.avatar 
                        ? `<img src="${comment.avatar}" alt="Avatar" class="comment-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                           <div class="comment-avatar avatar-fallback" style="display: none;">
                             <i class="fas fa-user"></i>
                           </div>`
                        : `<div class="comment-avatar avatar-fallback">
                             <i class="fas fa-user"></i>
                           </div>`;
                    
                    return `
                        <div class="comment">
                            <div class="comment-avatar-container">
                                ${avatarHtml}
                            </div>
                            <div class="comment-content">
                                <div class="comment-header">
                                    <span class="comment-username">${comment.full_name || comment.username}</span>
                                    <span class="comment-time">${formatTimeAgo(comment.created_at)}</span>
                                </div>
                                <div class="comment-text">${comment.content}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } else {
            commentsList.innerHTML = '<p class="error">Erro ao carregar comentários</p>';
        }
    } catch (error) {
        commentsList.innerHTML = '<p class="error">Erro de conexão</p>';
    }
}

async function handleCommentFromModal(postId) {
    const input = document.getElementById(`modal-comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) {
        showToast('Digite um comentário', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            input.value = '';
            showToast('Comentário adicionado!', 'success');
            
            const commentsList = document.getElementById(`modal-comments-list-${postId}`);
            await loadCommentsFromModal(postId, commentsList);
            
            const commentsCount = document.querySelector(`#modal-comments-${postId}`).closest('.post-details').querySelector('.comments-count');
            commentsCount.textContent = parseInt(commentsCount.textContent) + 1;
        } else {
            const data = await response.json();
            showToast(data.error || 'Erro ao adicionar comentário', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

 