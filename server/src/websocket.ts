import { io } from "./http";
import { PrismaRoomsRepository } from "./repositories/prisma/rooms/prisma-rooms-repository";
import { PrismaUserRoomsRepository } from "./repositories/prisma/rooms/user-rooms/prisma-user-rooms-repository";
import { PrismaAlunosRepository } from "./repositories/prisma/alunos/prisma-alunos-repository";
import { PrismaProfessoresRepository } from "./repositories/prisma/professores/prisma-professores-repository";
import { PrismaMessagesRepository } from "./repositories/prisma/messages/prisma-messages-repository";
import { PrismaEscolaUsersRepository } from "./repositories/prisma/escolas/prisma-escolas-users-repository";
import { FindByNameRoomService } from "./services/rooms/FindRoomByNameService";
import { AddUserRoomSocketService } from "./services/rooms/userRooms/AddUserRoomSocketService";
import { UserIsInRoomSocketService } from "./services/rooms/userRooms/UserIsInRoomSocketService";
import { CreateRoomService } from "./services/rooms/CreateRoomService";
import { CreateMessageService } from "./services/messages/CreateMessageService";
import { GetMessagesByRoomService } from "./services/messages/GetMessagesByRoomService";
import { UpdateRoomSocketService } from "./services/rooms/userRooms/UpdateUserRoomSocketService";
import { CreateUserRoomSocketService } from "./services/rooms/userRooms/CreateUserRoomSocketService";
import { GetOpenRoomsService } from "./services/rooms/GetOpenRoomsService";
import { SelectRoomSocketController } from "./controllers/rooms/SelectRoomSocketController";
import { CreateAlunoRespondeAtividadeController } from "./controllers/alunos/aluno-responde-atividades/CreateAlunoRespondeAtividadeController";
import { CheckResponda_X_AtividadesController } from "./controllers/conquistas/CheckResponda_X_AtividadesController";
import { Request, Response } from "express";
import { CheckResponda_X_AtividadesService } from "./services/conquistas/responda_x_atividades/CheckResponda_x_atividadesService";
import { PrismaConquistasRepository } from "./repositories/prisma/conquistas/prisma-conquistas-repository";
import { PrismaResponda_X_AtividadesRepository } from "./repositories/prisma/conquistas/responda_x_atividades/prisma-responda_x_atividades-repository";

// * CASO DE USO: Entrar no chat de d??vidas com o professor
//
// * DESCRI????O: 
// O Aluno vai clicar no bot??o de "d??vidas" (APP) e duas situa????es podem acontecer:
// 1 - ?? a primeira vez que o aluno vai entrar na sala, ent??o...
//      - A sala ser?? criada
//      - O usu??rio ser?? conectado a sala rec??m-criada
//      - Na vis??o do professor (WEB), este vai ter acesso imediamente as salas que forem criadas em tempo real
//
// 2 - N??o ?? a primeira vez que o aluno vai entrar na sala, ent??o...
//      - O usu??rio ser?? conectado a sala

// * O Professor tamb??m vai entrar no chat, por??m via WEB
// Ele s?? vai entrar nas salas j?? existentes
// Ao entrar na sala, as mensagens ser??o carregadas


// ? EXPLICA????O DAS VARI??VEIS
//
// id_aluno: o id do aluno
// id_professor: o id do professor
// id_connected: o id da tabela USER que serve tanto para aluno, quanto professor. Ela serve para mostrar quem est?? conectado na sala;

interface definitionInterface2{
  (message:string):void;
}

type User = {
  _id: string;
}

type Message = {
  _id: string;
  text: string;
  createdAt: Date;
  user: User;
}

type definitionInterfaceBase = {
  room_id: string;
  messages: Message[] | null;
}

interface definitionInterface{
  (messages: definitionInterfaceBase): void;
}

