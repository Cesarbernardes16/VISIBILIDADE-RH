// 1. Configuração do Cliente Supabase (PARA OS DADOS)
// Isso AINDA é necessário para carregar os colaboradores!
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error("Erro: Arquivo 'config.js' não foi carregado.");
}
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ======== NOVO: Auth Guard (Proteção da Página com sessionStorage) ========
if (sessionStorage.getItem('usuarioLogado') !== 'true') {
    // Se não houver sessão, chuta o usuário para o login
    window.location.href = 'login.html';
} else {
    // Se houver sessão, o usuário está logado.
    // Dispara o setup do dashboard
    document.addEventListener('DOMContentLoaded', setupDashboard);
}
// =======================================================================


// 2. Elementos HTML (Globais)
let dashboardContainer, loadingIndicator, searchBar, filterStatus, filterArea, filterCargo, filterLider, loadMoreButton;

// Constantes de Paginação
const ITENS_POR_PAGINA = 30;
let currentPage = 0;


// 3. Função Principal de Setup
function setupDashboard() {
    // Pega os elementos do DOM
    dashboardContainer = document.getElementById('dashboard-container');
    loadingIndicator = document.getElementById('loading-indicator');
    searchBar = document.getElementById('search-bar');
    filterStatus = document.getElementById('filter-status');
    filterArea = document.getElementById('filter-area');
    filterCargo = document.getElementById('filter-cargo');
    filterLider = document.getElementById('filter-lider');
    loadMoreButton = document.getElementById('load-more-button');
    
    // --- Event Listeners dos Filtros ---
    searchBar.addEventListener('input', carregarColaboradores);
    filterStatus.addEventListener('change', carregarColaboradores);
    filterArea.addEventListener('change', carregarColaboradores);
    filterCargo.addEventListener('change', carregarColaboradores);
    filterLider.addEventListener('change', carregarColaboradores);
    loadMoreButton.addEventListener('click', carregarMais);
    
    // --- Event Listeners da Nova Navegação ---
    setupNavigation();

    // --- Carga Inicial ---
    popularFiltrosDinamicos();
    carregarColaboradores();
}

// ======== Função de Navegação da Sidebar (COM LOGOUT MODIFICADO) ========
function setupNavigation() {
    const navVisaoGeral = document.getElementById('nav-visao-geral');
    const navPainelGestao = document.getElementById('nav-painel-gestao');
    const navSair = document.getElementById('nav-sair');
    
    const contentVisaoGeral = document.getElementById('visao-geral-content');
    const contentGestao = document.getElementById('gestao-content');

    navVisaoGeral.addEventListener('click', (e) => {
        e.preventDefault();
        contentVisaoGeral.style.display = 'block';
        contentGestao.style.display = 'none';
        
        navVisaoGeral.classList.add('active');
        navPainelGestao.classList.remove('active');
    });

    navPainelGestao.addEventListener('click', (e) => {
        e.preventDefault();
        contentVisaoGeral.style.display = 'none';
        contentGestao.style.display = 'block';

        navVisaoGeral.classList.remove('active');
        navPainelGestao.classList.add('active');
    });

    // --- Função de Logout (MODIFICADA) ---
    navSair.addEventListener('click', (e) => {
        e.preventDefault();
        // Limpa a sessão do navegador
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('usuarioNome');
        
        // Envia o usuário de volta para o login
        window.location.href = 'login.html';
    });
}
// =======================================================


// 4. Funções de Busca de Dados (Sem alterações, apenas nome da tabela)
// (Lembre-se de usar o nome correto da sua tabela aqui no lugar de 'QLP')
const NOME_TABELA = 'QLP'; 

