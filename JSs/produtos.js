const SUPABASE_URL = "https://bqvwlzsuugzxefynabxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_R4MYeG-PbPt549L3HdG9PA_RLP97mOI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('form-produto');
const statusMsg = document.getElementById('status-msg');
const tabelaCorpo = document.getElementById('tabela-produtos-corpo');
const selectCategoria = document.getElementById('select_categoria');

const inputId = document.getElementById('produto-id');
const inputNome = document.getElementById('nome_produto');
const inputPreco = document.getElementById('preco_produto');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');

document.addEventListener('DOMContentLoaded', async () => {
    await buscarCategoriasSelect();
    await buscarProdutos();        
});

function exibirMensagem(texto, tipo) {
    if (statusMsg) {
        statusMsg.innerText = texto;
        statusMsg.className = tipo;
        statusMsg.style.display = "block";
    }
}

function limparMensagem() {
    if (statusMsg) {
        statusMsg.style.display = "none";
        statusMsg.innerText = "";
    }
}

async function buscarCategoriasSelect() {
    try {
        const { data: categorias, error } = await supabaseClient
            .from('categoria')
            .select('categoriaprodutoid, ds_categoria_produto')
            .order('ds_categoria_produto', { ascending: true });

        if (error) throw error;

        selectCategoria.innerHTML = '<option value="">Selecione uma Categoria</option>';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.categoriaprodutoid;
            opt.innerText = cat.ds_categoria_produto;
            selectCategoria.appendChild(opt);
        });
    } catch (err) {
        console.error("Erro ao carregar categorias:", err);
        selectCategoria.innerHTML = '<option value="">Erro ao carregar categorias</option>';
    }
}

async function buscarProdutos() {
    try {
        tabelaCorpo.innerHTML = "<tr><td colspan='5'>A carregar produtos...</td></tr>";

        const { data: produtos, error } = await supabaseClient
            .from('produto')
            .select('produtoid, ds_produto, vl_venda_produto, categoriaprodutoid, categoria(ds_categoria_produto)')
            .order('produtoid', { ascending: true });

        if (error) throw error;

        tabelaCorpo.innerHTML = "";

        if (produtos.length === 0) {
            tabelaCorpo.innerHTML = "<tr><td colspan='5'>Nenhum produto cadastrado.</td></tr>";
            return;
        }

        produtos.forEach(prod => {
            const nomeCategoria = prod.categoria ? prod.categoria.ds_categoria_produto : 'Sem Categoria';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.produtoid}</td>
                <td>${prod.ds_produto}</td>
                <td>R$ ${parseFloat(prod.vl_venda_produto).toFixed(2)}</td>
                <td>${nomeCategoria}</td>
                <td>
                    <button class="btn-editar" onclick="prepararEdicao(${prod.produtoid}, '${prod.ds_produto.replace(/'/g, "\\'")}', ${prod.vl_venda_produto}, ${prod.categoriaprodutoid})">Editar</button>
                    <button class="btn-excluir" onclick="excluirProduto(${prod.produtoid})">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tabelaCorpo.innerHTML = "<tr><td colspan='5'>Erro ao carregar dados do banco.</td></tr>";
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem();

    const id = inputId.value;
    const nome = inputNome.value;
    const preco = parseFloat(inputPreco.value);
    const categoriaId = selectCategoria.value;

    try {
        const dadosProduto = {
            ds_produto: nome,
            vl_venda_produto: preco,
            categoriaprodutoid: categoriaId ? parseInt(categoriaId) : null
        };

        if (id) {
            const { error } = await supabaseClient
                .from('produto')
                .update(dadosProduto)
                .eq('produtoid', id);

            if (error) throw error;
            exibirMensagem("Produto atualizado com sucesso!", "sucesso");
        } else {
            dadosProduto.dt_cadastro_produto = new Date().toISOString();
            dadosProduto.status_produto = "Ativo";                      

            const { error } = await supabaseClient
                .from('produto')
                .insert([dadosProduto]);

            if (error) throw error;
            exibirMensagem("Produto cadastrado com sucesso!", "sucesso");
        }

        resetarFormulario();
        buscarProdutos();

    } catch (err) {
        exibirMensagem("Erro ao salvar: " + err.message, "erro");
        console.error(err);
    }
});

window.prepararEdicao = function(id, nome, preco, categoriaId) {
    limparMensagem();
    inputId.value = id;
    inputNome.value = nome;
    inputPreco.value = preco;
    selectCategoria.value = categoriaId || "";

    btnSalvar.innerText = "Atualizar Produto";
    if (btnCancelar) btnCancelar.style.display = "inline-block";
};

if (btnCancelar) {
    btnCancelar.addEventListener('click', resetarFormulario);
}

function resetarFormulario() {
    form.reset();
    inputId.value = "";
    btnSalvar.innerText = "Salvar Produto";
    if (btnCancelar) btnCancelar.style.display = "none";
}

window.excluirProduto = async function(id) {
    limparMensagem();
    
    if (!confirm(`Deseja realmente excluir o produto ID ${id}?`)) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('produto')
            .delete()
            .eq('produtoid', id);

        if (error) throw error;

        exibirMensagem("Produto excluído com sucesso!", "sucesso");
        buscarProdutos();

    } catch (err) {
        exibirMensagem("Erro ao excluir: " + err.message, "erro");
        console.error(err);
    }
};