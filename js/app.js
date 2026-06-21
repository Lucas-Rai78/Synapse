document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html'
  const toolsData = await fetchTools()

  if (currentPage === 'index.html' || currentPage === '') {
    renderHome(toolsData)
  } else if (currentPage === 'buscar.html') {
    renderSearch(toolsData)
  } else if (currentPage.includes('ferramenta.html')) {
    renderToolDetails(toolsData)
  } else if (currentPage === 'perfil.html') {
    renderProfile(toolsData)
  }
})

// Busca os dados do arquivo JSON estruturado
async function fetchTools() {
  try {
    const response = await fetch('./data/ai-tools.json')
    return await response.json()
  } catch (error) {
    console.error('Erro ao carregar banco de dados de IAs:', error)
    return []
  }
}

// Direcionamento mapeado salvando histórico
function goToTool(id) {
  saveToHistory(id)
  window.location.href = `ferramenta.html?id=${id}`
}

// Gera HTML do Card - Mapeado para usar imagemUrl do novo JSON
function generateCardHTML(tool) {
  const tagsHTML = tool.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join('')
  return `
        <div class="ai-card" onclick="goToTool(${tool.id})">
            <div class="card-img-container">
                <img src="${tool.imagemUrl}" alt="${tool.nome} Logo" onerror="this.src='https://ui-avatars.com/api/?name=${tool.nome}&background=8B5CF6&color=fff'">
            </div>
            <div class="card-content">
                <h3>${tool.nome}</h3>
                <p>${tool.descricao}</p>
                <div class="tags">${tagsHTML}</div>
            </div>
        </div>
    `
}

// RENDER: Home (index.html) - Organiza separadamente as categorias encontradas
function renderHome(data) {
  const container = document.getElementById('categories-container')
  if (!container) return

  const categorias = [...new Set(data.map((item) => item.categoria))]

  categorias.forEach((cat) => {
    const toolsInCategory = data.filter((item) => item.categoria === cat)

    const section = document.createElement('div')
    section.style.marginBottom = '3rem'
    section.innerHTML = `
            <h2 style="font-size: 1.6rem; color: var(--text-main); margin-bottom: 0.5rem; font-weight: 700;">${cat}</h2>
            <div class="grid-container">
                ${toolsInCategory.map((tool) => generateCardHTML(tool)).join('')}
            </div>
        `
    container.appendChild(section)
  })
}

// RENDER: Busca (buscar.html)
function renderSearch(data) {
  const grid = document.getElementById('search-grid')
  const searchInput = document.getElementById('search-input')
  if (!grid || !searchInput) return

  const displayTools = (tools) => {
    grid.innerHTML = tools.length
      ? tools.map((tool) => generateCardHTML(tool)).join('')
      : '<p style="color: var(--text-muted)">Nenhuma IA encontrada para os termos inseridos.</p>'
  }

  displayTools(data)

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase()
    const filtered = data.filter(
      (tool) =>
        tool.nome.toLowerCase().includes(term) ||
        tool.descricao.toLowerCase().includes(term) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        tool.categoria.toLowerCase().includes(term),
    )
    displayTools(filtered)
  })
}

