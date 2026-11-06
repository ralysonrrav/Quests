# Changelog — Questões Brasil

Todas as mudanças relevantes no projeto são documentadas neste arquivo.

## [1.0.0] - 2026-11-06

### Adicionado
- **Fundação Full Stack:** Servidor Express integrado com middlewares do Vite em desenvolvimento, servindo na porta 3000.
- **Banco de Questões Estruturado:** Suporte a questões de múltipla escolha e certo/errado, bancas Cebraspe, FGV, FCC, Vunesp, anotações de prova e gabaritos comentados com fundamentação legal.
- **Filtros Facetados Avançados:** Filtros por Banca, Órgão, Ano, Disciplina, Assunto, Dificuldade, Modalidade e Status (resolvidas, não resolvidas, erradas, favoritas, anuladas, comentadas).
- **Ambiente de Resolução & Eliminação de Alternativas:** Recurso de riscar alternativas incorretas, estatísticas de escolha de outros estudantes e gabarito imediato.
- **Modo Foco / Zen:** Resolução fullscreen sem distrações visuais com controle de tamanho de fonte e atalhos de teclado.
- **Meus Cadernos:** Agrupamento de questões personalizadas por edital ou concurso.
- **Caderno Inteligente de Erros:** Alimentação automática por questões incorretas, repetição espaçada no sistema Leitner (caixas 1 a 5) e status de questão dominada.
- **Simulados Personalizados:** Provas cronometradas com regra CESPE de anulação ($1 \text{ errada anula } 1 \text{ certa}$) e relatório detalhado com folha de respostas.
- **Dashboard Estatístico & Heatmap:** Gráficos de aproveitamento por matéria, calendário de 28 dias de atividade e recomendações automáticas de estudo.
- **Ranking Geral Auditável:** Pontuação transparente anti-abuso e modo anônimo em conformidade com a LGPD.
- **Central de Coleta & Inteligência de Questões:** Pipeline de ingestão em 10 etapas com extração, hash SHA-256, classificação taxonômica, detecção de duplicidades por Sørensen-Dice e fila de revisão humana lado a lado.
- **Segurança & RBAC:** Perfis SUPERADMIN, ADMIN e USUARIO, cadastro restrito por convite, trilha de auditoria imutável e modelagem completa de Row Level Security (RLS) para PostgreSQL/Supabase.
- **Documentação Técnica Obrigatória:** `DATABASE.md`, `ARCHITECTURE.md`, `SECURITY.md`, `OPERATIONS.md`, `TESTING.md`, `DEPLOYMENT.md` e `README.md`.
