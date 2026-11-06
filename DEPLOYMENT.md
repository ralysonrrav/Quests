# Guia de Implantação & Integração Contínua (CI/CD) — Questões Brasil

Este documento orienta a implantação contínua e a configuração dos ambientes de **Desenvolvimento**, **Homologação** e **Produção** integrando **GitHub**, **Supabase** e **Vercel / Node.js**.

---

## 1. Topologia de Ambientes

| Ambiente | Provedor | Branch GitHub | Banco de Dados |
| :--- | :--- | :--- | :--- |
| **Desenvolvimento** | Local / Preview AI Studio | `feature/*`, `develop` | Supabase Dev / In-memory |
| **Homologação** | Vercel Preview Deploy | `develop` ou PRs abertos | Supabase Staging |
| **Produção** | Vercel / Cloud Run (Port 3000) | `main` (protegida) | Supabase Production |

---

## 2. Variáveis de Ambiente Obrigatórias

Configure no painel da Vercel ou no arquivo `.env` do servidor (baseado no `.env.example`):

```bash
# Banco de Dados & Autenticação (Supabase)
SUPABASE_URL="https://seu-projeto.supabase.co"
SUPABASE_ANON_KEY="sua-chave-publica-anonima"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-privada-servidor" # Apenas no server-side

# Configuração da Aplicação
PORT=3000
NODE_ENV="production"
APP_URL="https://questoesbrasil.com.br"
```

---

## 3. Pipeline de CI/CD (GitHub Actions)

O repositório inclui a esteira `.github/workflows/ci.yml` que valida automaticamente a cada push ou Pull Request:
1. Verificação de tipagem estrita com TypeScript (`npm run lint`).
2. Execução da suíte de testes unitários (`npx --yes tsx --test src/utils/logic.test.ts`).
3. Verificação de integridade do build (`npm run build`).
4. Bloqueio automático de merge em caso de falha em qualquer uma das etapas.