// RENDER: Detalhes Completos (ferramenta.html)
function renderToolDetails(data) {
  const params = new URLSearchParams(window.location.search)
  const id = parseInt(params.get('id'))
  const tool = data.find((t) => t.id === id)

  if (!tool) {
    document.getElementById('tool-details').innerHTML =
      "<h2 style='text-align:center; margin-top:5rem;'>Ferramenta de IA não catalogada.</h2>"
    return
  }

  // Vinculação de textos diretos e da Nova Descrição Longa
  document.getElementById('tool-name').innerText = tool.nome
  document.getElementById('tool-desc').innerText = tool.descricaoLonga
  document.getElementById('tool-price').innerText = tool.preco
  document.getElementById('tool-category').innerText = tool.categoria
  document.getElementById('tool-level').innerText = tool.nivel
  document.getElementById('tool-link').href = tool.site

  // Inserção da Logo dinamicamente
  const imgElement = document.getElementById('tool-logo')
  if (imgElement) {
    imgElement.src = tool.imagemUrl
    imgElement.alt = `Logo ${tool.nome}`
  }

  // Render dos Beneficios mapeados do array
  const benefitsList = document.getElementById('tool-benefits')
  benefitsList.innerHTML = tool.beneficios
    .map((b) => `<li><i class="fas fa-map-pin"></i> ${b}</li>`)
    .join('')

  // Render dos Recursos Técnicos estruturados (Objeto complexo do novo JSON)
  const resourcesContainer = document.getElementById('tool-resources')
  if (resourcesContainer && tool.recursos) {
    resourcesContainer.innerHTML = tool.recursos
      .map(
        (rec) => `
            <div class="resource-item" style="background: var(--bg-color); padding: 1.2rem; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                <h4 style="font-weight: 600; margin-bottom: 0.3rem; color: var(--text-main);">${rec.titulo}</h4>
                <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.4;">${rec.descricao}</p>
            </div>
        `,
      )
      .join('')
  }

  // Lógica Persistente de Favoritos (LocalStorage)
  const favBtn = document.getElementById('fav-btn')
  let favorites = JSON.parse(localStorage.getItem('synapse_favorites')) || []

  if (favorites.includes(tool.id)) {
    favBtn.classList.add('active')
    favBtn.innerHTML = '<i class="fas fa-heart" style="color: #f7f7f7;"></i>'
  }
  
  favBtn.addEventListener('click', () => {
    if (favorites.includes(tool.id)) {
      favorites = favorites.filter((favId) => favId !== tool.id)
      favBtn.classList.remove('active')
      favBtn.innerHTML = '<i class="fas fa-heart" style="color: #8b5cf6;"></i>'
    } else {
      favorites.push(tool.id)
      favBtn.classList.add('active')
      favBtn.innerHTML = '<i class="fas fa-heart" style="color: #f7f7f7;"></i>'
    }
    localStorage.setItem('synapse_favorites', JSON.stringify(favorites))
  })
}

// Salva o histórico localmente sem duplicações
function saveToHistory(id) {
  let history = JSON.parse(localStorage.getItem('synapse_history')) || []
  history = history.filter((item) => item !== id)
  history.unshift(id)
  if (history.length > 8) history.pop()
  localStorage.setItem('synapse_history', JSON.stringify(history))
}

// RENDER: Perfil Completo com conexões
function renderProfile(data) {
  const user = {
    nome: 'Santiago',
    email: 'jose.santiago@gmail.com',
    empresa: 'Meta',
    cargo: 'Engenheiro de IA Sênior',
    telefone: '(88) 94002-8922',
  }

  document.getElementById('user-name').innerText = user.nome
  document.getElementById('user-email').innerText = user.email
  document.getElementById('user-company').innerText = user.empresa
  document.getElementById('user-role').innerText = user.cargo
  document.getElementById('user-phone').innerText = user.telefone

  const favorites = JSON.parse(localStorage.getItem('synapse_favorites')) || []
  const history = JSON.parse(localStorage.getItem('synapse_history')) || []

  const renderList = (ids, containerId) => {
    const container = document.getElementById(containerId)
    if (!container) return
    const tools = ids.map((id) => data.find((t) => t.id === id)).filter(Boolean)

    if (tools.length === 0) {
      container.innerHTML =
        "<p style='color: var(--text-muted); font-size: 0.9rem;'>Nenhuma atividade registrada.</p>"
      return
    }

    container.innerHTML = tools
      .map(
        (tool) => `
            <div class="list-item" onclick="goToTool(${tool.id})" style="display: flex; gap: 1rem; align-items: center; background: #fff; padding: 0.8rem; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 0.8rem; cursor: pointer; transition: background 0.2s;">
                <img src="${tool.imagemUrl}" style="width: 32px; height: 32px; object-fit: contain;" onerror="this.src='https://ui-avatars.com/api/?name=${tool.nome}'">
                <div>
                    <div style="font-weight: 600; font-size: 0.95rem;">${tool.nome}</div>
                </div>
            </div>
        `,
      )
      .join('')
  }

  renderList(favorites, 'favorites-list')
  renderList(history, 'history-list')
}
