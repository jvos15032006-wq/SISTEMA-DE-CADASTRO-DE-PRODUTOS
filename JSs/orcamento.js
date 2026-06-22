const SUPABASE_URL = "https://bqvwlzsuugzxefynabxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_R4MYeG-PbPt549L3HdG9PA_RLP97mOI";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('form-orcamento');
const statusMsg = document.getElementById('status-msg');
const tabelaCorpo = document.getElementById('tabela-orcamentos-corpo');
const selectCliente = document.getElementById('select_cliente');
const selectProduto = document.getElementById('select_produto');
const inputQtd = document.getElementById('qtd_produto');
const inputId = document.getElementById('orcamento-id');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');

let listaProdutos = [];

document.addEventListener('DOMContentLoaded', async () => {
    await buscarClientesSelect();
    await buscarProdutosSelect();
    await buscarOrcamentos();
});

function exibirMensagem(texto, tipo) {
    statusMsg.innerText = texto;
    statusMsg.className = tipo;
    statusMsg.style.display = "block";
}

function limparMensagem() {
    statusMsg.style.display = "none";
}

// ================= CARREGAR CLIENTES NO SELECT =================
async function buscarClientesSelect() {
    try {
        const { data: clientes, error } = await supabaseClient
            .from('cliente')
            .select('id_cliente, ds_nome_cliente') // Altere os nomes se na tabela cliente for diferente
            .order('ds_nome_cliente', { ascending: true });

        if (error) throw error;

        selectCliente.innerHTML = '<option value="">Selecione um Cliente</option>';
        clientes.forEach(cli => {
            const opt = document.createElement('option');
            opt.value = cli.id_cliente;
            opt.innerText = cli.ds_nome_cliente;
            selectCliente.appendChild(opt);
        });
    } catch (err) {
        selectCliente.innerHTML = '<option value="">Erro ao carregar clientes</option>';
    }
}

