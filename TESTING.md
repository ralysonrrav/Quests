# Guia de Testes & Qualidade de Software — Questões Brasil

Este documento descreve a pirâmide de testes implementada no **Questões Brasil**.

---

## 1. Suíte de Testes Unitários de Lógica de Domínio

Localizados em `src/utils/logic.test.ts`, utilizam o motor nativo `node:test` e `node:assert/strict` para validação rápida em milissegundos sem overhead de navegador:

```bash
npx --yes tsx --test src/utils/logic.test.ts
```

### Casos Cobertos
- **Cálculo de Precisão & Acurácia:** Tratamento de zero resoluções, porcentagens inteiras e arredondamentos.
- **Regra CESPE de Pontuação:** Validação da fórmula $\text{Nota} = \text{Acertos} - \text{Erros}$.
- **Cálculo de Constância & Streak:** Verificação de dias consecutivos qualificados, fuso horário brasileiro (UTC-3), preservação de recorde histórico e detecção de quebra de sequência.
- **Nível de Domínio no Caderno de Erros:** Requisito de 2 acertos consecutivos para atribuição do status "Dominada".
- **Fórmula de Ranking Anti-Abuso:** Pontuação protegida contra repetição deliberada de questões já dominadas.
- **Normalização Textual & Similaridade Semântica:** Remoção de diacríticos, pontuação e cálculo de similaridade Sørensen-Dice com stemming fonético para detecção de duplicidades.
- **Repetição Espaçada (Leitner):** Progressão de caixas (1 a 5) e intervalos de dias.
- **Recomendações da Inteligência de Estudos:** Identificação correta de disciplinas fracas e metas pendentes.

---

## 2. Testes de Navegação & E2E (Playwright)

Executados via `playwright-cli`:
- **Jornada de Resolução:** Seleção de alternativa, marcação com riscar alternativa, envio de gabarito e exibição de comentário do professor.
- **Jornada de Caderno de Erros:** Verificação de que questões erradas ingressam automaticamente no caderno e mantêm o histórico separado.
- **Jornada de Simulados:** Execução com cronômetro regressivo, folha de respostas e exibição da nota líquida final.
- **Jornada de Administração:** Troca de perfil via RBAC para SUPERADMIN, acesso à Central de Coleta e aprovação na Fila de Revisão.
