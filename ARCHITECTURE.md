# Arquitetura do Sistema — Questões Brasil

Este documento detalha as decisões técnicas, a topologia de infraestrutura, os padrões de projeto e o fluxo de dados do **Questões Brasil**, uma plataforma web full-stack de resolução de questões de concursos públicos.

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura full-stack moderna, com separação de responsabilidades e isolamento de segurança:

```
+-------------------------------------------------------------------------+
|                              CLIENTE SPA                                |
|  React 19 + TypeScript + Tailwind CSS + Lucide Icons + Motion           |
|  - Banco de Questões (Filtros Facetados & Resolução Interativa)         |
|  - Ambiente de Foco / Modo Zen (Distraction-free)                       |
|  - Meus Cadernos & Caderno Inteligente de Erros (Spaced Repetition)     |
|  - Simulados Cronometrados (Regra CESPE e Padrão)                       |
|  - Dashboard Analítico & Heatmap de Atividade                           |
|  - Ranking Geral Auditável Anti-Abuso                                   |
|  - Central de Coleta e Inteligência (Admin Hub)                         |
+-------------------------------------------------------------------------+
                                    |
                           REST API / JSON
                                    |
+-------------------------------------------------------------------------+
|                        BACK-END (Node.js / Express)                     |
|  - Roteamento e Middleware de Autenticação / RBAC                      |
|  - Validação de Payloads e Tratamento Centralizado de Exceções          |
|  - Motor de Busca, Taxonomia e Detecção de Duplicidades                 |
|  - Pipeline Assíncrono de Ingestão de Provas Oficiais                   |
|  - Geração de Métricas e Trilha de Auditoria Imutável                   |
+-------------------------------------------------------------------------+
                                    |
                            PostgreSQL / Supabase
                                    |
+-------------------------------------------------------------------------+
|                   PERSISTÊNCIA & SEGURANÇA (Supabase)                   |
|  - Row Level Security (RLS) com Isolamento por Usuário                  |
|  - Migrations SQL Versionadas e Integridade Referencial (FKs)           |
|  - Índices GIN de Busca Textual (FTS em Português)                      |
|  - Supabase Storage com cálculo de Hash SHA-256                         |
+-------------------------------------------------------------------------+
```

---

## 2. Fluxo do Pipeline da Central de Coleta (10 Etapas)

O processamento de provas públicas opera sob comando manual de um administrador:

1. **Cadastro de Fontes Oficiais:** Registro de portais oficiais das bancas (Cebraspe, FGV, FCC, Vunesp). Fontes proprietárias como TEC Concursos e Qconcursos são estritamente vedadas.
2. **Busca Manual:** O administrador seleciona Banca, Órgão, Ano e Cargo, ativando a consulta aos repositórios permitidos.
3. **Seleção de Documentos:** Verificação do par Prova Oficial + Gabarito Definitivo.
4. **Armazenamento e Hashing:** O PDF é submetido a verificação de tamanho, MIME type e cálculo de hash SHA-256 de integridade antes do armazenamento seguro.
5. **Extração de Questões:** Decomposição dos enunciados, alternativas, referências legais e itens anulados ou alterados.
6. **Classificação Taxonômica:** Atribuição de Disciplina, Assunto e Subassunto com cálculo de score de confiança (0-100%).
7. **Detecção de Duplicidades:** Algoritmo Sørensen-Dice com stemming fonético compara o texto normalizado com o acervo existente.
8. **Fila de Revisão Humana:** Comparador lado a lado (trecho original do PDF vs estrutura parseada) permite ajuste antes da aprovação.
9. **Publicação Homologada:** A questão é promovida para o status `publicada`, integrando instantaneamente os filtros dos estudantes.
10. **Monitoramento e Auditoria:** Cada execução gera registros rastreáveis na tabela `audit_logs` e no monitor de trabalhos.

---

## 3. Algoritmos de Estudo e Gamificação

### 3.1. Caderno Inteligente de Erros & Repetição Espaçada (Leitner System)
Toda resolução incorreta é enviada automaticamente para o Caderno de Erros.
- **Caixa 1:** Intervalo de 1 dia (Pendente de revisão).
- **Caixa 2:** Intervalo de 3 dias.
- **Caixa 3:** Intervalo de 7 dias.
- **Caixa 4:** Intervalo de 14 dias.
- **Caixa 5 (Dominada):** Requer no mínimo 2 acertos consecutivos. A primeira tentativa errada permanece preservada no histórico analítico.

### 3.2. Regra CESPE de Pontuação em Simulados
No modo CESPE Certo/Errado:
$$\text{Nota Líquida} = \text{Acertos} - \text{Erros}$$
Questões deixadas em branco somam 0 pontos.

### 3.3. Pontuação do Ranking Geral
Para impedir que repetições mecânicas da mesma questão inflem o ranking:
$$\text{Pontos} = (\text{Inéditas Corretas} \times 10) + (\text{Revisões Corretas} \times 4) + (\text{Simulados Concluídos} \times 25) + (\text{Dias de Streak} \times 5)$$
