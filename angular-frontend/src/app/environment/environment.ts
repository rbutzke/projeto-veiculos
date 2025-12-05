export const environment = {
  production: false,
  apiUrl: 'https://localhost:7777', // URL do seu backend NestJS
  //user: "user@example.com",
  //password: "senha123" 
  user: 'admin@example.com',
  password: 'admin123' 
};

// # para autenticar na API do NestJS é necessário utilizar um usuário e uma senha,
// # com esta senha será gerado um JWT , esta implentado RBAC (Role Based Access Control) , sendo que somente o ADMIN tem acesso a todas as rotas
// # usuário: admin  senha: admin123 possui role ADMIN
// # usuário: user   senha: senha123 possui role USER
