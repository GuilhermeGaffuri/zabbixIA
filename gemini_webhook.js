var GeminiAI = {
    config: {},
    
    configure: function (options) {
        if (typeof options !== 'object' || !options.api_key || typeof options.api_key !== 'string' || options.api_key.trim() === '') {
            throw '[GeminiAI] A chave da API (api_key) é obrigatória e deve ser uma string válida.';
        }

        this.config.api_key = options.api_key.trim();
        this.config.url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    },

    sendPrompt: function (payload) {
        if (!this.config.api_key) {
            throw '[GeminiAI] API key não configurada.';
        }

        var http = new HttpRequest();
        http.addHeader('Content-Type: application/json');

        var fullUrl = this.config.url + '?key=' + this.config.api_key;
        Zabbix.log(4, '[GeminiAI] Enviando para: ' + fullUrl);
        Zabbix.log(4, '[GeminiAI] Corpo da requisição:\n' + JSON.stringify(payload));

        var rawResponse = http.post(fullUrl, JSON.stringify(payload));
        var status = http.getStatus();
        Zabbix.log(4, '[GeminiAI] Status da resposta: ' + status);
        Zabbix.log(4, '[GeminiAI] Corpo da resposta:\n' + rawResponse);

        if (status < 200 || status >= 300) {
            throw '[GeminiAI] Falha na requisição. Código de status: ' + status;
        }

        try {
            return JSON.parse(rawResponse);
        } catch (e) {
            throw '[GeminiAI] Erro ao interpretar a resposta JSON.';
        }
    }
};

try {
    var input = JSON.parse(value);

    // Validação de parâmetros obrigatórios
    var obrigatorios = ['api_key', 'alert_subject'];
    obrigatorios.forEach(function (campo) {
        if (!input[campo] || typeof input[campo] !== 'string' || input[campo].trim() === '') {
            throw '[Validação] Campo obrigatório ausente ou inválido: ' + campo;
        }
    });

    GeminiAI.configure({ api_key: input.api_key });

    var prompt = {
        contents: [{
            parts: [{
                text:
                    `O alerta: ${input.alert_subject} ocorreu no Zabbix.\n\n` +
                    `Sugira possíveis causas e soluções para resolver o problema.\n` +
                    `Limite sua resposta a até 10 linhas.\nInclua:\n- Causas prováveis\n- Ideias de diagnóstico\n- Comandos úteis\n- Ações preventivas.`
            }]
        }]
    };

    var resposta = GeminiAI.sendPrompt(prompt);
    var saida = (resposta && resposta.candidates && resposta.candidates[0]?.content?.parts?.[0]?.text || '').trim();

    if (!saida) {
        throw '[GeminiAI] Nenhuma resposta útil recebida da IA.';
    }

    return saida;

} catch (erro) {
    Zabbix.log(3, '[Gemini Webhook] ERRO: ' + erro);
    throw 'Falha ao processar com a IA: ' + erro;
}
