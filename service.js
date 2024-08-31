import dbRepository from "./dbRepository.js";
import ms from "./messageService.js";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import { Buffer } from "buffer";
import StatusEnum from "./statusEnum.js";
import fs from "fs";
// import FormData from "form-data";

dotenv.config();

const { GRAPH_API_TOKEN, PORT, PRIVATE_MANAGMENT_API } = process.env;

const {
  onGoingProcess,
  nextTask,
  updateProcess,
  updateTask,
  findMessageById,
  findMessageByTaskId,
  createMessage,
  createErrorCard,
  findTasksByProcessId,
  endOfTheTaskList,
} = dbRepository;

const { messageService, returnBody } = ms;

// export const sha256ToBase64 = (messageImageSha) => {
//     const hash = crypto.createHash('sha256');
//     hash.update(messageImageSha);
//     const base64Hash = hash.digest('base64');

//     console.log('Base64 Hash:', base64Hash);
//   return base64Hash;
// };

const sendImageByUrl = async () => {
  const phoneNumberId = 394915297035798;
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  // const data = {
  //   messaging_product: "whatsapp",
  //   recipient_type: "individual",
  //   to: 905349616069,
  //   type: "image",
  //   image: {
  //     link: "https://beycelik.com.tr/uploads/logos/logos-jpeg/beycelik-gestamp-jpg.JPG",
  //     caption:
  //       "🌟 *Beyçelik Gestamp'a Hoş Geldiniz!* 🌟 \n •Yeni bir hata kartı girişi yapmak için:\n ➡️ /start \n •Kullanım hakkında bilgi almak için: \n ℹ️ /info \n •Birden fazla bilgi eklediğiniz alanlardan çıkış yapmak için: \n ⏭️ /skip",
  //   },
  // };
  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: 905349616069,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "🌟 *Beyçelik Gestamp'a Hoş Geldiniz!* 🌟 \n ➡️ Start: Yeni bir hata kartı girişi yapmak \n ℹ️ Info: Kullanım hakkında bilgi almak ",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "start_button",
              title: "Start",
            },
          },
          {
            type: "reply",
            reply: {
              id: "info_button",
              title: "Info",
            },
          },
        ],
      },
    },
  };
  const headers = {
    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};

const downloadImage = async (mediaId, mimeType) => {
  try {
    const mediaUrlRes = await axios.get(
      `https://graph.facebook.com/v20.0/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${GRAPH_API_TOKEN}` },
      }
    );
    console.log("medşa",mediaUrlRes);
    const mediaUrl = mediaUrlRes.data.url;
    console.log("mediaurl", mediaUrl);
    const mediaRes = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      headers: { Authorization: `Bearer ${GRAPH_API_TOKEN}` },
    });
    console.log("mediares", mediaRes);
    const imageBuffer = Buffer.from(mediaRes.data, "binary");

    // Resmi base64 formatına dönüştür
    const base64Image = imageBuffer.toString("base64");

    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error downloading or converting image:", error);
    return null;
  }
};

// hali hazırda bir process yoksa kullanıcıyı yönlendirme karşılama mesajları iletmek için kullanılan fonksiyon
const welcomeMessage = async (phoneNumber, userMessage) => {
  if (userMessage == "Info") {
    console.log("welcomemessage info");
    return returnBody(
      "Hata kartı girmek için istenilen bilgileri doldur.",
      messageService.SUCCESS,
      messageService.SUCCESS
    );
  } else {
    const response = sendImageByUrl();
    console.log(response);
    console.log("welcomemessage diğer");
  }
};