// ================= CARREGAR PRODUTOS NO SELECT =================
async function buscarProdutosSelect() {
    try {
        const { data: produtos, error } = await supabaseClient
            .from('produto')
            .select('produtoid, ds_produto, vl_venda_produto')
            .order('ds_produto', { ascending: true });

        if (error) throw error;

        listaProdutos = produtos;
        selectProduto.innerHTML = '<option value="">Selecione um Produto</option>';
        produtos.forEach(prod => {
            const opt = document.createElement('option');
            opt.value = prod.produtoid;
            opt.innerText = prod.ds_produto;
            selectProduto.appendChild(opt);
        });
    } catch (err) {
        selectProduto.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
}

// ================= LISTAR ORÇAMENTOS (Mestre + Item) =================
async function buscarOrcamentos() {
    try {
        tabelaCorpo.innerHTML = "<tr><td colspan='6'>Carregando orçamentos...</td></tr>";

        // Busca o item que liga ao mestre, trazendo os nomes das relações
        const { data: itens, error } = await supabaseClient
            .from('orcamento_item')
            .select('id_orcamento_item, id_orcamento, id_produto, qtd_produto, vl_unitario, orcamento(id_cliente, cliente(ds_nome_cliente)), produto(ds_produto)')
            .order('id_orcamento', { ascending: true });

        if (error) throw error;

        tabelaCorpo.innerHTML = "";

        if (itens.length === 0) {
            tabelaCorpo.innerHTML = "<tr><td colspan='6'>Nenhum orçamento cadastrado.</td></tr>";
            return;
        }

        itens.forEach(item => {
            const nomeCliente = item.orcamento && item.orcamento.cliente ? item.orcamento.cliente.ds_nome_cliente : 'Sem Cliente';
            const nomeProduto = item.produto ? item.produto.ds_produto : 'Sem Produto';
            const totalLinha = item.qtd_produto * item.vl_unitario;
            const idCliente = item.orcamento ? item.orcamento.id_cliente : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id_orcamento}</td>
                <td>${nomeCliente}</td>
                <td>${nomeProduto}</td>
                <td>${item.qtd_produto}</td>
                <td>R$ ${parseFloat(totalLinha).toFixed(2)}</td>
                <td>
                    <button class="btn-editar" onclick="prepararEdicao(${item.id_orcamento}, ${item.id_orcamento_item}, ${idCliente}, ${item.id_produto}, ${item.qtd_produto})">Editar</button>
                    <button class="btn-excluir" onclick="excluirOrcamento(${item.id_orcamento}, ${item.id_orcamento_item})">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tabelaCorpo.innerHTML = "<tr><td colspan='6'>Erro ao carregar dados do banco.</td></tr>";
    }
}

// ================= SALVAR OU ALTERAR ORÇAMENTO =================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem();

    const idMestre = inputId.value;
    const idItemVinculado = form.dataset.idItem; // Guarda o ID do item em edição na memória
    const clienteId = selectCliente.value;
    const produtoId = selectProduto.value;
    const qtd = parseInt(inputQtd.value);

    const produtoEscolhido = listaProdutos.find(p => p.produtoid == produtoId);
    const precoUnitario = produtoEscolhido ? parseFloat(produtoEscolhido.vl_venda_produto) : 0;
    const valorTotalCalculado = qtd * precoUnitario;

    try {
        if (idMestre) {
            // --- EDIÇÃO (UPDATE) ---
            // Atualiza o mestre
            const { error: errMestre } = await supabaseClient
                .from('orcamento')
                .update({ id_cliente: parseInt(clienteId), vl_total_orcamento: valorTotalCalculado })
                .eq('id_orcamento', idMestre);
            if (errMestre) throw errMestre;

            // Atualiza o item associado
            const { error: errItem } = await supabaseClient
                .from('orcamento_item')
                .update({ id_produto: parseInt(produtoId), qtd_produto: qtd, vl_unitario: precoUnitario })
                .eq('id_orcamento_item', idItemVinculado);
            if (errItem) throw errItem;

            exibirMensagem("Orçamento atualizado com sucesso!", "sucesso");
        } else {
            // --- CADASTRO (INSERT) ---
            // Insere o mestre primeiro
            const { data: novoMestre, error: errInsMestre } = await supabaseClient
                .from('orcamento')
                .insert([{ id_cliente: parseInt(clienteId), dt_orcamento: new Date().toISOString(), vl_total_orcamento: valorTotalCalculado }])
                .select();
            if (errInsMestre) throw errInsMestre;

            // Pega o ID gerado e joga no item
            const { error: errInsItem } = await supabaseClient
                .from('orcamento_item')
                .insert([{ id_orcamento: novoMestre[0].id_orcamento, id_produto: parseInt(produtoId), qtd_produto: qtd, vl_unitario: precoUnitario }]);
            if (errInsItem) throw errInsItem;

            exibirMensagem("Orçamento cadastrado com sucesso!", "sucesso");
        }

        resetarFormulario();
        buscarOrcamentos();

    } catch (err) {
        exibirMensagem("Erro ao salvar: " + err.message, "erro");
    }
});

// ================= PREPARAR EDIÇÃO =================
window.prepararEdicao = function(idMestre, idItem, idCliente, idProduto, quantidade) {
    limparMensagem();
    inputId.value = idMestre;
    form.dataset.idItem = idItem; // Guarda o ID do item
    selectCliente.value = idCliente || "";
    selectProduto.value = idProduto || "";
    inputQtd.value = quantidade;

    btnSalvar.innerText = "Atualizar Orçamento";
    btnCancelar.style.display = "inline-block";
};

btnCancelar.addEventListener('click', resetarFormulario);

function resetarFormulario() {
    form.reset();
    inputId.value = "";
    delete form.dataset.idItem;
    btnSalvar.innerText = "Salvar Orçamento";
    btnCancelar.style.display = "none";
}

// ================= EXCLUIR ORÇAMENTO =================
window.excluirOrcamento = async function(idMestre, idItem) {
    limparMensagem();
    if (!confirm(`Deseja realmente excluir o orçamento ID ${idMestre}?`)) return;

    try {
        // Deleta o item primeiro por causa do relacionamento de FK
        await supabaseClient.from('orcamento_item').delete().eq('id_orcamento_item', idItem);
        // Deleta o cabeçalho
        const { error } = await supabaseClient.from('orcamento').delete().eq('id_orcamento', idMestre);

        if (error) throw error;

        exibirMensagem("Orçamento excluído com sucesso!", "sucesso");
        buscarOrcamentos();
    } catch (err) {
        exibirMensagem("Erro ao excluir: " + err.message, "erro");
    }
};