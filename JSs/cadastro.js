console.log("O arquivo cadastro.js foi carregado com sucesso pelo HTML!");

const SUPABASE_URL = "https://bqvwlzsuugzxefynabxd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_R4MYeG-PbPt549L3HdG9PA_RLP97mOI";

const supabaseClient = supabase.createClient(
    SUPABASE_URL, 
    SUPABASE_ANON_KEY
);

const form = document.getElementById('form-registro');
const statusMsg = document.getElementById('status-msg');

if (!form) {
    console.error("ERRO: O JavaScript não encontrou nenhuma tag <form id='form-registro'> no seu HTML!");
}

form.addEventListener('submit', async (evento) => {
    evento.preventDefault(); 
    
    if (statusMsg) {
        statusMsg.className = "mensagem";
        statusMsg.innerText = "";
        statusMsg.style.display = "none"; 
    }

    const emailDigitado = document.getElementById('login').value;
    const senhaDigitada = document.getElementById('senha').value;

    try {

        const { data: usuarioExistente, error: erroBusca } = await supabaseClient
            .from('usuarios')
            .select('usuario')
            .eq('usuario', emailDigitado);

        if (usuarioExistente && usuarioExistente.length > 0) {
            if (statusMsg) {
                statusMsg.innerText = "Este usuário já está cadastrado!";
                statusMsg.className = "erro"; 
                statusMsg.style.display = "block"; 
            }
            return; 
        }

        const { data, error } = await supabaseClient
            .from('usuarios') 
            .insert([
                { 
                    usuario: emailDigitado,       
                    nome_completo: emailDigitado, 
                    senha: senhaDigitada          
                }
            ]);

        if (error) {
            if (statusMsg) {
        
                if (error.code === '23505') {
                    statusMsg.innerText = "Este usuário já está cadastrado!";
                } else {
                    statusMsg.innerText = "Erro: " + error.message;
                }
                statusMsg.className = "erro"; 
                statusMsg.style.display = "block";
            }
        } else {
            if (statusMsg) {
                statusMsg.innerText = "Usuário cadastrado com sucesso!";
                statusMsg.className = "sucesso"; 
                statusMsg.style.display = "block";
            }
            form.reset(); 
        }

    } catch (err) {
        if (statusMsg) {
            statusMsg.innerText = "Erro ao conectar com o servidor.";
            statusMsg.className = "erro";
            statusMsg.style.display = "block";
        }
        console.error(err);
    }
});