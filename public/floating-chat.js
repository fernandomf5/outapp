/*!
 * Out App — Floating Chat Widget
 * Uso: <script src="https://outapp.com.br/floating-chat.js" data-agent-id="SEU_AGENT_ID"></script>
 * O widget cria um botão flutuante que abre o chat online em um painel (iframe).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Configuração a partir da tag <script> que carregou este arquivo
  // ---------------------------------------------------------------------------
  var scriptTag =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      for (var i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.indexOf('floating-chat.js') !== -1) {
          return scripts[i];
        }
      }
      return null;
    })();

  if (!scriptTag) {
    console.error('[OutApp Chat] Não foi possível localizar a tag do script.');
    return;
  }

  var agentId = scriptTag.getAttribute('data-agent-id');
  if (!agentId) {
    console.error('[OutApp Chat] Atributo data-agent-id ausente na tag do script.');
    return;
  }

  // Origem de onde o script foi carregado (funciona em outapp.com.br e previews)
  var origin = 'https://outapp.com.br';
  try {
    origin = new URL(scriptTag.src).origin;
  } catch (e) {
    /* mantém o padrão */
  }

  // O Chat Online usa a rota pública /chat-online/:agentId.
  // /chat/:id pertence ao antigo chatbot automatizado e pode exibir outro chat.
  var CHAT_URL =
    origin + '/chat-online/' + encodeURIComponent(agentId) + '?embedded=1';
  var WIDGET_ID = 'outapp-floating-chat-root';

  // Evita duplicar o widget se o script for incluído duas vezes
  if (document.getElementById(WIDGET_ID)) return;

  // ---------------------------------------------------------------------------
  // 2. Estilos (isolados, sem depender do CSS do site hospedeiro)
  // ---------------------------------------------------------------------------
  var css =
    '#' + WIDGET_ID + ' { all: initial; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }' +
    '#' + WIDGET_ID + ' .oa-btn {' +
    '  position: fixed; bottom: 20px; right: 20px; z-index: 2147483000;' +
    '  width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;' +
    '  background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff;' +
    '  display: flex; align-items: center; justify-content: center;' +
    '  box-shadow: 0 8px 24px rgba(0,0,0,.35);' +
    '  transition: transform .2s ease, box-shadow .2s ease;' +
    '}' +
    '#' + WIDGET_ID + ' .oa-btn:hover { transform: scale(1.08); box-shadow: 0 10px 28px rgba(0,0,0,.45); }' +
    '#' + WIDGET_ID + ' .oa-btn:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }' +
    '#' + WIDGET_ID + ' .oa-btn svg { width: 28px; height: 28px; fill: currentColor; }' +
    '#' + WIDGET_ID + ' .oa-panel {' +
    '  position: fixed; bottom: 92px; right: 20px; z-index: 2147483000;' +
    '  width: 380px; height: min(620px, calc(100vh - 120px));' +
    '  border-radius: 16px; overflow: hidden; background: #0f172a;' +
    '  box-shadow: 0 20px 60px rgba(0,0,0,.5); border: 1px solid rgba(255,255,255,.08);' +
    '  display: none; flex-direction: column;' +
    '  opacity: 0; transform: translateY(12px);' +
    '  transition: opacity .25s ease, transform .25s ease;' +
    '}' +
    '#' + WIDGET_ID + ' .oa-panel.oa-open { display: flex; opacity: 1; transform: translateY(0); }' +
    '#' + WIDGET_ID + ' .oa-iframe { width: 100%; height: 100%; border: none; flex: 1; background: #0f172a; }' +
    '@media (max-width: 480px) {' +
    '  #' + WIDGET_ID + ' .oa-panel {' +
    '    right: 0; left: 0; bottom: 0; width: 100%; height: 100dvh;' +
    '    border-radius: 0; border: none;' +
    '  }' +
    '  #' + WIDGET_ID + ' .oa-btn { bottom: 16px; right: 16px; }' +
    '}';

  var style = document.createElement('style');
  style.setAttribute('data-outapp-chat', 'true');
  style.textContent = css;

  // ---------------------------------------------------------------------------
  // 3. Elementos do widget
  // ---------------------------------------------------------------------------
  var root = document.createElement('div');
  root.id = WIDGET_ID;

  var panel = document.createElement('div');
  panel.className = 'oa-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Chat online');

  var iframe = document.createElement('iframe');
  iframe.className = 'oa-iframe';
  iframe.setAttribute('title', 'Chat online');
  // O src só é definido na primeira abertura (carregamento sob demanda)
  panel.appendChild(iframe);

  var button = document.createElement('button');
  button.className = 'oa-btn';
  button.type = 'button';
  button.setAttribute('aria-label', 'Abrir chat online');
  button.setAttribute('aria-expanded', 'false');

  var ICON_CHAT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-9 9H7V9h4v2zm6 0h-4V9h4v2z"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

  button.innerHTML = ICON_CHAT;
  root.appendChild(panel);
  root.appendChild(button);

  // ---------------------------------------------------------------------------
  // 4. Comportamento de abrir/fechar
  // ---------------------------------------------------------------------------
  var isOpen = false;
  var loaded = false;

  function openChat() {
    if (!loaded) {
      iframe.src = CHAT_URL;
      loaded = true;
    }
    isOpen = true;
    panel.classList.add('oa-open');
    button.innerHTML = ICON_CLOSE;
    button.setAttribute('aria-label', 'Fechar chat online');
    button.setAttribute('aria-expanded', 'true');
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('oa-open');
    button.innerHTML = ICON_CHAT;
    button.setAttribute('aria-label', 'Abrir chat online');
    button.setAttribute('aria-expanded', 'false');
  }

  button.addEventListener('click', function () {
    if (isOpen) closeChat(); else openChat();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) closeChat();
  });

  // ---------------------------------------------------------------------------
  // 5. Injeção no DOM (aguarda o body existir, ex.: script no <head>)
  // ---------------------------------------------------------------------------
  function mount() {
    document.head.appendChild(style);
    document.body.appendChild(root);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
