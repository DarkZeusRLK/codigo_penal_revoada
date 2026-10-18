# Tarefa: adicionar o tema "Halloween" à Calculadora Penal (Revoada)

Anexei 3 arquivos prontos: `halloween-fx.js`, `halloween-theme.css` e `demo.html` (referência funcionando — abra no navegador para ver o resultado esperado).

O site já tem alternância entre tema **claro** e **escuro**. Quero uma **terceira opção: Halloween**, sem quebrar os temas existentes.

## O que fazer

1. **Copie** `halloween-fx.js` e `halloween-theme.css` para a pasta de assets do projeto e inclua os dois em todas as páginas que usam o seletor de tema (CSS no `<head>`, JS antes do script que troca o tema).

2. **Estenda o seletor de tema existente** (descubra como ele funciona hoje: classe no `<html>`/`<body>`, `data-theme`, localStorage etc.):
   - Adicione a opção "🎃 Halloween" no mesmo lugar onde ficam Claro/Escuro (botão de engrenagem no canto superior direito).
   - Ao escolher Halloween: aplicar `data-theme="halloween"` no `<html>` (ou o mecanismo equivalente do projeto) e chamar
     `HalloweenFX.enable({ logo: '<seletor da imagem da logo REVOADA>' })`.
   - Ao sair do Halloween: chamar `HalloweenFX.disable()`.
   - Persistir a escolha do mesmo jeito que o projeto já persiste claro/escuro, e reaplicar ao carregar a página.

3. **Mapeie as cores**: em `halloween-theme.css`, seção 1, há os tokens `--hw-*`. Faça as variáveis que o site JÁ usa (as dos temas claro/escuro) receberem esses valores dentro de `:root[data-theme="halloween"]`. Se o site usa cores fixas em vez de variáveis, crie overrides com o seletor `[data-theme="halloween"]` para: fundo da página, painéis/cards, bordas, inputs, títulos de seção, cabeçalhos dos grupos de crimes, botões e o título "CALCULADORA PENAL" (gradiente laranja → âmbar com brilho). Mantenha o vermelho dos selos "INAFIANÇÁVEL", o vermelho da pena e o verde da multa. Use o `demo.html` como referência visual (painéis roxo-escuro translúcidos, borda laranja suave, teia pequena no canto dos painéis, ícones dos títulos em laranja).

4. **Camadas**: o efeito cria um `#hw-layer` fixo com `z-index: 0` atrás de tudo. Garanta que o conteúdo do site fique acima: aplique `position: relative; z-index: 1` no container principal da página (a classe utilitária `.hw-content-above` já faz isso). Modais, toasts, o player de música e o dropdown de tema devem continuar por cima.

5. **Chapéu de bruxa no "R" da logo**: é inserido automaticamente pelo `enable({ logo })`. Abra o arquivo da logo REVOADA no projeto, veja onde fica o "R" e ajuste no CSS do projeto:
   ```css
   .hw-hat { --hw-hat-x: 0.1; --hw-hat-y: 0.22; --hw-hat-size: 1.5; --hw-hat-rot: -14deg; }
   ```
   (`x` = centro do R em fração da largura da logo; `y` = onde a aba encosta, fração da altura; `size` = largura do chapéu em fração da altura da logo). Confira visualmente: a aba deve ficar apoiada no topo do R, levemente inclinada. Verifique se o cabeçalho tem espaço acima da logo para o chapéu não ser cortado.

6. **Não altere** a lógica da calculadora, os cálculos, os crimes, a integração com Discord/FiveM nem os temas claro/escuro.

## O que o efeito já faz (não precisa reimplementar)
- Cavaleiro sem cabeça em pixel art, com abóbora em chamas, cruza a parte de baixo da tela a cada 22–45 s (direção aleatória).
- Túmulos nas laterais; a cada 14–30 s um zumbi policial sai da cova (mão primeiro, depois a outra, puxa o corpo), olha para os lados, coça a cabeça e cai de volta.
- Teias com aranhas nos cantos, morcegos, lua, névoa, abóboras com brilho.
- Respeita `prefers-reduced-motion`, pausa quando a aba fica oculta e some em telas estreitas.
- Para testar no console: `HalloweenFX.ride()` e `HalloweenFX.zombie()`.

## Ao terminar
Rode o site, alterne Claro → Escuro → Halloween → Claro e confirme que: nada fica para trás ao sair do Halloween, a escolha persiste ao recarregar, a logo está com o chapéu no lugar certo e nenhum campo/botão ficou coberto pela camada de efeitos.
