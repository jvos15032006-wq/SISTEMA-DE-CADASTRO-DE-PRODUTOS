const SUPABASE_URL = "https://bqvwlzsuugzxefynabxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_R4MYeG-PbPt549L3HdG9PA_RLP97mOI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('form-cliente');
const statusMsg = document.getElementById('status-msg');
const tabelaCorpo = document.getElementById('tabela-clientes-corpo');

const inputId = document.getElementById('cliente-id');
const selectTipo = document.getElementById('tipo_cliente');
const inputCpfCnpj = document.getElementById('cpf_cnpj_cliente');
const inputNome = document.getElementById('nome_cliente');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');

document.addEventListener('DOMContentLoaded', buscarClientes);

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

async function buscarClientes() {
    try {
        tabelaCorpo.innerHTML = "<tr><td colspan='5'>A carregar clientes...</td></tr>";

        const { data: clientes, error } = await supabaseClient
            .from('cliente') 
            .select('*')
            .order('clienteid', { ascending: true });

        if (error) throw error;

        tabelaCorpo.innerHTML = "";

        if (clientes.length === 0) {
            tabelaCorpo.innerHTML = "<tr><td colspan='5'>Nenhum cliente cadastrado.</td></tr>";
            return;
        }

        clientes.forEach(cli => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cli.clienteid}</td>
                <td>${cli.tipo_cliente}</td>
                <td>${cli.cpf_cnpj_cliente}</td>
                <td>${cli.nome_cliente}</td>
                <td>
                    <button class="btn-editar" onclick="prepararEdicao(${cli.clienteid}, '${cli.tipo_cliente}', '${cli.cpf_cnpj_cliente}', '${cli.nome_cliente}')">Editar</button>
                    <button class="btn-excluir" onclick="excluirCliente(${cli.clienteid})">Excluir</button>
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
    const tipo = selectTipo.value;
    const cpfCnpj = inputCpfCnpj.value;
    const nome = inputNome.value;

    try {
        if (id) {
            const { error } = await supabaseClient
                .from('cliente')
                .update({ tipo_cliente: tipo, cpf_cnpj_cliente: cpfCnpj, nome_cliente: nome })
                .eq('clienteid', id);

            if (error) throw error;
            exibirMensagem("Cliente atualizado com sucesso!", "sucesso");
        } else {
            const { error } = await supabaseClient
                .from('cliente')
                .insert([{ tipo_cliente: tipo, cpf_cnpj_cliente: cpfCnpj, nome_cliente: nome }]);

            if (error) throw error;
            exibirMensagem("Cliente cadastrado com sucesso!", "sucesso");
        }

        resetarFormulario();
        buscarClientes(); 

    } catch (err) {
        exibirMensagem("Erro ao salvar: " + err.message, "erro");
        console.error(err);
    }
});

window.prepararEdicao = function(id, tipo, cpfCnpj, nome) {
    limparMensagem();
    inputId.value = id;
    selectTipo.value = tipo;
    inputCpfCnpj.value = cpfCnpj;
    inputNome.value = nome;

    btnSalvar.innerText = "Atualizar Dados";
    btnCancelar.style.display = "inline-block";
};

btnCancelar.addEventListener('click', resetarFormulario);

function resetarFormulario() {
    form.reset();
    inputId.value = "";
    btnSalvar.innerText = "Salvar Cliente";
    btnCancelar.style.display = "none";
}

window.excluirCliente = async function(id) {
    limparMensagem();
    
    if (!confirm(`Tem certeza de que deseja excluir o cliente ID ${id}?`)) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('cliente')
            .delete()
            .eq('clienteid', id);

        if (error) throw error;

        exibirMensagem("Cliente excluído com sucesso!", "sucesso");
        buscarClientes(); 

    } catch (err) {
        exibirMensagem("Erro ao excluir: " + err.message, "erro");
        console.error(err);
    }
};