// Kullanıcıdan mesaj alır işler ve sıradaki görevi döndürür
const receiveMessage = async (phoneNumber, userMessage, mediaId, mimeType) => {
  let listEndFlag = false;

  // console.log(`burdayızzz: ${JSON.stringify(phoneNumber)}`);
  let processResult = await onGoingProcess(phoneNumber);
  // const phoneNumberValue = phoneNumber.phoneNumber;
  // console.log(`geldik şimdi4: ${JSON.stringify(await processResult)}`);

  if (processResult.message === messageService.PROCESS_ON_GOING_NOT_FOUND) {
    if (userMessage == "Start") {
      const createRes = await createErrorCard(phoneNumber);
      processResult = createRes.body.process;
      let firstTask = createRes.body.taskList[0];
      console.log("pırasa: ", processResult);
      console.log("domates: ", createRes);

      return returnBody(
        `Hata kartı oluşturma başlatıldı.\n\n${firstTask.header}.`,
        messageService.SUCCESS,
        messageService.SUCCESS
      );
    } else {
      console.log("buraya girdi ki3.");

      return welcomeMessage(phoneNumber, userMessage);
    }
  }

  if (processResult.status === messageService.ERROR) {
    return processResult;
  }

  const process = processResult.body;
  console.log(userMessage);
  if (userMessage != "/skip") {
    // Sıradaki görevi al
    const taskResult = await nextTask(process.id, null, userMessage);
    console.log("a", taskResult);
    if (taskResult.status === messageService.ERROR) {
      return taskResult;
    }

    const task = taskResult.body;

    console.log("bu taskmiş", task);

    if (task == null) {
      console.log("peynir");
      const doneRes = doneProcess(process);

      return doneRes;
    }

    // endOfTheTaskList
    console.log("naneyi");

    if (task.listType) {
      // burda kaldın
      console.log("yedik");
      //     const endOfTheTaskListRes = endOfTheTaskList(process.id, task);

      //     if (endOfTheTaskListRes.status == messageService.SUCCESS)
      listEndFlag = true;
    }

    // task.sendMessageType == "direct";
    console.log("bu send messagetype", task.sendMessageType);

    if (task.sendMessageType == "api") {
      // APIDEN VERİLER GELECEK PRIVATE_MANAGMENT_API
      const resFindMessage = await findMessageByTaskId(task.id);
      console.log("task için bulunan res mesaj: ", resFindMessage);

      if (resFindMessage.body != null) {
        const taskMessage = resFindMessage.body;
        let correctMessage = taskMessage.sentMessageList.find(
          (l) => l.selectNumber == userMessage
        );
        console.log("task için bulunan mesaj: ", correctMessage);
        console.log("task için gönderilen mesaj: ", userMessage);

        if (correctMessage) {
          if (listEndFlag == false) {
            task.body = correctMessage.guidId;
          } else {
            if (task.body == null) {
              task.body = [];
            }
            task.body.push(correctMessage.guidId);
          }

          const updateResult = await updateTask(task);

          // Görevi güncelle
          if (updateResult.status === messageService.ERROR) {
            return updateResult;
          }
        } else {
          return returnBody(
            null,
            "Hatalı numara girdiniz lütfen tekrar deneyiniz.",
            messageService.ERROR
          );
        }
      }
    } else if (task.sendMessageType == "direct") {
      console.log(task.resType);
      if (task.resType === "image") {
        console.log("image e girdi")
        const imageBuffer = await downloadImage(mediaId, mimeType); // imageBuffer'ı bu şekilde alabilirsin
        console.log(imageBuffer);

        if (imageBuffer) {
          // Base64 formatı
          const imageBase64 = imageBuffer.toString("base64");
          console.log(imageBase64);
          if (listEndFlag == false) {
            task.body = imageBase64;
          } else {
            if (task.body == null) {
              task.body = [];
            }
            task.body.push(imageBase64);
          }
        } else {
          return returnBody(
            null,
            "Resim indirilemedi, lütfen tekrar deneyiniz.",
            messageService.ERROR
          );
        }
      } else if (task.resType === "int") {
        //farklı numara gelmiş mi kontrolü
        if (listEndFlag == false) {
          console.log("fare");
          task.body = userMessage;
        } else {
          console.log("salatalık");
          if (task.body == null) {
            task.body = [];
          }
          task.body.push(userMessage);
        }

        console.log(task.body);
      } else if (task.resType === "string") {
        if (task.header == "İç/Dış Hata: (I veya O şeklinde tuşlama yapınız)") {
          let cleanedMessage = userMessage.trim().toUpperCase();
          console.log(cleanedMessage);

          if (cleanedMessage === "İÇ" || cleanedMessage === "DIŞ") {
            cleanedMessage = cleanedMessage == "İÇ" ? "I" : "O";
            if (listEndFlag == false) {
              task.body = cleanedMessage;
            } else {
              if (task.body == null) {
                task.body = [];
              }
              task.body.push(cleanedMessage);
            }
            console.log("iç dış hata", task.body);
          } else {
            return returnBody(
              null,
              "Hata: Geçersiz giriş. Yalnızca 'I' veya 'O' yazılabilir.",
              messageService.ERROR
            );
          }
        } else {
          if (listEndFlag == false) {
            task.body = userMessage;
          } else {
            if (task.body == null) {
              task.body = [];
            }
            task.body.push(userMessage);
          }
          console.log("iç dış hata değil", task.body);
        }
      } else if (task.resType === "double" || task.resType === "decimal") {
        if (!isNaN(userMessage)) {
          if (listEndFlag == false) {
            task.body = parseFloat(userMessage);
          } else {
            if (task.body == null) {
              task.body = [];
            }
            task.body.push(parseFloat(userMessage));
          }
          console.log("api decimal", task.body);
        } else {
          return returnBody(
            null,
            "Hata: Geçersiz giriş. Kullanıcı sadece sayı girmelidir.",
            messageService.ERROR
          );
        }
      } else if (task.resType === "DateTime") {
        // Tarih formatını (DD.MM.YYYY) düzenli ifadeyle kontrol et
        const dateTimePattern = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/;
        if (dateTimePattern.test(userMessage)) {
          // Tarihin geçerli olup olmadığını kontrol et
          const [datePart, timePart] = userMessage.split(" ");
          const [day, month, year] = datePart.split(".");
          const [hour, minute] = timePart.split(":");

          const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

          if (
            !isNaN(date.getTime()) &&
            date.getDate() == parseInt(day) &&
            date.getMonth() + 1 == parseInt(month) &&
            date.getFullYear() == parseInt(year) &&
            date.getHours() == parseInt(hour) &&
            date.getMinutes() == parseInt(minute)
          ) {
            if (listEndFlag == false) {
              task.body = userMessage;
            } else {
              if (task.body == null) {
                task.body = [];
              }
              task.body.push(userMessage);
            }
            console.log(task.body);
          } else {
            return returnBody(
              null,
              "Hata: Geçersiz giriş. Lütfen geçerli bir tarih giriniz.",
              messageService.ERROR
            );
          }
        } else {
          return returnBody(
            null,
            "Hata: Geçersiz giriş. Tarih ve saat formatı DD.MM.YYYY HH:MM olmalıdır.",
            messageService.ERROR
          );
        }
      }

      const updateResult = await updateTask(task);
      if (updateResult.status === messageService.ERROR) {
        return updateResult;
      }
    }
  }

  // Bir sonraki görevi al
  const nextTaskResult = await nextTask(process.id, "next", userMessage);
  // console.log(`geldik şimdi1: ${JSON.stringify(nextTaskResult)}`);
  // görevlerin bittiğini burdan anlıyoruz
  if (nextTaskResult.status == messageService.TASKS_DONE) {
    // console.log("zeytin");

    const doneRes = doneProcess(process);

    return doneRes;
  }

  if (nextTaskResult.status === messageService.ERROR) {
    return nextTaskResult;
  }

  const nextTaskObj = nextTaskResult.body;
  const nextTaskObjBody = nextTaskObj.body;
  console.log("obj",nextTaskObj);

  let sendText = nextTaskObj.header;
  //birden fazla girdi verilecek olan sorular için 2. kez soru sorulduğunda uyarı gelmesi için
  if (nextTaskObjBody && nextTaskObjBody.length > 0) {
      sendText = nextTaskObj.header + "\n⚠️Bir sonraki aşamaya geçmek için butona basınız";
    
    return {
    body: sendText,
    message: messageService.SUCCESS,
    status: messageService.SUCCESS ,
    interactiveBody: {
        type: "button",
        body: {
          text: sendText,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "skip_button",
                title: "/skip",
              },
            },
          ],
        },
      },
  };
  }

  else if (nextTaskObj.sendMessageType == "api") {
    // APIDEN VERİLER GELECEK
    const list =
      nextTaskObj.header == "Müşteri numarasını giriniz:"
        ? [
            {
              guidId: "32532",
              selectNumber: "1",
              body: "BMC",
            },
            {
              guidId: "756345",
              selectNumber: "2",
              body: "DAIMLER",
            },
            {
              guidId: "256463",
              selectNumber: "3",
              body: "FIAT",
            },
            {
              guidId: "2367",
              selectNumber: "4",
              body: "TOGG",
            },
            {
              guidId: "7863453",
              selectNumber: "5",
              body: "RENAULT",
            },
            {
              guidId: "23536",
              selectNumber: "6",
              body: "FORD",
            },
          ]
        : nextTaskObj.header == "Proje numarasını giriniz:"
        ? [
            {
              guidId: "32532",
              selectNumber: "1",
              body: "Ford_V710",
            },
            {
              guidId: "756345",
              selectNumber: "2",
              body: "P2JO_LCA",
            },
            {
              guidId: "256463",
              selectNumber: "3",
              body: "PSA P24",
            },
          ]
        : nextTaskObj.header == "Parça numarasını giriniz:"
        ? [
            {
              guidId: "32532",
              selectNumber: "1",
              body: "ASY_FRT_COMPARTMENT_LWR_AACS_0101900005-06_A",
            },
            {
              guidId: "756345",
              selectNumber: "2",
              body: "0104900003_A ",
            },
            {
              guidId: "256463",
              selectNumber: "3",
              body: "ASY_FRT_COMPARTMENT_LWR_AACS_0101900005-06_A",
            },
            {
              guidId: "2367",
              selectNumber: "4",
              body: "0104900003_A ",
            },
          ]
        : nextTaskObj.header == "Operasyon numarasını giriniz:"
        ? [
            {
              guidId: "32532",
              selectNumber: "1",
              body: "OP20 PROTOTİP",
            },
            {
              guidId: "756345",
              selectNumber: "2",
              body: "OP20 PROTOTİP",
            },
            {
              guidId: "256463",
              selectNumber: "3",
              body: "OP20 PROTOTİP",
            },
            {
              guidId: "2367",
              selectNumber: "4",
              body: "OP20 PROTOTİP",
            },
          ]
        : [
            {
              guidId: "32532",
              selectNumber: "1",
              body: "Final Montaj",
            },
            {
              guidId: "756345",
              selectNumber: "2",
              body: "CNC",
            },
            {
              guidId: "256463",
              selectNumber: "3",
              body: "Final Montaj",
            },
            {
              guidId: "2367",
              selectNumber: "4",
              body: "Final Montaj",
            },
          ];

    list.map((l) => (sendText += `\n${l.selectNumber}- ${l.body}`));

    createMessage(null, nextTaskObj.id, list);

  }
    return {
    body: sendText,
    message: messageService.SUCCESS,
    status: messageService.SUCCESS ,
    interactiveBody: nextTaskObj.interactive,
  };

};