function buildQuery() {
    const searchTerm = searchBar.value.trim();
    const status = filterStatus.value;
    const area = filterArea.value;
    const cargo = filterCargo.value;
    const lider = filterLider.value;

    let query = supabaseClient.from(NOME_TABELA).select('*');

    if (searchTerm) {
        query = query.ilike('NOME', `%${searchTerm}%`);
    }
    if (status) {
        if (status === 'AFASTADO') {
            query = query.or('SITUACAO.eq.AFASTADO,SITUACAO.eq.AFASTAMENTO');
        } else if (status === 'DESLIGADOS') {
            query = query.or('SITUACAO.eq.DESLIGADOS,SITUACAO.eq.DESPEDIDA');
        } else {
            query = query.eq('SITUACAO', status);
        }
    }
    if (area) {
        query = query.eq('ATIVIDADE', area);
    }
    if (cargo) {
        query = query.eq('CARGO_ATUAL', cargo);
    }
    if (lider) {
        query = query.eq('LIDER', lider);
    }
    query = query.order('NOME', { ascending: true });
    return query;
}

async function carregarColaboradores() {
    currentPage = 0; 
    loadingIndicator.style.display = 'block';
    dashboardContainer.innerHTML = ''; 
    loadMoreButton.style.display = 'none'; 
    loadMoreButton.disabled = false;

    const startIndex = 0;
    const endIndex = ITENS_POR_PAGINA - 1;

    let query = buildQuery();
    const { data, error } = await query.range(startIndex, endIndex);

    loadingIndicator.style.display = 'none';

    if (error) {
        console.error('Erro ao buscar dados:', error);
        dashboardContainer.innerHTML = "<p>Erro ao carregar dados. Verifique o console.</p>";
        return;
    }
    if (data.length === 0) {
        dashboardContainer.innerHTML = "<p>Nenhum colaborador encontrado.</p>";
        return;
    }

    let cardsHTML = '';
    data.forEach(colaborador => {
        cardsHTML += criarCardColaborador(colaborador);
    });
    dashboardContainer.innerHTML = cardsHTML;

    if (data.length === ITENS_POR_PAGINA) {
        loadMoreButton.style.display = 'block';
    }
}

async function carregarMais() {
    currentPage++;
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = 'Carregando...';

    const startIndex = currentPage * ITENS_POR_PAGINA;
    const endIndex = startIndex + ITENS_POR_PAGINA - 1;

    let query = buildQuery();
    const { data, error } = await query.range(startIndex, endIndex);

    if (error) {
        console.error('Erro ao buscar mais dados:', error);
        loadMoreButton.textContent = 'Erro ao carregar';
        return;
    }

    data.forEach(colaborador => {
        dashboardContainer.innerHTML += criarCardColaborador(colaborador);
    });

    loadMoreButton.disabled = false;
    loadMoreButton.textContent = 'Carregar Mais';

    if (data.length < ITENS_POR_PAGINA) {
        loadMoreButton.style.display = 'none';
    }
}

