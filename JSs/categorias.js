const SUPABASE_URL = "https://bqvwlzsuugzxefynabxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_R4MYeG-PbPt549L3HdG9PA_RLP97mOI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('form-categoria');
const statusMsg = document.getElementById('status-msg');
const tabelaCorpo = document.getElementById('tabela-categorias-corpo');

const inputId = document.getElementById('categoria-id');
const inputDescricao = document.getElementById('descricao_categoria');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');

document.addEventListener('DOMContentLoaded', buscarCategorias);

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

async function buscarCategorias() {
    try {
        tabelaCorpo.innerHTML = "<tr><td colspan='3'>A carregar categorias...</td></tr>";

        const { data: categorias, error } = await supabaseClient
            .from('categoria')
            .select('*')
            .order('categoriaprodutoid', { ascending: true });

        if (error) throw error;

        tabelaCorpo.innerHTML = "";

        if (categorias.length === 0) {
            tabelaCorpo.innerHTML = "<tr><td colspan='3'>Nenhuma categoria cadastrada.</td></tr>";
            return;
        }

        categorias.forEach(cat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cat.categoriaprodutoid}</td>
                <td>${cat.ds_categoria_produto}</td>
                <td>
                    <button class="btn-editar" onclick="prepararEdicao(${cat.categoriaprodutoid}, '${cat.ds_categoria_produto.replace(/'/g, "\\'")}')">Editar</button>
                    <button class="btn-excluir" onclick="excluirCategoria(${cat.categoriaprodutoid})">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tabelaCorpo.innerHTML = "<tr><td colspan='3'>Erro ao carregar dados do banco.</td></tr>";
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparMensagem();

    const id = inputId.value;
    const descricao = inputDescricao.value;

    try {
        if (id) {
            const { error } = await supabaseClient
                .from('categoria')
                .update({ ds_categoria_produto: descricao })
                .eq('categoriaprodutoid', id);

            if (error) throw error;
            exibirMensagem("Categoria atualizada com sucesso!", "sucesso");
        } else {
            const { error } = await supabaseClient
                .from('categoria')
                .insert([{ ds_categoria_produto: descricao }]);

            if (error) throw error;
            exibirMensagem("Categoria cadastrada com sucesso!", "sucesso");
        }

        resetarFormulario();
        buscarCategorias();

    } catch (err) {
        exibirMensagem("Erro ao salvar: " + err.message, "erro");
        console.error(err);
    }
});

window.prepararEdicao = function(id, descricao) {
    limparMensagem();
    inputId.value = id;
    inputDescricao.value = descricao;

    btnSalvar.innerText = "Atualizar Categoria";
    if (btnCancelar) btnCancelar.style.display = "inline-block";
};

if (btnCancelar) {
    btnCancelar.addEventListener('click', resetarFormulario);
}

function resetarFormulario() {
    form.reset();
    inputId.value = "";
    btnSalvar.innerText = "Salvar Categoria";
    if (btnCancelar) btnCancelar.style.display = "none";
}

window.excluirCategoria = async function(id) {
    limparMensagem();
    
    if (!confirm(`Deseja realmente excluir a categoria ID ${id}?`)) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('categoria')
            .delete()
            .eq('categoriaprodutoid', id);

        if (error) throw error;

        exibirMensagem("Categoria excluída com sucesso!", "sucesso");
        buscarCategorias();

    } catch (err) {
        exibirMensagem("Erro ao excluir: " + err.message, "erro");
        console.error(err);
    }
};