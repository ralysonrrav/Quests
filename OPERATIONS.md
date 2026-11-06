# Manual de Operações & Resposta a Incidentes — Questões Brasil

Este manual descreve os procedimentos operacionais para administradores da plataforma **Questões Brasil**.

---

## 1. Procedimento de Inicialização do Primeiro SUPERADMIN

O primeiro SUPERADMIN nunca é criado via formulário público:
1. Aplique a migration `001_identity.sql` no Supabase.
2. No console administrativo do banco ou via script protegido com a `SERVICE_ROLE_KEY`:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, nickname, role, is_active)
   VALUES (
     '<USER_UUID_GERADO_NA_AUTH>',
     'superadmin@questoesbrasil.com.br',
     'Dr. Ricardo Santos',
     'Ricardo_SuperAdmin',
     'SUPERADMIN',
     true
   );
   ```
3. A partir deste momento, o SUPERADMIN emite convites protegidos para novos administradores ou estudantes.

---

## 2. Operação da Central de Coleta de Provas

1. Acesse o painel pelo menu **Central de Coleta & Admin**.
2. Na aba **Central de Coleta**, selecione a banca examinadora autorizada e o órgão público correspondente.
3. Insira o nome ou arquivo legítimo da prova e do gabarito definitivo.
4. Clique em **Processar Prova**. O pipeline criará um novo Job assíncrono.
5. Acesse a aba **Fila de Revisão**.
6. Utilize a ferramenta **Conferir Lado a Lado** para inspecionar a correspondência entre o texto original do PDF e a estrutura normalizada.
7. Corrija pontualmente a taxonomia (disciplina, assunto) e aprove com **Aprovar e Publicar**.

---

## 3. Política de Backup & Recuperação de Desastres

- **Backups Diários Automatizados (PostgreSQL Point-in-Time Recovery):** O banco de dados realiza backups contínuos de WAL (Write-Ahead Logging) com retenção de 7 a 30 dias.
- **Armazenamento de Provas (Storage):** Documentos brutos ingeridos possuem versionamento com hash SHA-256 de integridade, impedindo substituições acidentais.
