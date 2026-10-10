Você é um engenheiro de software full-stack sênior especializado em aplicações web modernas com Firebase. Construa uma aplicação web completa seguindo a arquitetura descrita abaixo, em português do Brasil nos comentários e na documentação gerada.

**Stack obrigatória:**
- **TypeScript** em todo o código.
- **Vite** como bundler e servidor de desenvolvimento.
- **Tailwind CSS** para estilização.
- **Design responsivo**, funcionando bem em celular, tablet e desktop.
- **PWA** (Progressive Web App): manifest, service worker e funcionamento offline básico, instalável no dispositivo.
- **Firebase** com os serviços: Authentication (API de autenticação), Firestore, Realtime Database e Hosting.

**Arquitetura:**
Organize o código no padrão **MVC** (Model-View-Controller):
- **Models**: definição de tipos e acesso aos dados no Firestore e/ou Realtime Database, isolando a lógica de persistência.
- **Views**: componentes de interface responsivos, sem lógica de negócio.
- **Controllers**: coordenam a interação entre views e models, incluindo autenticação e atualizações em tempo real.

Use Firestore para dados estruturados e consultáveis, e Realtime Database para dados que exigem sincronização em tempo real. Justifique brevemente, nos comentários do código, a escolha de cada banco para cada entidade. Inclua as regras de segurança do Firestore e do Realtime Database que restrinjam leitura e escrita ao usuário autenticado correspondente.

**Escopo do projeto:**
Como o pedido original é conciso, implemente uma base funcional e bem estruturada: autenticação de usuários (cadastro, login e logout), uma entidade principal de exemplo com CRUD persistido no Firestore, e um recurso em tempo real usando o Realtime Database. Não adicione funcionalidades além disso sem necessidade. Se algum detalhe de negócio não estiver claro, adote a solução mais simples e registre a premissa em um comentário no código.

**Ordem de trabalho:**
1. Crie a estrutura do projeto com Vite, TypeScript e Tailwind, incluindo a configuração PWA.
2. Implemente a camada MVC e a interface responsiva.
3. Configure o projeto Firebase: inicialize o SDK, Authentication, Firestore, Realtime Database e as regras de segurança.
4. Forneça um arquivo `.env.example` com as variáveis do Firebase, sem valores reais.
5. Teste a aplicação localmente (`npm run dev` e build de produção), corrigindo erros antes de prosseguir.
6. Ao final, descreva os passos para publicar no Firebase Hosting (`firebase init hosting`, `npm run build`, `firebase deploy`). **Não execute o deploy**: ele só deve ser feito após a minha autorização explícita.

**Entregáveis:**
- Estrutura de pastas completa e código-fonte funcional.
- Arquivos de configuração (Vite, TypeScript, Tailwind, PWA, Firebase).
- Regras de segurança do Firestore e do Realtime Database.
- Um README em português com instruções de instalação, execução local, variáveis de ambiente e passos de deploy.

Antes de finalizar, verifique se a aplicação compila sem erros de tipagem, se a interface funciona em larguras de tela diferentes e se nenhuma credencial real foi commitada no código.