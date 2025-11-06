// 1. Configuração do Cliente Supabase
// (Oculto para brevidade, sem alterações)
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error("Erro: Arquivo 'config.js' não foi carregado ou está vazio.");
    document.getElementById('dashboard-container').innerHTML = 
        "<p>Erro fatal de configuração. Verifique o console.</p>";
}
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'SEU_URL_SUPABASE') {
     console.error("Erro: Por favor, preencha suas credenciais do Supabase no arquivo 'config.js'.");
     document.getElementById('dashboard-container').innerHTML = 
        "<p>Erro de configuração. Conexão com o banco de dados falhou.</p>";
}
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// 2. Elementos HTML 
const dashboardContainer = document.getElementById('dashboard-container');
const loadingIndicator = document.getElementById('loading-indicator');
const searchBar = document.getElementById('search-bar');
const filterStatus = document.getElementById('filter-status');
const filterArea = document.getElementById('filter-area');
const filterCargo = document.getElementById('filter-cargo');
const filterLider = document.getElementById('filter-lider');

// ======== NOVOS Elementos de Paginação ========
const loadMoreButton = document.getElementById('load-more-button');
const ITENS_POR_PAGINA = 30;
let currentPage = 0;
// ============================================


// ---- NOVA FUNÇÃO: Constrói a query baseada nos filtros ----
// Isso evita repetir o código em 'carregarColaboradores' e 'carregarMais'
function buildQuery() {
    const searchTerm = searchBar.value.trim();
    const status = filterStatus.value;
    const area = filterArea.value;
    const cargo = filterCargo.value;
    const lider = filterLider.value;

    let query = supabaseClient.from('QLP').select('*');

    if (searchTerm) {
        query = query.or(`NOME.ilike.%${searchTerm}%,CPF.ilike.%${searchTerm}%`);
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
    
    // Ordena por nome para garantir consistência na paginação
    query = query.order('NOME', { ascending: true });

    return query;
}


// 3. Função para carregar e exibir os colaboradores (MODIFICADA)
// Esta função agora é para NOVAS buscas (reseta a página para 0)
async function carregarColaboradores() {
    currentPage = 0; // Reseta a página
    loadingIndicator.style.display = 'block';
    dashboardContainer.innerHTML = ''; // Limpa cards antigos
    loadMoreButton.style.display = 'none'; // Esconde o botão
    loadMoreButton.disabled = false;

    // Calcula o range da primeira página
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

    // Cria e insere os cards
    let cardsHTML = '';
    data.forEach(colaborador => {
        cardsHTML += criarCardColaborador(colaborador);
    });
    dashboardContainer.innerHTML = cardsHTML;

    // Mostra o botão "Carregar Mais" apenas se houverem mais itens
    if (data.length === ITENS_POR_PAGINA) {
        loadMoreButton.style.display = 'block';
    }
}

// ---- NOVA FUNÇÃO: Carregar mais itens (Páginas 2, 3, etc.) ----
async function carregarMais() {
    currentPage++; // Incrementa a página
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

    // Cria os cards e ADICIONA no container
    data.forEach(colaborador => {
        dashboardContainer.innerHTML += criarCardColaborador(colaborador);
    });

    // Reativa o botão
    loadMoreButton.disabled = false;
    loadMoreButton.textContent = 'Carregar Mais';

    // Se a busca retornou menos itens que o limite, é a última página
    if (data.length < ITENS_POR_PAGINA) {
        loadMoreButton.style.display = 'none';
    }
}


// 5. Função para criar o HTML de um único card (Sem alterações)
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

// 6. Função para Popular os filtros (Sem alterações)
// (Recomendo otimizar isso no futuro, mas não é o foco agora)
async function popularFiltrosDinamicos() {
    // (Função idêntica à anterior, oculta para brevidade)
    const { data, error } = await supabaseClient
        .from('QLP')
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

// 7. Chama as funções principais (MODIFICADO)
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners dos filtros agora chamam a função de "reset"
    searchBar.addEventListener('input', carregarColaboradores);
    filterStatus.addEventListener('change', carregarColaboradores);
    filterArea.addEventListener('change', carregarColaboradores);
    filterCargo.addEventListener('change', carregarColaboradores);
    filterLider.addEventListener('change', carregarColaboradores);

    // ---- NOVO: Event listener para o botão "Carregar Mais" ----
    loadMoreButton.addEventListener('click', carregarMais);

    // Popula os dropdowns de filtro
    popularFiltrosDinamicos();
    
    // Carrega os colaboradores (Página 0) pela primeira vez
    carregarColaboradores();
});