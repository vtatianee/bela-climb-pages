# Bela Climb — contexto do projeto

Jogo de estilingue vertical (HTML5 + Canvas + JS puro, sem imagens: tudo é
desenhado por código em `js/render.js`), empacotado para iOS com Capacitor.
Conversar com a usuária em português.

## Build e testes
- `npm run build` só atualiza `www/`. Para o app iOS é preciso `npm run sync`
  (ou `npx cap copy ios`), senão `ios/App/App/public/` fica desatualizado.
- Ao mudar CSS/JS, incremente o `?v=N` em `index.html` (cache do navegador).
- Teste no celular de qualquer lugar: https://vtatianee.github.io/bela-climb-pages/
  (GitHub Pages, branch `main`, raiz; atualiza ~1 min após o push).
  No navegador a compra é simulada (`js/iap.js` usa mock) e não há haptics.

## Compra no app (IAP)
- Produto não-consumível `com.vtatianee.belaclimb.fullunlock`; grátis até a
  fase 1-3 (`FREE_SUBS` em `js/game.js`).
- O iPhone físico da usuária tem posse "presa" do produto na conta Apple real;
  para testar o paywall lá é preciso outra Apple ID em Mídia e Compras.

## Pendências antes do próximo envio à Apple
- Remover o `webView?.isInspectable = true` TEMPORÁRIO em
  `ios/App/App/BelaBridgeViewController.swift`.
- Decidir se o esquema do Xcode volta a usar `BelaClimb.storekit`
  (foi removido de `App.xcscheme` para testar sandbox real).
- Vídeo da compra para a revisão da Apple (Guideline 2.1) ainda não gravado.

## Redesign da interface (em andamento)
Direção: cartoon com muito movimento, mantendo a identidade atual.
1. Sensação de jogo (FEITA, em `js/juice.js`): squash & stretch da Bela,
   expressões (mira, susto, piscada), tremor de tela, poeira, plataforma que
   afunda, arco de força ao redor da Bela. Só visual: não mexe em hitbox.
2. Mundo: plataformas temáticas por bioma, fundo em camadas com parallax,
   cores mais saturadas.
3. Comemoração e UI: confete, estrelas animadas, tela inicial animada,
   botões "apertáveis".
O Figma está conectado (MCP) para telas, arte dos biomas e material da loja.
