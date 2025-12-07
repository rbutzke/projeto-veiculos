
# Projeto de Veiculos

Solução que basicamente é uma API REST CRUD de Veículos construída no NestJS utilizando TypeScript e banco de dados Postgres com driver PG puro (sem orm). 

# NestJS Backend Rest API

Este projeto apresenta uma API REST **NestJS**, utilizando:

- **JWT** - JSON Web Token
- **RBAC** - Role Based Access Control 
- **Bcrypt** - Gerador de Hash para senhas
- **Passport** - Estratégia de Autenticação
- **JEST** - Testes Unitários
- **Pino** - Logs / Traces
- **PG** - Driver Postgres
- **mkcert** - Permite operar em HTTPS 
- **throttler** - Implementa controle de taxa de requisições(rate limiting) 
- **Class-validator** - Validação de Entradas
- **Paginação** - Para otmizar consultas
- **Swagger** - Documentação da API
- **PostgreSQL** - Banco de Dados SQL Relacional
- **PGAdmin** - Manipulação/Visualização dos Dados

---

## 📦 Setup

### 1. Clone o repositório

```bash
git clone https://github.com/rbutzke/projeto-veiculos.git
cd nestjs-backend
```

### 2. Suba os containers

```bash
docker compose up -d --build
```

### 3. Serviços disponíveis

- API NestJS → [https://localhost:7777](http://localhost:7777)
- Swagger → [https://localhost:7777/api](http://localhost:7777)
- PGAdmin → [http://localhost:5050](http://localhost:5050)

  Usuário: `admin@admin.com` | Senha: `admin123`

- Banco de Dados Postgres → Porta 5432

   Usuário: `postgres` | Senha: `postgres`

##

Quando o docker compose subir os containers, um script será executado criando as duas tabelas do projeto principal e 1 tabela do projeto secundario de mensageria, caso ocorra erro segue o link do [SQL](https://github.com/rbutzke/projeto-veiculos/blob/main/nestjs-backend/init.sql)

#

Para efetuar o consumo dos endpoints da API sem utilizar o frontend segue a colection do [Postman](https://github.com/rbutzke/projeto-veiculos/blob/main/collections/Projeto-Veiculo-NestJS.postman_collection.json)

* Dica importante: o perfil de admin tem acesso total as funcionalidades , o perfil user consegue somente fazer buscas.
##


### 4. Testes Unitários

Para executar os testes das principais funcionalidades seguem os comandos abaixo:

```bash
#Rodar todos os Testes
docker compose run --rm test npm test

docker compose run --rm test npm test -- src/vehicle/test/vehicle.service.spec.ts

# Funcionalidades especificas:
docker compose run --rm test npm test -- src/vehicle/test/vehicle.controller.spec.ts

docker compose run --rm test npm test -- src/common/database/test/pg.provider.spec.ts

docker compose run --rm test npm test -- src/auth/test/auth.service.spec.ts

docker compose run --rm test npm test -- src/auth/test/auth.controller.spec.ts


#Testes locais fora do docker
npm test -- src/vehicle/test/vehicle.service.spec.ts 

npm test -- src/vehicle/test/vehicle.controller.spec.ts

npm test -- src/common/database/test/pg.provider.spec.ts

npm test -- src/auth/test/auth.service.spec.ts

npm test -- src/auth/test/auth.controller.spec.ts
```

#

## 📊 Frontend Angular

O Frontend Angular apresenta um CRUD , permitindo listar veículos , selecionar , alterar , excluir, a tela permite filtros e paginação.

---

## 📦 Setup

### 1. Clone o repositório

```bash
git clone https://github.com/rbutzke/projeto-veiculos.git
cd angular-frontend
```

### 2. Suba os containers

```bash
docker compose up -d --build
```

### 3. Serviços disponíveis

- Frontend Angular → [https://localhost:4200](http://localhost:4200)

#
    
---

## 🔥 NestJS e RabbitMQ Mensageria de Pagamento

Esta solução simula um Producer em NestJS que recebe uma requisição Rest através do Postman EndPoint https://localhost:7778/payment , após receber o payload, o json é convertido para mensagem e postado na fila do Broker RabbitMQ utilizando `amqp` na `Queue → payment_queue `.

O RabbitMQ Broker por sua vez recebe a mensage e espera que o consumo seja feito , enquanto a mensagem não for consumida a mesma não sai da Fila(Queue), caso o container caia ou seja reinicializado a mensagem continuará lá a espera do consumo, pois o container usa o volume do docker para armazenar os dados da fila já que no momento de criar a mesma optei pela opção ` { durable: true } `.

O Worker/Consumer basicamente fica monitorando a fila do RabbitMQ e ao detectar pega/remove a mensagem fazendo posteriormente tratativas e inserindo a mensagem na tabela do banco de dados payments emitindo uma mensagem de sucesso.

**Ponto importante de atenção:**  visando simular um ambiente real o NestJS Backend Veiculos e o Postgres se encontra em uma rede separada do RabbitMQ , NestJS-Producer e NestJS-Worker(lembrando que após consumir a mensagem o Worker grava a mesma no banco em outra rede).

caso ocorra alguma incosistencia na comunicação das redes após o docker compose, será necessário conectar as redes virtuais do docker:

```bash
# Conectar Redes
docker network connect nestjs-backend_nest-network payment-worker

# Teste DNS
docker exec payment-worker nslookup postgres

# Teste ping
docker exec payment-worker ping -c 2 postgres
```


## 📦 Setup

### 1. Clone o repositório

```bash
git clone https://github.com/rbutzke/projeto-veiculos.git
cd projeto-veiculos
```

### 2. Suba os containers

```bash
docker compose up -d --build
```
#
Este docker compose deverá subir rabbitmq , nestjs-producer e nestjs-worker. 
#

### 3. Serviços disponíveis

- nestjs-producer → [https://localhost:7778/payment](http://localhost:7778/payment)  
  este endpoint não utiliza autenticação

  confirmação de envior ocorre pelo postman e pelo console

- nestjs-worker -> se sucesso grava na tabela do banco de dados payments   

  confirmação de recebimento e gravação no banco de dados ocorre pelo console

- rabbitmq -> [https://localhost:15672](https://localhost:15672)  
  Usuário: `guest` | Senha: `guest`

  `Queue -> payment_queue`   
#

**Observação:** Caso seja efetuado o envio de mensagem e não aparecer nada na Queue do RabbitMQ significa que o Work ja consumiu a mensagem (Claro uma vez que o Worker emita log de sucesso e a mensagem ja esteja gravada na base de dados).

Uma estratégia para teste é desligar o conteiner do Worker e ai emitir via Postman várias requisições , o producer vai enviar várias mensagens ao RabbitMQ que vai colocar na Queue (sendo possivel visualilizar via interface 15672 as mensagens na fila) e o quão rápido é o processamento do Worker.
