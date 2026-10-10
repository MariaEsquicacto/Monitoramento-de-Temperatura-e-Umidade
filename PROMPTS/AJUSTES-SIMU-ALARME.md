Você é um engenheiro de software full stack sênior, trabalhando em uma aplicação de monitoramento de salas com React (ou o framework já existente no projeto), Firebase Firestore como banco de dados e gráficos de séries temporais de temperatura e umidade.

Preciso que você implemente, no painel de administração, um botão de **simulação de alarme** para as salas, com as seguintes regras:

**Comportamento do botão de simulação**
- Ao clicar no botão pela primeira vez, a simulação deve iniciar. Ela gera valores fictícios de temperatura e umidade para as salas, com pelo menos um pico de temperatura acima do limite configurado e uma queda de umidade abaixo do limite configurado, para que os dois alertas sejam acionados.
- Ao iniciar, deve aparecer um alerta visível de **temperatura acima do limite** e um alerta visível de **umidade abaixo do limite**, indicando de forma clara que se trata de uma simulação.
- Os gráficos de temperatura e umidade devem exibir os picos gerados pela simulação, destacando visualmente os pontos que ultrapassam os limites (por exemplo, com cor de alerta e marcador no ponto).
- Ao clicar novamente no botão, a simulação deve parar: os dados simulados somem da visualização, os alertas são removidos e o botão volta ao estado inicial.

**Regra crítica de persistência**
- Durante a simulação, **nenhum dado pode ser gravado no Firebase**. Nenhuma escrita, atualização ou criação de documento deve ocorrer em decorrência dos dados simulados. Os valores simulados devem existir apenas em estado local da interface (memória do cliente) e ser descartados ao parar a simulação.
- Verifique explicitamente que as chamadas de escrita do Firestore (`setDoc`, `addDoc`, `updateDoc`, `set`, `push` etc.) não são acionadas pelo fluxo de simulação, inclusive por listeners ou efeitos colaterais existentes que processem leituras de sensores.
- Os dados reais das salas, quando a simulação estiver inativa, continuam funcionando normalmente, sem alteração.

**Escopo**
- Altere apenas o necessário para implementar o botão, os alertas, a exibição dos picos nos gráficos e a lógica de parada. Não refatore outras partes da aplicação.
- Reutilize os componentes de gráfico, alerta e botão já existentes no projeto, seguindo os mesmos padrões de estilo e de código.
- Os limites de temperatura e umidade devem ser lidos da configuração já existente da sala; se não houver, use os valores que o projeto já adota como padrão.

**Entrega esperada**
- Código pronto para uso, com os trechos alterados identificados por arquivo.
- Um teste ou verificação que comprove que a simulação não dispara escrita no Firebase e que a parada restaura o estado normal.

Escreva a interface e as mensagens de alerta em português do Brasil.