export const doneProcess = async (process) => {
  process.status = StatusEnum.DONE;
  const updateRes = await updateProcess(process);
  console.log("bitti: ", updateRes);
  if (updateRes.status == messageService.ERROR) {
    return updateRes;
  }

  const tasksRes = await findTasksByProcessId(process.id);
  console.log(tasksRes);
  const tasks = tasksRes.body;

  let doneText = "📝 *Vermiş olduğunuz cevaplar*\n";

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];

    if (task.sendMessageType == "api") {
      const resFindMessage = await findMessageByTaskId(task.id);
      console.log("task için bulunan res mesaj: ", resFindMessage);

      if (resFindMessage.body != null) {
        const taskMessage = resFindMessage.body;

        doneText += `\n📌 *${task.header}*`;

        if (!task.listType) {
          let correctMessage = taskMessage.sentMessageList.find(
            (l) => l.guidId == task.body
          );

          if (correctMessage) {
            doneText += `\n✅ ${correctMessage.body}`;
          }
        } else {
          let correctMessages = task.body.map((t) =>
            taskMessage.sentMessageList.find((l) => l.guidId == t)
          );

          correctMessages.map(
            (correctMessage) => (doneText += `\n✅ ${correctMessage.body}`)
          );
        }

        //         let correctMessage = taskMessage.sentMessageList.find(
        //           (l) => l.guidId == task.body
        //         );

        //         if (correctMessage) {
        //           doneText += `\n${task.header} ${correctMessage.body}`;
        //         }
      }
    } else if (task.resType != "image") {
      doneText += `\n📌 *${task.header}*`;
      if (task.listType) {
        task.body.map((t) => (doneText += `\n✅${task.body}`));
      } else {
        doneText += `\n✅ ${task.body}`;
      }
    } else {
      // image ile ilgili kod gelecek
    }
  }
  return returnBody(doneText, messageService.SUCCESS, messageService.SUCCESS);
};

