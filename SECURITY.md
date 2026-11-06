# Diretrizes de Segurança Cibernética & DevSecOps — Questões Brasil

Este documento define os controles de segurança do projeto **Questões Brasil**, alinhados ao **OWASP ASVS 5.0** e à legislação de proteção de dados (LGPD).

---

## 1. Princípios Arquiteturais de Segurança

1. **Defesa em Profundidade:** Múltiplas camadas de controle no cliente, servidor e banco de dados.
2. **Princípio do Menor Privilégio:** Usuários comuns não possuem visibilidade nem acesso a tabelas de ingestão, fontes ou dados de outros usuários.
3. **Isolamento via RLS:** Todas as consultas no banco passam obrigatoriamente por políticas de Row Level Security.
4. **Cadastro Fechado por Convite:** O cadastro público é bloqueado; apenas administradores autorizados geram tokens de convite com tempo de expiração determinado.

---

## 2. Controles Específicos contra Vulnerabilidades Críticas

### 2.1. SSRF (Server-Side Request Forgery)
- Na Central de Coleta de Provas, qualquer download de arquivos ou consulta de URLs de bancas passa por lista restrita (allowlist) de domínios homologados (`cebraspe.org.br`, `conhecimento.fgv.br`, `concursosfcc.com.br`, `vunesp.com.br`).
- URLs privadas, localhost (`127.0.0.1`), endereços de link local (`169.254.169.254`) ou redes internas corporativas são bloqueadas estritamente na validação de entrada antes de qualquer requisição.

### 2.2. SQL Injection & Injeção de Código
- Uso obrigatório de consultas parametrizadas em todas as operações de banco.
- O classificador de texto sanitiza entradas, eliminando caracteres de controle e tags HTML nos enunciados e anotações pessoais.

### 2.3. IDOR / BOLA (Broken Object Level Authorization)
- Todas as operações em cadernos, anotações, tentativas de resolução e simulados validam que o identificador do registro (`user_id`) corresponde rigorosamente ao usuário autenticado na sessão (`auth.uid()`).
- Um estudante não consegue ler nem manipular anotações privadas ou cadernos de outro estudante trocando o UUID na URL.

### 2.4. Trilha de Auditoria Imutável
- A tabela `audit_logs` registra carimbo de data/hora UTC, ator, ação, IP de origem e detalhes da operação.
- Apenas usuários com papel `SUPERADMIN` possuem permissão de leitura nos logs de auditoria; operações de `UPDATE` ou `DELETE` são terminantemente bloqueadas via trigger no banco de dados.

---

## 3. Conformidade com a LGPD (Lei Geral de Proteção de Dados)

- Os estudantes possuem controle sobre a privacidade de seus dados no ranking geral, podendo optar pelo **Modo Anônimo**.
- Nenhum e-mail ou dado sensível de candidatos é exibido em áreas públicas ou rankings competitivos.
