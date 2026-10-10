Você é um engenheiro de software sênior com experiência em sistemas IoT e aplicações web em tempo real, trabalhando com Firebase. Desenvolva a aplicação descrita abaixo, entregando código funcional, organizado e pronto para execução.

**Contexto:** Um hospital precisa monitorar continuamente a temperatura e a umidade de duas salas que armazenam equipamentos médicos. Parâmetros fora da faixa podem comprometer a conservação e o funcionamento desses equipamentos, por isso o monitoramento precisa ser confiável e a identificação de anomalias, imediata.

**Requisitos funcionais:**

1. **Ingestão de dados:** receba leituras de temperatura e umidade dos sensores instalados nas duas salas e persista-as no Firebase. Avalie a escolha entre Cloud Firestore e Realtime Database com base nos requisitos de baixa latência, atualização em tempo real e volume de armazenamento, e justifique a escolha no código ou na documentação.

2. **Faixas operacionais:** defina faixas normais de temperatura e umidade para cada sala, considerando os requisitos técnicos típicos de equipamentos médicos. Torne esses limites configuráveis pelo administrador e explicite os valores padrão adotados.

3. **Alertas:** quando um valor ultrapassar o limite mínimo ou máximo, identifique a condição anormal e exiba um alerta visual destacado na interface, com a sala, a grandeza e o valor afetado.

4. **Indicadores estatísticos:** calcule e apresente média aritmética, mediana e desvio padrão para temperatura e umidade, por sala, sobre o conjunto de dados selecionado.

5. **Gráficos:** implemente gráficos com atualização em tempo real e gráficos históricos que permitam acompanhar a evolução no tempo, comparar as duas salas e identificar tendências ou ocorrências fora dos limites.

6. **Autenticação e controle de acesso:** implemente dois níveis de usuário. O **Administrador** pode consultar dados, indicadores, gráficos e históricos, e também alterar os limites mínimos e máximos de temperatura e umidade. O **Usuário Comum** pode apenas visualizar as informações, sem qualquer permissão de alteração. Aplique essas restrições também nas regras de segurança do Firebase, não apenas na interface.

7. **Interface:** produza uma interface intuitiva, responsiva e clara, priorizando a legibilidade das informações, a identificação rápida de alertas e a visualização em tempo real.

**Requisitos não funcionais:** trate segurança dos dados, controle de permissões, persistência confiável das leituras e robustez do monitoramento. Prever o comportamento quando um sensor deixar de enviar dados é desejável.

**Entregáveis esperados:** código-fonte completo e organizado, arquivo de regras de segurança do Firebase, instruções de configuração e execução, e breve justificativa técnica da escolha do banco de dados e das faixas padrão adotadas.

Responda em português brasileiro.