// 5. Função de Criar Card (Sem alterações)
function criarCardColaborador(colaborador) {
    // ... (Função idêntica à anterior, oculta para brevidade) ...
    const status = colaborador.SITUACAO || 'Indefinido'; 
    const nome = colaborador.NOME || '';
    const cpf = colaborador.CPF || '';
    const funcao = colaborador.CARGO_ATUAL || '';
    const area = colaborador.ATIVIDADE || '';
    const tempoEmpresa = colaborador.TEMPO_DE_EMPRESA || '';
    const escolaridade = colaborador.Escolaridade || ''; 
    const salario = colaborador.SALARIO || ''; 
    const pcd = colaborador.PCD || 'NÃO'; 
    const telefone = colaborador.CONTATO || ''; 
    const telEmergencia = colaborador.CONT_FAMILIAR || '';
    const turno = colaborador.TURNO || '';
    const lider = colaborador.LIDER || '';
    const dataPromocao = colaborador.DATA_PROMOCAO || '';
    let statusClass = '';
    if (status.toUpperCase() === 'ATIVO') {
        statusClass = 'status-ativo';
    } else if (status.toUpperCase() === 'AFASTADO' || status.toUpperCase() === 'AFASTAMENTO') {
        statusClass = 'status-afastado';
    } else if (status.toUpperCase() === 'DESLIGADOS' || status.toUpperCase() === 'DESPEDIDA') {
        statusClass = 'status-desligados';
    }
    const pcdClass = (pcd.toUpperCase() === 'SIM') ? 'pcd-sim' : 'pcd-nao';
    return `
        <div class="employee-card ${statusClass}">
            <div class="card-header">
                <img src="avatar-placeholder.png" alt="Foto de ${nome}">
                <div class="header-info">
                    <h3>${nome}</h3>
                    <span class="status-badge ${statusClass}">${status}</span>
                </div>
            </div>
            <div class="card-body">
                <p><strong>NOME:</strong> <span>${nome}</span></p>
                <p><strong>CPF:</strong> <span>${cpf}</span></p>
                <p><strong>FUNÇÃO ATUAL:</strong> <span>${funcao}</span></p>
                <p><strong>AREA:</strong> <span>${area}</span></p>
                <p><strong>TEMPO DE EMPRESA:</strong> <span>${tempoEmpresa}</span></p>
                <p><strong>ESCOLARIDADE:</strong> <span>${escolaridade}</span></p>
                <p><strong>SALARIO:</strong> <span>${salario}</span></p>
                <p><strong>PCD:</strong> <span class="pcd-badge ${pcdClass}">${pcd}</span></p>
                <p><strong>PLANO DE SAÚDE:</strong> <span></span></p>
                <p><strong>ENDEREÇO COMPLETO:</strong> <span></span></p>
                <p><strong>TELEFONE DO COLABORADOR:</strong> <span>${telefone}</span></p>
                <p><strong>TELEFONE DE EMERGENCIA:</strong> <span>${telEmergencia}</span></p>
                <p><strong>TURNO:</strong> <span>${turno}</span></p>
                <p><strong>LIDER IMEDIATO:</strong> <span>${lider}</span></p>
                <p><strong>ULTIMA FUNÇÃO:</strong> <span></span></p>
                <p><strong>DATA ULTIMA PROMOÇÃO:</strong> <span>${dataPromocao}</span></p>
                <p><strong>CLASSIFICAÇÃO CICLO DE GENTE:</strong> <span></span></p>
                <p><strong>HISTORICO DE ADVERTENCIAS:</strong> <span></span></p>
                <p><strong>HISTORICO DE SUSPENSÃO:</strong> <span></span></p>
                <p><strong>BANCO DE HORAS TOTAL:</strong> <span></span></p>
                <p><strong>QTD INTERJORNADA:</strong> <span></span></p>
                <p><strong>QTD INTRAJORNADA:</strong> <span></span></p>
                <p><strong>PROGRAMAÇÃO FÉRIAS:</strong> <span></span></p>
            </div>
        </div>
    `;
}

// 6. Função de Popular Filtros (Sem alterações)
async function popularFiltrosDinamicos() {
    const { data, error } = await supabaseClient
        .from(NOME_TABELA)
        .select('*'); 

    if (error) {
        console.error('Erro ao buscar dados para filtros:', error);
        return;
    }
    const areas = [...new Set(data.map(item => item.ATIVIDADE).filter(Boolean))].sort();
    const cargos = [...new Set(data.map(item => item.CARGO_ATUAL).filter(Boolean))].sort();
    const lideres = [...new Set(data.map(item => item.LIDER).filter(Boolean))].sort();
    areas.forEach(area => {
        filterArea.innerHTML += `<option value="${area}">${area}</option>`;
    });
    cargos.forEach(cargo => {
        filterCargo.innerHTML += `<option value="${cargo}">${cargo}</option>`;
    });
    lideres.forEach(lider => {
        filterLider.innerHTML += `<option value="${lider}">${lider}</option>`;
    });
}