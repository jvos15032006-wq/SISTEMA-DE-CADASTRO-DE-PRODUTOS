const supabaseClient = criarSupabaseClient();

const form = document.getElementById("form-registro");
const idInput = document.getElementById("usuario-id");
const loginInput = document.getElementById("login");
const senhaInput = document.getElementById("senha");
const confirmarSenhaInput = document.getElementById("confirmar-senha");

const statusMsg = document.getElementById("status-msg");
const tabelaCorpo = document.getElementById("tabela-usuarios-corpo");
const searchInput = document.getElementById("search-input");
const searchFilter = document.getElementById("search-filter");

const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");
const btnSubmitForm = document.getElementById("btn-submit-form");
const tituloForm = document.getElementById("titulo-form");

function exibirMensagem(texto, tipo) {
    exibirMensagemStatus(statusMsg, texto, tipo);
}

function limparMensagem() {
    limparMensagemStatus(statusMsg);
}

async function atualizarDashboard() {
    try {
        const { data: todosUsuarios, error } = await supabaseClient
            .from("usuarios")
            .select("id");

        if (error) throw error;

        const totalGeral = todosUsuarios ? todosUsuarios.length : 0;
        document.getElementById("stat-total").textContent = totalGeral;
    } catch (err) {
        console.error("Erro ao carregar metricas do dashboard:", err);
        document.getElementById("stat-total").textContent = "0";
    }
}

async function carregarUsuarios() {
    try {
        tabelaCorpo.innerHTML = "<tr><td colspan='3'>Carregando usuarios...</td></tr>";

        const termo = obterTermoPesquisa(searchInput);
        const filtro = obterFiltroPesquisa(searchFilter);

        let query = supabaseClient.from("usuarios").select("id, usuario");

        if (termo !== "") {
            if (filtro === "id") {
                const resultado = aplicarFiltroId(query, "id", termo);
                if (resultado.erro) {
                    tabelaCorpo.innerHTML = `<tr><td colspan='3'>${resultado.erro}</td></tr>`;
                    return;
                }
                query = resultado.query;
            } else if (filtro === "usuario") {
                query = query.ilike("usuario", `%${termo}%`);
            } else {
                query = aplicarFiltroTodos(query, termo, ["usuario"], "id");
            }
        }

        const { data: usuarios, error } = await query.order("usuario", { ascending: true });
        if (error) throw error;

        tabelaCorpo.innerHTML = "";

        if (!usuarios || usuarios.length === 0) {
            tabelaCorpo.innerHTML = "<tr><td colspan='3'>Nenhum usuario encontrado.</td></tr>";
            return;
        }
      
usuarios.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${user.id}</td>
        <td>${escaparTexto(user.usuario)}</td>
        <td>
            <button type="button" class="btn-editar" onclick="prepararEdicao(${user.id}, '${escaparParametro(user.usuario)}')">Editar</button>
            <button type="button" class="btn-excluir" onclick="deletarUsuario(${user.id}, '${escaparParametro(user.usuario)}')">Excluir</button>
        </td>
    `;
    tabelaCorpo.appendChild(tr);
});
    } catch (err) {
        console.error("Erro ao listar usuarios:", err);
        tabelaCorpo.innerHTML = "<tr><td colspan='3'>Erro ao carregar dados do banco.</td></tr>";
    }
}

window.prepararEdicao = function (id, nomeUsuario) {
    idInput.value = id;
    loginInput.value = nomeUsuario;
    senhaInput.value = "";
    confirmarSenhaInput.value = "";

    tituloForm.textContent = "Editar Usuario";
    btnSubmitForm.textContent = "Atualizar Usuario";
    btnSubmitForm.style.backgroundColor = "#2563eb";
    btnCancelarEdicao.style.display = "block";

    limparMensagem();
    loginInput.focus();
};

if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => resetarFormulario());
}

function resetarFormulario() {
    form.reset();
    idInput.value = "";
    tituloForm.textContent = "Cadastrar Novo Usuario";
    btnSubmitForm.textContent = "Salvar Usuario";
    btnSubmitForm.style.backgroundColor = "#2563eb";
    btnCancelarEdicao.style.display = "none";
    limparMensagem();
}

window.deletarUsuario = async function (id, nome) {
    if (!confirm(`Tem certeza que deseja remover o acesso de "${nome}"?`)) return;

    try {
        const { error } = await supabaseClient.from("usuarios").delete().eq("id", id);
        if (error) throw error;

        await resetarSequenciaTabela(supabaseClient, "usuarios", "id");
        exibirMensagem("Usuario removido com sucesso!", "sucesso");
        await carregarUsuarios();
        await atualizarDashboard();
    } catch (err) {
        exibirMensagem("Erro ao deletar: " + err.message, "erro");
    }
};

if (form) {
    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        evento.stopPropagation();
        limparMensagem();

        const idDestino = idInput.value;
        const loginDigitado = loginInput.value.trim();
        const senhaDigitada = senhaInput.value;
        const confirmarSenhaDigitada = confirmarSenhaInput.value;

        if (!loginDigitado) {
            exibirMensagem("Informe o nome ou e-mail de acesso.", "erro");
            return;
        }

        if (senhaDigitada.length < 6) {
            exibirMensagem("A senha precisa ter no minimo 6 caracteres!", "erro");
            return;
        }

        if (senhaDigitada !== confirmarSenhaDigitada) {
            exibirMensagem("As duas senhas precisam ser iguais!", "erro");
            return;
        }

        try {
            if (idDestino) {
                const { error } = await supabaseClient
                    .from("usuarios")
                    .update({
                        usuario: loginDigitado,
                        senha: senhaDigitada
                    })
                    .eq("id", idDestino);

                if (error) throw error;
                exibirMensagem("Usuario atualizado com sucesso!", "sucesso");
            } else {
                const { error } = await supabaseClient
                    .from("usuarios")
                    .insert([{
                        usuario: loginDigitado,
                        senha: senhaDigitada
                    }]);

                if (error) throw error;
                exibirMensagem("Novo usuario cadastrado com sucesso!", "sucesso");
            }

            resetarFormulario();
            await carregarUsuarios();
            await atualizarDashboard();
        } catch (err) {
            exibirMensagem("Erro ao salvar no banco de dados.", "erro");
            console.error("Erro capturado no envio:", err);
        }
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    await atualizarDashboard();
    await carregarUsuarios();
    configurarPesquisa(searchInput, searchFilter, carregarUsuarios);
    configurarBotaoSair();
});