export const sendMessage = async (
  to,
  text,
  businessPhoneNumberId,
  interactiveBody = null
) => {
  console.log(`to: ${to}\ntext${text}\n${businessPhoneNumberId}`);
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${businessPhoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        text: { body: text },
        type: interactiveBody ? "interactive" : null,
        interactive: interactiveBody,
      },
      {
        headers: { Authorization: `Bearer ${GRAPH_API_TOKEN}` },
      }
    );
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
};

const processAndSendMessage = async (
  phoneNumber,
  userMessage,
  businessPhoneNumberId,
  mediaId,
  mimeType
) => {
  const result = await receiveMessage(
    phoneNumber,
    userMessage,
    mediaId,
    mimeType
  );
  console.log("result",result)
  if (result.status === messageService.ERROR) {
    console.error(`Error: ${result.message}`);

    await sendMessage(
      phoneNumber,
      `Error: ${result.message}`,
      businessPhoneNumberId,
      result.interactiveBody
    );
  } else {
    console.log(`Next Task: ${result.body}`);

    await sendMessage(
      phoneNumber,
      result.body,
      businessPhoneNumberId,
      result.interactiveBody
    );
  }
};

export const handleIncomingMessage = async (message, businessPhoneNumberId) => {
  // console.log(`ben kaç kere çalıştım: ${JSON.stringify(message)}`);
  const messageId = message.id;
  if (message.type == "image") {
    const messageImageSha = message.image.sha256;
  }

  const resFindMessage = await findMessageById(messageId);
  console.log("bulunan mesaj: ", resFindMessage);
  // daha önce gelen bir mesaj tekrar gelmiş demektir
  if (resFindMessage.status === messageService.SUCCESS) {
    return returnBody(null, "Invalid message format", messageService.ERROR);
  }

  const resCreateMessage = await createMessage(messageId);

  if (resCreateMessage.status === messageService.ERROR) {
    return resCreateMessage;
  }

  const phoneNumber = message.from;
  let userMessage;
  if (message.interactive != null) {
    userMessage = message.interactive.button_reply.title;
  } else {
    userMessage = message.text?.body;
  }
  const mediaId = message.image?.id;
  const mimeType = message.image?.mime_type;
  let messageType = "text";
  if (mediaId && mimeType) {
    messageType = "image";
  }
  if (!phoneNumber || (!userMessage && messageType !== "image")) {
    return returnBody(null, "Invalid message format", messageService.ERROR);
  }

  //Daha önce bi süreç var mı yok mu kontrol
  // const processResult = await onGoingProcess(phoneNumber);
  // if (processResult.status === messageService.ERROR || !processResult.body) {
  //   await sendMessage(
  //     phoneNumber,
  //     "Merhaba size nasıl yardımcı olabilirim? 1- Hata bildirimi yap.",
  //     businessPhoneNumberId
  //   );
  // }

  await processAndSendMessage(
    phoneNumber,
    userMessage,
    businessPhoneNumberId,
    mediaId,
    mimeType
  );
};

export default processAndSendMessage;
