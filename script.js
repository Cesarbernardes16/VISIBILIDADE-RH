// 1. Configuração do Cliente Supabase
if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error("Erro: Arquivo 'config.js' não foi carregado.");
}
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Elementos HTML (Globais - só declaração)
let dashboardContainer, loadingIndicator, searchBar, filterStatus, filterArea, filterLider, loadMoreButton; // filterCargo REMOVIDO
let metaForm, metaAreaSelect, metaValorInput, metaSubmitButton, metaSuccessMessage, reportTableBody;

// Constantes de Paginação
const ITENS_POR_PAGINA = 30;
let currentPage = 0;
const NOME_TABELA_QLP = 'QLP'; // Verifique se 'QLP' é o nome exato
const NOME_TABELA_METAS = 'metas_qlp';


// 3. Função Principal de Setup (COM DEBUG)
function setupDashboard() {
    console.log("DEBUG: 1. setupDashboard() EXECUTADO!"); // <-- DEBUG 1

    // --- Elementos da "Visão Geral" ---
    dashboardContainer = document.getElementById('dashboard-container');
    loadingIndicator = document.getElementById('loading-indicator');
    searchBar = document.getElementById('search-bar');
    filterStatus = document.getElementById('filter-status');
    filterArea = document.getElementById('filter-area');
    // filterCargo = document.getElementById('filter-cargo'); // REMOVIDO
    filterLider = document.getElementById('filter-lider');
    loadMoreButton = document.getElementById('load-more-button');
    
    // --- Elementos do "Painel de Gestão" ---
    metaForm = document.getElementById('meta-form');
    metaAreaSelect = document.getElementById('meta-area');
    metaValorInput = document.getElementById('meta-valor');
    metaSubmitButton = document.getElementById('meta-submit-button');
    metaSuccessMessage = document.getElementById('meta-success-message');
    reportTableBody = document.getElementById('report-table-body');
    
    console.log("DEBUG: 2. Elementos do DOM capturados."); // <-- DEBUG 2

    // --- Event Listeners dos Filtros (Visão Geral) - COM CHECAGEM ---
    if (searchBar) {
        searchBar.addEventListener('input', carregarColaboradores);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', carregarColaboradores);
    }
    if (filterArea) {
        filterArea.addEventListener('change', carregarColaboradores);
    }
    // if (filterCargo) { // REMOVIDO
    //     filterCargo.addEventListener('change', carregarColaboradores);
    // }
    if (filterLider) {
        filterLider.addEventListener('change', carregarColaboradores);
    }
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', carregarMais);
    }
    
    // --- Event Listeners do Painel de Gestão - COM CHECAGEM ---
    if (metaForm) {
        metaForm.addEventListener('submit', handleMetaSubmit);
    }
    
    // --- Event Listeners da Navegação ---
    setupNavigation();
    console.log("DEBUG: 3. Navegação e Listeners configurados."); // <-- DEBUG 3

    // --- Carga Inicial ---
    popularFiltrosDinamicos();
    popularDropdownMetas(); 
    carregarColaboradores(); // Carrega os cards
    console.log("DEBUG: 4. Carga inicial de dados disparada."); // <-- DEBUG 4
}

// 4. Função de Navegação da Sidebar
function setupNavigation() {
    const navVisaoGeral = document.getElementById('nav-visao-geral');
    const navPainelGestao = document.getElementById('nav-painel-gestao');
    const navSair = document.getElementById('nav-sair');
    
    const contentVisaoGeral = document.getElementById('visao-geral-content');
    const contentGestao = document.getElementById('gestao-content');

    if (navVisaoGeral) {
        navVisaoGeral.addEventListener('click', (e) => {
            e.preventDefault();
            contentVisaoGeral.style.display = 'block';
            contentGestao.style.display = 'none';
            
            navVisaoGeral.classList.add('active');
            navPainelGestao.classList.remove('active');
        });
    }

    if (navPainelGestao) {
        navPainelGestao.addEventListener('click', (e) => {
            e.preventDefault();
            contentVisaoGeral.style.display = 'none';
            contentGestao.style.display = 'block';

            navVisaoGeral.classList.remove('active');
            navPainelGestao.classList.add('active');
            
            // Carrega o relatório ao clicar na aba
            carregarRelatorioMetas();
        });
    }

    if (navSair) {
        navSair.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('usuarioNome');
            window.location.href = 'login.html';
        });
    }
}