// Realizando conex??o
module.exports = io.on("connection", (socket) => {

    // Repositories
    const prismaRoomsRepository = new PrismaRoomsRepository();
    const prismaUserRoomsRepository = new PrismaUserRoomsRepository();
    const prismaMessagesRepository = new PrismaMessagesRepository();
    const prismaEscolaUsersRepository = new PrismaEscolaUsersRepository();   

    let result: definitionInterfaceBase;

    // Ap??s o usu??rio se conectar (Aluno/Professor), o evento tem como par??metros o "id_aluno", "id_professor" e "id_connected"
    socket.on("select_room", async (data, callback:definitionInterface) => {

      console.log(data)

      const id_name = data.id_professor + data.id_aluno;

      const prismaAlunosRepository = new PrismaAlunosRepository();
      const prismaProfessoresRepository = new PrismaProfessoresRepository();

      const findRoomService = new FindByNameRoomService(prismaRoomsRepository);
      const userIsInRoomSocketService = new UserIsInRoomSocketService(prismaUserRoomsRepository, prismaRoomsRepository);
      const addUserRoomSocketService = new AddUserRoomSocketService(prismaUserRoomsRepository, prismaRoomsRepository);
      const updateRoomSocketService = new UpdateRoomSocketService(prismaUserRoomsRepository, prismaRoomsRepository);
      const createUserRoomSocketService = new CreateUserRoomSocketService(prismaUserRoomsRepository);

      // Buscando a sala selecionada
      let room = await findRoomService.execute({id_name});

      // Vari??vel para formatar a sa??da das mensagens
      const final_messages: Message[] = [];

      // Se ela existir, conecta o aluno a sala
      if (room) {

        // Conectando o aluno a sala
        socket.join(Object(room).id_name);

        // Sempre que houver reload, um novo socket ?? criado
        // Podem existir duplicatas
        // Por isso, uma verifica????o de seguran??a ?? realizada

        // Verificando se o usu??rio j?? est?? na sala
        const isInRoom = await userIsInRoomSocketService.execute({ id_room: Object(room).id, id_connected: data.id_connected });
        
        // Se j?? estiver na sala...
        if(isInRoom) {
          // Atualiza o seu socket
          await updateRoomSocketService.execute({ id_room: Object(room).id, id_socket: socket.id, id_connected: data.id_connected });
        }

        // Se n??o...
        else {
          // Adiciona o usu??rio ?? sala
          await addUserRoomSocketService.execute({ id_room: Object(room).id, id_socket: socket.id, id_connected: data.id_connected });
        }

        // Pegando todas as mensagens da sala
        const messsages_raw = await getMessagesRoomFunction(Object(room).id, prismaMessagesRepository, prismaRoomsRepository);
        const mes = [...Object.values(messsages_raw)];

        // Percorrendo as mensagens da sala
        for (let msg of mes) {
          let msg_aux: Message = {
            _id: msg.id,
            text: msg.text,
            createdAt: msg.created_at,
            user: {
              _id: msg.id_user,
            }
          }

          // Adicionando as mensagens ao array de sa??da formatada
          final_messages.push(msg_aux);
        }
      }

      // Se ela n??o existir, cria a sala com o id do aluno e do professor
      else {
        
        const prismaProfessoresRepository = new PrismaProfessoresRepository();

        const createRoomService = new CreateRoomService(prismaRoomsRepository, prismaAlunosRepository, prismaProfessoresRepository);
        
        // Criando a sala
        room = await createRoomService.execute({
          id_aluno: data.id_aluno,
          id_professor: data.id_professor,
          id_name,
        });

        // Adicionando usu??rio na sala
        await createUserRoomSocketService.execute({
          id_room: Object(room).id,
          id_connected: data.id_connected,
          id_socket: socket.id,
        })

        // Neste momento do c??digo, iremos verificar as salas abertas e retorn??-las para o professor em tempo real
        const getOpenUserRooms = new GetOpenRoomsService(prismaRoomsRepository, prismaProfessoresRepository);
        
        // Verificando as salas abertas com este professor
        const openRooms = await getOpenUserRooms.execute({
          id_professor: data.id_professor
        });

        // Enviando as salas abertas para o professor
        socket.emit("open_chats", openRooms);
      }

      // Organizando os dados finais
      result = {
        room_id: Object(room).id,
        messages: final_messages
      }

      // Retornando os dados por callback
      callback(
        result
      );

    });
  
    // Evento de enviar a mensagem
    socket.on("send_message", async (data, callback:definitionInterface2) => {
      
      console.log(data)

      // Retornando as mensagens enviadas para todos da sala
      io.emit("received_message", data);

      // Salvando a mensagem no banco
      const createMessageService = new CreateMessageService(prismaRoomsRepository, prismaEscolaUsersRepository, prismaMessagesRepository);
      const message = await createMessageService.execute({
        id_room: data[0].user._idSala,
        id_user: data[0].user._id, 
        text: data[0].text
      });

      if (message instanceof Error) {
        return new Error("Erro ao criar a mensagem");
      }

      callback("Message Received")
    });
  
    // Evento para desconectar o socket
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });

});

module.exports = io.of("/conquistas").on("connection", (socket) => {

  console.log("Conex??o com '/conquistas' realizado!")
  
  socket.on("RESPONDA_X_ATIVIDADES", async (data, callback) => {
    
    console.log("chegou")

    // Repositories
    const conquistasRepository = new PrismaConquistasRepository();
    const prismaResponda_X_AtividadesRepository = new PrismaResponda_X_AtividadesRepository();
    const checkResponda_X_AtividadesService = new CheckResponda_X_AtividadesService(conquistasRepository, prismaResponda_X_AtividadesRepository);

    const resposta = await checkResponda_X_AtividadesService.execute({ id_aluno: data.id_aluno });
    console.log(resposta)

    callback("Ok")
  })


  // TODO: O JEITO QUE DEU MAIS CERTO ====================================================

  // const controller = new CheckResponda_X_AtividadesController()
  // controller.handle(socket)
  
  // const controller2 = new CreateAlunoRespondeAtividadeController()
  // controller2.handle(socket)

  // new CheckResponda_X_AtividadesController().handle

  // Evento para desconectar o socket
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

})

// Fun????o para pegar as mensagens da sala
async function getMessagesRoomFunction(id_room: string, prismaMessagesRepository: PrismaMessagesRepository, prismaRoomsRepository: PrismaRoomsRepository) {
  const getMessagesByRoom = new GetMessagesByRoomService(prismaRoomsRepository, prismaMessagesRepository);

  const messages = await getMessagesByRoom.execute({
    id_room
  });

  return messages;
}

// export { io };