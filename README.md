# Questões Brasil — Plataforma Inteligente de Questões para Concursos Públicos

Plataforma educacional completa, independente e sem paywall para resolução, filtragem, organização e acompanhamento estatístico de questões de concursos públicos brasileiros (inspirada nas boas práticas funcionais de TEC Concursos e Qconcursos).

---

## 🌟 Principais Funcionalidades

### 1. Banco de Questões com Filtros Avançados
- **Filtros Combináveis:** Banca Examinadora (Cebraspe, FGV, FCC, Vunesp, Cesgranrio, etc.), Órgão (PF, PRF, Receita Federal, TCU, TJ-SP, Bacen, INSS), Ano, Disciplina, Assunto, Subassunto, Modalidade (Múltipla Escolha e Certo/Errado), Nível de Escolaridade e Dificuldade.
- **Filtro de Status do Estudante:** Não Resolvidas, Já Resolvidas, Apenas Acertadas, Apenas Erradas, Apenas Favoritas, Questões Anuladas e Gabarito Comentado.
- **Busca Textual em Tempo Real:** Pesquisa rápida por artigos de lei, súmulas e trechos de enunciados com totalização dinâmica.

### 2. Ambiente de Resolução de Alto Rendimento
- **Eliminação de Alternativas:** Recurso de riscar alternativas incorretas com 1 clique (ferramenta consagrada entre concurseiros).
- **Gabarito Comentado Oficial:** Justificativa detalhada de professores com fundamentação jurídica (CF/88, leis ordinárias, súmulas de tribunais superiores).
- **Métricas Comunitárias:** Distribuição percentual em tempo real das alternativas escolhidas por outros candidatos.
- **Ferramentas de Estudo:** Cronômetro individual por questão, marcação de favoritas, anotações pessoais salvas na nuvem, inclusão em cadernos e atalhos de teclado (`1-5`, `A-E`, `Enter`, `N`).
- **Modo Foco / Zen:** Resolução fullscreen sem distrações visuais com dimensionamento tipográfico (`A`, `A+`, `A++`).

### 3. Caderno Inteligente de Erros (Spaced Repetition)
- **Alimentação Automática:** Todo erro em qualquer questão é automaticamente catalogado.
- **Sistema Leitner de Caixas (1 a 5):** Intervalos progressivos de revisão (1d, 3d, 7d, 14d, 30d).
- **Indicador de Domínio:** A questão recebe o selo **Dominada** após 2 acertos consecutivos em rodadas de revisão, mantendo intacto o histórico analítico da primeira tentativa.

### 4. Meus Cadernos
- Criação e agrupamento de cadernos personalizados por cargo ou concurso.
- Barras de progresso e aproveitamento específico por caderno.

### 5. Simulados Personalizados
- **Configurador Flexível:** Escolha de disciplinas, quantidade de questões, tempo limite e modo (Prova Oficial com gabarito liberado apenas ao final ou Treinamento).
- **Regra CESPE de Pontuação:** Cálculo de pontuação líquida ($1 \text{ errada anula } 1 \text{ certa}$).
- **Folha de Respostas Interativa:** Grade de navegação rápida com marcação de questões para revisão posterior e alerta de questões em branco.
- **Relatório de Desempenho Homologado:** Nota final, tempo gasto, aproveitamento percentual e revisão comentada questão por questão.

### 6. Estatísticas & Painel de Inteligência
- Total de questões resolvidas, acertos, erros e taxa de aproveitamento homologada.
- **Inteligência de Estudos:** Diagnósticos e recomendações automáticas baseadas nos dados reais do estudante (ex: alerta de desempenho abaixo da média em temas específicos).
- **Heatmap de Atividade:** Calendário estilo GitHub registrando a constância diária de estudos.
- **Gamificação e Metas:** Sequência ativa (Streak), recorde histórico, meta diária (ex: 20 questões/dia) e conquistas com distintivos desbloqueáveis.

### 7. Ranking Geral Auditável Anti-Abuso
- Classificação diária, semanal e geral com fórmula transparente:
  - $+10$ pts por questão inédita acertada
  - $+4$ pts por acerto em revisão espaçada
  - $+25$ pts por simulado concluído
  - $+5$ pts/dia por streak diário ativo
- Participação opcional com **Modo Anônimo** para conformidade rigorosa com a LGPD.

### 8. Central de Coleta e Inteligência de Questões (Admin Hub)
- **Pipeline de Ingestão de 10 Etapas:** Cadastro de Fontes -> Busca Manual -> Armazenamento com Hash SHA-256 -> Extração -> Classificação Taxonômica com Score de Confiança -> Detecção de Duplicidades (Sørensen-Dice) -> Fila de Revisão Humana Lado a Lado -> Publicação Homologada no Acervo Geral.
- **Gestão de Usuários & Convites (RBAC):** SUPERADMIN, ADMIN e USUÁRIO com cadastro fechado por tokens.
- **Trilha de Auditoria Imutável:** Registro com ator, IP, ação e timestamp.

---

## 🛠️ Tecnologias Adotadas

- **Front-end:** React 19, TypeScript (modo estrito), Tailwind CSS v4, Lucide Icons, Motion, Canvas-Confetti.
- **Back-end:** Node.js, Express, Vite Middlewares.
- **Banco de Dados & Storage:** PostgreSQL 15+ / Supabase com Row Level Security (RLS) e migrações versionadas.
- **Testes:** Node.js Test Runner nativo (`node:test`, `node:assert/strict`) via `tsx --test`, Playwright CLI.

---

## 🚀 Executando o Projeto

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Executar suíte de testes unitários:
   ```bash
   npx --yes tsx --test src/utils/logic.test.ts
   ```

3. Iniciar servidor full-stack (porta 3000):
   ```bash
   npm run dev
   ```

4. Compilar para produção:
   ```bash
   npm run build
   ```