// 5. Funções da "Visão Geral" (Cards de Colaboradores)
function buildQuery() {
    const searchTerm = searchBar.value.trim();
    const status = filterStatus.value;
    const area = filterArea.value;
    // const cargo = filterCargo.value; // REMOVIDO (ESTA ERA A LINHA 130)
    const lider = filterLider.value;
    let query = supabaseClient.from(NOME_TABELA_QLP).select('*');
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
    // if (cargo) { // REMOVIDO
    //     query = query.eq('CARGO_ATUAL', cargo);
    // }
    if (lider) {
        query = query.eq('LIDER', lider);
    }
    query = query.order('NOME', { ascending: true });
    return query;
}
async function carregarColaboradores() {
    console.log("DEBUG: 5. carregarColaboradores() chamado..."); // <-- DEBUG 5
    currentPage = 0; 
    
    // Verificação de segurança
    if (!loadingIndicator || !dashboardContainer || !loadMoreButton) {
        console.error("DEBUG: Elementos principais (loading, dashboard) são nulos! Verifique o HTML.");
        return;
    }
    
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
    console.log("DEBUG: 6. Colaboradores carregados e desenhados."); // <-- DEBUG 6
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
function criarCardColaborador(colaborador) {
    const status = colaborador.SITUACAO || 'Indefinido'; 
    const nome = colaborador.NOME || '';
    const cpf = colaborador.CPF || '';
    const funcao = colaborador.FUNCAO || ''; // Assumindo que o nome da coluna possa ser FUNCAO
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

// 6. Funções de População de Filtros (Visão Geral)
async function popularFiltrosDinamicos() {
    // Verificação de segurança
    if (!filterArea || !filterLider) { // filterCargo REMOVIDO
        console.warn("DEBUG: Dropdowns de filtro não encontrados.");
        return;
    }
    
    // Corrigido para .select('*') para evitar o erro 400
    const { data, error } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('*'); 

    if (error) {
        console.error('Erro ao buscar dados para filtros:', error);
        return;
    }
    const areas = [...new Set(data.map(item => item.ATIVIDADE).filter(Boolean))].sort();
    // const cargos = [...new Set(data.map(item => item.CARGO_ATUAL).filter(Boolean))].sort(); // REMOVIDO
    const lideres = [...new Set(data.map(item => item.LIDER).filter(Boolean))].sort();
    
    areas.forEach(area => {
        filterArea.innerHTML += `<option value="${area}">${area}</option>`;
    });
    // cargos.forEach(cargo => { // REMOVIDO
    //     filterCargo.innerHTML += `<option value="${cargo}">${cargo}</option>`;
    // });
    
    lideres.forEach(lider => {
        filterLider.innerHTML += `<option value="${lider}">${lider}</option>`;
    });
}


// 7. Funções do "Painel de Gestão"
async function popularDropdownMetas() {
    // Verificação de segurança
    if (!metaAreaSelect) {
        console.warn("DEBUG: Dropdown de metas não encontrado.");
        return;
    }
    
    // Corrigido para .select('*') para evitar o erro 400
    const { data, error } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('*');
    
    if (error) {
        console.error('Erro ao buscar áreas para o dropdown de metas:', error);
        return;
    }
    const areas = [...new Set(data.map(item => item.ATIVIDADE).filter(Boolean))].sort();
    metaAreaSelect.innerHTML = '<option value="">Selecione uma área...</option>';
    areas.forEach(area => {
        metaAreaSelect.innerHTML += `<option value="${area}">${area}</option>`;
    });
}

async function handleMetaSubmit(e) {
    e.preventDefault();
    const areaSelecionada = metaAreaSelect.value;
    const metaValor = metaValorInput.value;
    if (!areaSelecionada || metaValor === '') {
        alert('Por favor, selecione uma área e preencha o valor da meta.');
        return;
    }
    metaSubmitButton.disabled = true;
    metaSubmitButton.textContent = 'Salvando...';
    metaSuccessMessage.style.visibility = 'hidden';
    const { error } = await supabaseClient
        .from(NOME_TABELA_METAS)
        .upsert(
            { area: areaSelecionada, meta: parseInt(metaValor) },
            { onConflict: 'area' } 
        );
    metaSubmitButton.disabled = false;
    metaSubmitButton.textContent = 'Salvar Meta';
    if (error) {
        console.error('Erro ao salvar meta:', error);
        alert('Erro ao salvar a meta. Verifique o console.'); // O pop-up vem daqui
    } else {
        metaSuccessMessage.style.visibility = 'visible';
        setTimeout(() => { metaSuccessMessage.style.visibility = 'hidden'; }, 3000);
        metaForm.reset();
        carregarRelatorioMetas(); // Atualiza a tabela
    }
}

async function carregarRelatorioMetas() {
    // Verificação de segurança
    if (!reportTableBody) {
        console.error("DEBUG: Tabela de relatório (reportTableBody) não encontrada.");
        return;
    }
    reportTableBody.innerHTML = '<tr><td colspan="3">Carregando relatório...</td></tr>';
    
    // Passo 1: Buscar as Metas
    const { data: metasData, error: metasError } = await supabaseClient
        .from(NOME_TABELA_METAS)
        .select('area, meta');
    if (metasError) {
        console.error('Erro ao buscar metas:', metasError);
        reportTableBody.innerHTML = '<tr><td colspan="3">Erro ao carregar metas.</td></tr>';
        return;
    }
    const metasMap = metasData.reduce((acc, item) => {
        acc[item.area] = item.meta;
        return acc;
    }, {});

    // Passo 2: Buscar o "Real"
    const { data: qlpData, error: qlpError } = await supabaseClient
        .from(NOME_TABELA_QLP)
        .select('ATIVIDADE, SITUACAO'); 
    if (qlpError) {
        console.error('Erro ao buscar QLP para contagem:', qlpError);
        reportTableBody.innerHTML = '<tr><td colspan="3">Erro ao carregar dados reais.</td></tr>';
        return;
    }
    
    // Filtra apenas colaboradores "ATIVO" (com segurança)
    const ativos = qlpData.filter(col => col.SITUACAO && col.SITUACAO.toUpperCase() === 'ATIVO');
    
    const realCounts = ativos.reduce((acc, { ATIVIDADE }) => {
        if (ATIVIDADE) {
            acc[ATIVIDADE] = (acc[ATIVIDADE] || 0) + 1;
        }
        return acc;
    }, {});

    // Passo 3: Combinar os dados
    const todasAreas = [...new Set([...Object.keys(metasMap), ...Object.keys(realCounts)])].sort();
    if (todasAreas.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="3">Nenhum dado de área encontrado.</td></tr>';
        return;
    }
    reportTableBody.innerHTML = ''; 
    todasAreas.forEach(area => {
        const meta = metasMap[area] || 0;
        const real = realCounts[area] || 0;
        const linhaHTML = `
            <tr>
                <td>${area}</td>
                <td>${meta}</td>
                <td>${real}</td>
            </tr>
        `;
        reportTableBody.innerHTML += linhaHTML;
    });
}


// ======== 8. Auth Guard (Proteção da Página com sessionStorage) ========
(function() {
    console.log("DEBUG: Auth Guard INICIADO."); // <-- DEBUG 0
    if (sessionStorage.getItem('usuarioLogado') !== 'true') {
        console.log("DEBUG: Usuário NÃO logado. Redirecionando para login.html");
        window.location.href = 'login.html';
    } else {
        console.log("DEBUG: Usuário LOGADO. Verificando DOM...");
        // Se houver sessão, o usuário está logado.
        if (document.readyState === 'loading') {
            console.log("DEBUG: DOM carregando. Aguardando DOMContentLoaded.");
            document.addEventListener('DOMContentLoaded', setupDashboard);
        } else {
            // DOM já está pronto!
            console.log("DEBUG: DOM pronto. Executando setupDashboard() agora.");
            setupDashboard();
        }
    }
})();