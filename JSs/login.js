console.log("O arquivo login.js foi carregado com sucesso!");

const SUPABASE_URL = "https://bqvwlzsuugzxefynabxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_R4MYeG-PbPt549L3HdG9PA_RLP97mOI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('form-login');
const statusMsg = document.getElementById('status-msg');

if (!form) {
    console.error("ERRO: Formulário de login não encontrado no HTML!");
}

form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); 

    if (statusMsg) {
        statusMsg.className = "";
        statusMsg.innerText = "";
        statusMsg.style.display = "none";
    }

    const usuarioDigitado = document.getElementById('usuario').value;
    const senhaDigitada = document.getElementById('password').value;

    try {
        const { data: linhasEncontradas, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('usuario', usuarioDigitado);

        if (error) {
            throw error;
        }

        if (!linhasEncontradas || linhasEncontradas.length === 0) {
            if (statusMsg) {
                statusMsg.innerText = "Usuário não encontrado!";
                statusMsg.className = "erro";
                statusMsg.style.display = "block";
            }
            return;
        }

        const dadosUsuario = linhasEncontradas[0];

        if (dadosUsuario.senha !== senhaDigitada) {
            if (statusMsg) {
                statusMsg.innerText = "Senha incorreta!";
                statusMsg.className = "erro";
                statusMsg.style.display = "block";
            }
            return;
        }

        if (statusMsg) {
            statusMsg.innerText = "Login realizado com sucesso! Entrando...";
            statusMsg.className = "sucesso";
            statusMsg.style.display = "block";
        }

        window.location.href = "http://127.0.0.1:3000/PROJETO_FINAL_ACCION/menu/menu.html?vscode-livepreview=true";

    } catch (err) {
        if (statusMsg) {
            statusMsg.innerText = "Erro ao conectar com o banco de dados.";
            statusMsg.className = "erro";
            statusMsg.style.display = "block";
        }
        console.error(err);
    }
});
