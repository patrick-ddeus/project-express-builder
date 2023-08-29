# Project Express Builder
O Project Express Builder é uma ferramenta desenvolvida para simplificar e agilizar a criação de projetos Express.js seguindo uma arquitetura de camadas bem definida. Com essa ferramenta, você pode criar rapidamente a estrutura básica de um projeto Express e adicionar endpoints completos para operações CRUD (Create, Read, Update, Delete) de maneira simples e eficiente.

## Características
- Crie projetos Express.js rapidamente com uma estrutura de camadas organizada.
- Adicione endpoints para operações CRUD de forma automatizada.
- Aumente a produtividade ao eliminar tarefas repetitivas de configuração e criação de rotas.

## Instalação
- Certifique-se de ter o node.js instalado em sua máquina. Baixe ou clone o repositório e então rode o comando:

```sh
npm i
```

## Uso
### Criando um novo projeto Express
- Para criar um novo projeto Express com a estrutura de camadas predefinida, execute o seguinte comando:

```sh
node index.js ts nome-do-recurso
```
Isso dará inicío ao processo de construção do diretório. Após a execução o comando irá perguntar o nome para o diretório do projeto.
nome-do-recurso se refere ao nome que vai ser usado nos endpoints CRUD. Ex: (posts, users, publications).

Ao passar `ts` o builder irá configurar o projeto para typescript. Possíveis opções: `ts`, `js`, `typescript`, `javascript`.

## Adicionando endpoints CRUD
Para adicionar endpoints CRUD a um projeto existente, navegue até o diretório do projeto e execute o seguinte comando:

```sh
node index.js -i ts user
```
Isso criará automaticamente rotas, controladores e modelos para as operações CRUD do recurso "user". Ao passar a flag -i o comando não te perguntará o nome do projeto.
