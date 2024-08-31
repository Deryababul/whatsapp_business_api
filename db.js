import fs from "fs/promises"; // Asenkron işlemler için fs/promises modülünü kullanın
import ms from "./messageService.js";
import path from "path";


const {
  messageService
} = ms;

// Dosya yollarını belirleyin
const processFilePath = path.join(process.cwd(), "process.json");
const taskFilePath = path.join(process.cwd(), "task.json");
const messageFilePath = path.join(process.cwd(), "messages.json");

// Asenkron JSON dosyasına veri yazma fonksiyonu
const writeProcessFile = async (processData) => {
  try {
    const readFileResult = await readProcessFile();
    let jsonData = readFileResult.body;

    // Eğer JSON verisi null ise yeni bir dizi oluştur
    if (jsonData == null) {
      jsonData = [];
    }

    // Listeye yeni veriyi ekleme
    jsonData.push(processData);

    // Güncellenmiş veriyi JSON formatında stringe çevirme
    const updatedData = JSON.stringify(jsonData, null, 2);

    // JSON dosyasına yazma
    await fs.writeFile(processFilePath, updatedData);

    return {
      body: null,
      message: messageService.SUCCESS_WROTE_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(messageService.ERROR_WROTE_FILE_MESSAGE, err);
    return {
      body: null,
      message: messageService.ERROR_WROTE_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};


const updateProcessFile = async (process) => {
  console.log("ben geldim process: ", process)
  try {
    const readFileResult = await readProcessFile();
    let jsonData = readFileResult.body;

    // Eğer JSON verisi null ise yeni bir dizi oluştur
    if (jsonData == null) {
      jsonData = [];
    }

    const index = jsonData.findIndex((obj) => obj.id === process.id);

    jsonData[index] = { ...jsonData[index], ...process };

    // Güncellenmiş veriyi JSON formatında stringe çevirme
    const updatedData = JSON.stringify(jsonData, null, 2);

    // JSON dosyasına yazma
    await fs.writeFile(processFilePath, updatedData);

    return {
      body: null,
      message: messageService.SUCCESS_WROTE_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(messageService.ERROR_WROTE_FILE_MESSAGE, err);
    return {
      body: null,
      message: messageService.ERROR_WROTE_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};



const updateTaskFile = async (task) => {
  try {
    const readFileResult = await readTaskFile();
    let jsonData = readFileResult.body;

    // Eğer JSON verisi null ise yeni bir dizi oluştur
    if (jsonData == null) {
      jsonData = [];
    }

    const index = jsonData.findIndex((obj) => obj.id === task.id);

    jsonData[index] = { ...jsonData[index], ...task };

    // Güncellenmiş veriyi JSON formatında stringe çevirme
    const updatedData = JSON.stringify(jsonData, null, 2);

    // JSON dosyasına yazma
    await fs.writeFile(taskFilePath, updatedData);

    return {
      body: null,
      message: messageService.SUCCESS_WROTE_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(messageService.ERROR_WROTE_FILE_MESSAGE, err);
    return {
      body: null,
      message: messageService.ERROR_WROTE_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

// Asenkron JSON dosyasını okuma fonksiyonu
const readProcessFile = async () => {
  try {
    let data = await fs.readFile(processFilePath, "utf8");
    // console.log(data)
    data = data ? JSON.parse(data) : [];
    console.log("readProcessFile: ", data)

    return {
      body: data,
      message: messageService.SUCCESS_FIND_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(err);
    return {
      body: null,
      message: messageService.ERROR_FIND_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

// Asenkron `task.json` dosyasına veri yazma fonksiyonu
const writeTaskFile = async (taskData) => {
  try {
    const readFileResult = await readTaskFile();
    let jsonData = readFileResult.body;

    // Eğer JSON verisi null ise yeni bir dizi oluştur
    if (jsonData == null) {
      jsonData = [];
    }

    // Listeye yeni veriyi ekleme
    jsonData.push(taskData);

    // Güncellenmiş veriyi JSON formatında stringe çevirme
    const updatedData = JSON.stringify(jsonData, null, 2);

    // JSON dosyasına yazma
    await fs.writeFile(taskFilePath, updatedData);

    console.log(messageService.SUCCESS_WROTE_FILE_MESSAGE);
    return {
      body: null,
      message: messageService.SUCCESS_WROTE_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(messageService.ERROR_WROTE_FILE_MESSAGE, err);
    return {
      body: null,
      message: messageService.ERROR_WROTE_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

// Asenkron `task.json` dosyasını okuma fonksiyonu
const readTaskFile = async () => {
  try {
    let data = await fs.readFile(taskFilePath, "utf8");
    data = data ? JSON.parse(data) : [];
    return {
      body: data,
      message: messageService.SUCCESS_FIND_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    return {
      body: null,
      message: messageService.ERROR_FIND_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

const writeMessageFile = async (messageData) => {
  try {
    const readFileResult = await readMessageFile();
    let jsonData = readFileResult.body;

    // Eğer JSON verisi null ise yeni bir dizi oluştur
    if (jsonData == null) {
      jsonData = [];
    }

    // Listeye yeni veriyi ekleme
    jsonData.push(messageData);

    // Güncellenmiş veriyi JSON formatında stringe çevirme
    const updatedData = JSON.stringify(jsonData, null, 2);

    // JSON dosyasına yazma
    await fs.writeFile(messageFilePath, updatedData);

    return {
      body: null,
      message: messageService.SUCCESS_WROTE_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(messageService.ERROR_WROTE_FILE_MESSAGE, err);
    return {
      body: null,
      message: messageService.ERROR_WROTE_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

const updateMessageFile = async (message) => {
  try {
    const readFileResult = await readMessageFile();
    let jsonData = readFileResult.body;

    // Eğer JSON verisi null ise yeni bir dizi oluştur
    if (jsonData == null) {
      jsonData = [];
    }

    const index = jsonData.findIndex((obj) => obj.messageId === message.id);

    jsonData[index] = { ...jsonData[index], ...message };

    // Güncellenmiş veriyi JSON formatında stringe çevirme
    const updatedData = JSON.stringify(jsonData, null, 2);

    // JSON dosyasına yazma
    await fs.writeFile(messageFilePath, updatedData);

    return {
      body: null,
      message: messageService.SUCCESS_WROTE_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(messageService.ERROR_WROTE_FILE_MESSAGE, err);
    return {
      body: null,
      message: messageService.ERROR_WROTE_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

// Asenkron JSON dosyasını okuma fonksiyonu
const readMessageFile = async () => {
  try {
    let data = await fs.readFile(messageFilePath, "utf8");
    // console.log(data)
    data = data ? JSON.parse(data) : [];
    // console.log(data)

    return {
      body: data,
      message: messageService.SUCCESS_FIND_FILE_MESSAGE,
      status: messageService.SUCCESS,
    };
  } catch (err) {
    console.log(err);
    return {
      body: null,
      message: messageService.ERROR_FIND_FILE_MESSAGE,
      status: messageService.ERROR,
    };
  }
};

export default {
  writeProcessFile,
  updateProcessFile,
  writeTaskFile,
  readTaskFile,
  readProcessFile,
  updateTaskFile,
  readMessageFile,
  writeMessageFile,
  updateMessageFile,
};
