# Portfólio e painel ADM

O painel fica em **/admin/**. Ele permite editar apresentação, biografia, currículos, experiências e cargos, formação, habilidades e áreas, projetos, contatos, menu, metadados, cores e animação 3D. Há upload de imagens e documentos, reordenação, prévia de rascunho, importação/exportação JSON e restauração de versões.

## Ativar no Site Publicado

1. Publique este projeto na **Netlify**, pelo repositório conectado. O arquivo `netlify.toml` já define o build (`npm run build`), a pasta pública (`public`) e as funções.
2. Em **Project configuration > Environment variables**, crie **ADMIN_SETUP_TOKEN**, com escopo **Functions** e uma chave aleatória de pelo menos 24 caracteres. Use uma chave gerada pelo seu gerenciador de senhas. Ela não deve entrar no código nem no Git.
3. Faça um novo deploy para aplicar a variável.
4. Acesse **https://www.emanuelssobral.com/admin/** e crie o administrador com seu e-mail, senha de pelo menos 12 caracteres e a chave de ativação.
5. Depois da criação, o login usa apenas e-mail e senha. A chave de ativação não permite criar outro administrador e pode ser removida da Netlify.

O projeto foi preparado para a Netlify, mas as credenciais e a publicação na sua conta não são configuradas automaticamente. Um upload estático apenas de arquivos, sem Functions, não ativa o ADM.

## Editar e Publicar

- Os formulários trabalham em um rascunho. **Prévia** não modifica o site público.
- **Salvar e publicar** valida e grava o conteúdo; visitantes passam a receber a versão salva sem novo deploy.
- Em **Backup e conta**, é possível exportar/importar o conteúdo em JSON, carregar uma versão anterior e alterar a senha.
- Restaurar/importar carrega um rascunho. É necessário salvar para publicar.
- Cada salvamento gera uma cópia automática da versão anterior. O painel lista as 30 mais recentes.
- O JSON contém o conteúdo e os endereços dos arquivos, não os arquivos binários. Os uploads permanecem no armazenamento do mesmo site.
- Imagens aceitas: PNG, JPG, WebP e GIF. Currículos: PDF e DOCX. Limite: 3 MB por arquivo.

## Rodar Neste Computador

Requer Node.js 22 ou superior:

```powershell
npm install
npm start
```

Abra **http://127.0.0.1:4173/admin/**. Se a porta estiver ocupada, o terminal informará outra. No primeiro acesso local, crie e-mail e senha; a chave de ativação é exigida apenas online.

O ambiente local grava em `.admin/`, uma pasta ignorada pelo Git e inacessível ao servidor público. Os dados e a conta locais são independentes da Netlify. Alterações locais não publicam no domínio.

## Armazenamento e Acesso

Na Netlify, conteúdo, uploads, versões e credenciais ficam no store privado **portfolio-admin** do Netlify Blobs. Ele é compartilhado pelos deploys do mesmo site, portanto os dados persistem após novas publicações. Deploy previews também usam esse store: não edite dados de produção por uma preview.

A senha é armazenada com salt e scrypt. Sessões usam cookies HttpOnly, SameSite=Strict e Secure no ambiente online, com validade de 12 horas. Alterar a senha invalida as demais sessões. As escritas exigem origem correspondente, sessão e token CSRF. Há limite de tentativas de login, validação de dados e detecção de conflitos entre edições.

Se perder a senha e não houver outra sessão aberta, o proprietário pode excluir **somente a chave account** no store `portfolio-admin` pela conta da Netlify, configurar novamente `ADMIN_SETUP_TOKEN` e recriar o administrador. Não exclua o store: ele contém o conteúdo e os uploads.

## Verificação

```powershell
npm test
npm run build
```

O build publica apenas os arquivos permitidos, sem `.admin`, testes, dependências, credenciais ou código interno do servidor. As funções são empacotadas separadamente pela Netlify.

Referências: [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) e [Netlify Functions](https://docs.netlify.com/build/functions/api/).
