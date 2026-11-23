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

`%APPDATA%\com.confereai.app\tasks.json`, ou seja, `C:\Users\<você>\AppData\Roaming\com.confereai.app\tasks.json`.
É um JSON legível. Para fazer backup, basta copiar o arquivo. Tarefas com mais de 7 dias são apagadas quando o app abre.

## Autostart

Na primeira execução do app instalado, ele se registra em
`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`.
**Para desativar:** Gerenciador de Tarefas → *Aplicativos de inicialização* → ConfereAí → *Desabilitar*.

## Atalhos

`Ctrl+1..4` trocam a visão · `Ctrl+K` alterna lista/kanban · `N` cria uma nova tarefa · `↑/↓` andam entre as tarefas · `Espaço` risca · `Enter`/`F2` editam · `Delete` apaga · `?` mostra a ajuda.
