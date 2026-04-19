# RA-XEI 💎 - Divisor de Contas Inteligente

O **Ra-xei** é uma aplicação SaaS mobile-first projetada para simplificar a divisão de contas em bares, restaurantes e eventos sociais. Com uma interface premium inspirada no design "Mica/Acrylic", o app permite gerar QRCodes Pix dinâmicos e rastrear pagamentos em tempo real de forma segura e elegante.

## ✨ Funcionalidades

- **Calculadora Inteligente**: Divida o valor total por quantas pessoas desejar com foco total na usabilidade por polegar (Thumb-Zone).
- **PIX Dinâmico**: Geração automática de QRCodes e chave "Copia e Cola" baseada nos seus dados.
- **Rastreio em Tempo Real**: Saiba quantas pessoas visualizaram e quantas já confirmaram o pagamento da conta.
- **Histórico de Contas**: Mantenha um registro das suas divisões passadas com indicadores de progresso.
- **Segurança Avançada**: Dados sensíveis (Chaves Pix) são protegidos com criptografia **AES-256-CBC** e senhas (PIN) com hashing **PBKDF2**.
- **Conformidade LGPD**: Fluxo de consentimento explícito e funcionalidade de exclusão total de conta e dados (Direito ao Esquecimento).
- **Mobile Native Feel**: Otimizado para iOS e Android com suporte a Safe Areas, Dynamic Viewport Units e navegação keyboard-aware.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion, Lucide React.
- **Backend**: Prisma ORM, Server Actions, PostgreSQL.
- **Segurança**: Node Crypto (AES-256, PBKDF2).

## 🛠️ Instalação e Execução

1.  **Instale as dependências**:
    ```bash
    npm install
    ```

2.  **Configure as variáveis de ambiente**:
    Crie um arquivo `.env` na raiz e adicione:
    ```env
    DATABASE_URL="sua-url-do-banco"
    ENCRYPTION_KEY="uma-chave-de-32-caracteres-para-aes"
    ```

3.  **Prepare o Banco de Dados**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

---

## 👨‍💻 Créditos

Este projeto foi concebido e idealizado por:

**Alex Lanção**
- GitHub: [@lancao2](https://github.com/lancao2)
- Idealização, Visão de Produto e Design UI/UX.

---

*Desenvolvido com foco em UX Minimalista e Segurança de Dados.*
