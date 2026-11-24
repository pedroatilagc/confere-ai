# ConfereAí

To-do diária no estilo quadro negro. É um app desktop pessoal e offline, feito com Tauri 2, React, TypeScript e Vite.

## Rodar em desenvolvimento

```
npm install
npm run tauri dev
```

O Vite sobe em `localhost:1420` e o Tauri abre a janela nativa apontando para ele (com hot-reload).
Em dev o autostart **não** é registrado.

## Gerar o instalador

```
npm run tauri build
```

Sai em `src-tauri/target/release/bundle/nsis/ConfereAí_0.1.0_x64-setup.exe`. O instalador é por usuário e não pede admin.

## Onde ficam os dados

Em `%APPDATA%\com.confereai.app\` (ou seja, `C:\Users\<você>\AppData\Roaming\com.confereai.app\`):

- `tasks.json`: tarefas e notas (formato versionado, `version: 2`). Tarefas com mais de 7 dias são apagadas quando o app abre, junto com as notas.
- `config.json`: configurações do agente (chat autorizado, modelo, chave do OpenRouter). A chave do OpenRouter **fica em texto puro**, então não compartilhe esse arquivo.
- O **token do bot** não fica em arquivo: ele vai para o Gerenciador de Credenciais do Windows (entrada `com.confereai.app`).

São JSONs legíveis. Para fazer backup, basta copiar a pasta.

## Autostart

Na primeira execução do app instalado, ele se registra em
`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.
**Para desativar:** Gerenciador de Tarefas → *Aplicativos de inicialização* → ConfereAí → *Desabilitar*.

## Atalhos

`Ctrl+1..4` trocam a visão · `Ctrl+K` alterna lista/kanban/notas · `Ctrl+,` abre as configurações · `N` cria uma nova tarefa · `↑/↓` andam entre as tarefas · `Espaço` risca · `Enter`/`F2` editam · `Delete` apaga · `Ctrl+Shift+H` grifa na nota · `?` mostra a ajuda.

## Arquitetura

```
src/
  lib/tasks.ts        regras de negócio (funções puras), usadas pela UI e pelo agente
  lib/storage.ts      tasks.json (plugin-store) + migração de versão
  lib/config.ts       config.json (configurações do agente)
  state/              TaskContext (estado + gravação) e useAgentInbox (eventos do agente)
  components/, views/ interface
src-tauri/src/
  lib.rs              plugins (store, autostart) e comandos
  agent.rs            canal do agente (evento agent://commands)
  telegram.rs         long polling do bot, /start e respostas
  secrets.rs          token do bot no Gerenciador de Credenciais
```

### Agente do Telegram

O ConfereAí funciona **sem servidor**: o próprio app vai buscar as mensagens do seu bot.

```
Telegram ──getUpdates (long polling)──> app (Rust)
   ──AgentCommand[]──> evento agent://commands {id, cmds} ──> React (useAgentInbox)
   ──> applyCommands (mesmas regras da UI) ──> tasks.json
   ──agent_result──> Rust ──sendMessage──> Telegram (✓ / ✗ motivo)
```

- **Contrato:** `AgentCommand` em `src/types.ts`. Hoje só `add_task { text, date (hoje ou amanhã), status? }`.
- **Validação:** `applyCommands` (em `src/lib/tasks.ts`) trata tudo que chega como dado não confiável e devolve `{ tasks, applied, rejected }`.
- **Rede:** o polling roda no Rust (`reqwest` + `tokio`) e só acessa `api.telegram.org`. A CSP do webview continua fechada e o token nunca volta para o JavaScript.
- **Hoje, sem IA:** cada linha da mensagem vira uma tarefa de hoje. Comece a linha com `amanhã:` para agendar para amanhã. A interpretação por LLM (OpenRouter) vem depois.
- **Só com o app aberto:** o bot funciona com a janela aberta ou minimizada. Mensagens enviadas com o app fechado são lidas quando ele abre.
- **Testar sem bot (só em dev):** abra o DevTools (`Ctrl+Shift+I`) e rode
  `__inject([{ type: "add_task", text: "teste", date: "AAAA-MM-DD" }])`.

### Cada pessoa usa o próprio bot

Um bot do Telegram só pode ser lido por um programa por vez, então cada instalação precisa do seu:

1. No Telegram, fale com o **@BotFather** e envie `/newbot`.
2. Escolha um nome e um usuário (terminado em `bot`). Ele responde com um **token**.
3. No ConfereAí, abra `Ctrl+,` (ou a engrenagem), cole o token, clique em **Salvar** e ligue **Agente ativo**.
4. Envie `/start` ao seu bot. Só esse chat fica autorizado; para trocar, use **Desvincular**.
5. Mande as tarefas, uma por linha.
