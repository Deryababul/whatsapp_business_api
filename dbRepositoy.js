import db from "./db.js";
import { v4 as uuidv4 } from "uuid";
import ms from "./messageService.js";
import StatusEnum from "./statusEnum.js";

const { messageService } = ms;

// gönderilen processId ye göre processe ait taskları çeker ( return: Task[] )
const findTasksByProcessId = async (processId) => {
  const result = await db.readTaskFile();

  if (result.status === messageService.ERROR) {
    return result;
  }

  const tasks = result.body;

  const filterTasks = await tasks.filter((task) => task.processId == processId);

  return {
    body: filterTasks,
    message: messageService.SUCCESS_DATA_FOUND,
    status: messageService.SUCCESS,
  };
};

// gönderilen phoneNumber a göre süreci devam eden bir process var mı diye kontrol eder ( return: process )
const onGoingProcess = async (phoneNumber) => {
  console.log(`ilk geliş: ${JSON.stringify(phoneNumber)}`);
  const result = await db.readProcessFile();

  if (result.status === messageService.ERROR) {
    // console.log(`ctrdas`);
    console.log("aaaa", result);
    return result;
  }
  console.log("bbb", result);

  const processes = result.body;
  let process = null;
  try {
    process = await processes.find(
      (process) =>
        process.phoneNumber == phoneNumber && process.status == StatusEnum.TODO
    );
  } catch (err) {
    // console.log(`ctrds`);

    return {
      body: null,
      message: messageService.PROCESS_UNEXPECTED_ERROR,
      status: messageService.ERROR,
    };
  }
  console.log(`ctr`);

  if (process != null) {
    // console.log(
    //   `henüz dolmamış process bulundu: ${JSON.stringify(process, null, 2)}`
    // );
    return {
      body: process,
      message: messageService.PROCESS_ON_GOING_FOUND,
      status: messageService.SUCCESS,
    };
  }

  return {
    body: null,
    message: messageService.PROCESS_ON_GOING_NOT_FOUND,
    status: messageService.ERROR,
  };
};

// Eğer veri tabanında process mevcut değilse yeni process ve task ları oluşturur phoneNumber
const createErrorCard = async (phoneNumber) => {
  console.log(`bu geldi: ${JSON.stringify(phoneNumber)}`);
  // console.log("oluşturulmaya başlıyor");
  const newProcess = {
    id: generateRandomId(),
    phoneNumber: phoneNumber,
    expireDate: new Date(),
    status: StatusEnum.TODO,
  };
  const saveProductResult = await db.writeProcessFile(newProcess);
  // console.log("ilk product oluşturuldu");

  if (saveProductResult.status === messageService.ERROR) {
    return saveProductResult;
  }
  // console.log("product oluşturma başarılı");

  // console.log("taskler oluşuyor");

  // burada hata kartı modelinde bulunan değişken kadar task oluşacak
  let taskList = [];
  const taskHeaderList = [
    {
      resType: "image",
      header: "Hatalı olan ürünün görselini yükleyiniz:",
      sendMessageType: "direct",
      listType: "img",
      listOkey: false,
    },
    {
      resType: "int",
      header: "Müşteri numarasını giriniz:",
      sendMessageType: "api",
      api: "/api/Customers",
    },
    {
      resType: "int",
      header: "Proje numarasını giriniz:",
      sendMessageType: "api",
      api: "",
    },
    {
      resType: "int",
      header: "Parça numarasını giriniz:",
      sendMessageType: "api",
      api: "",
    },
    {
      resType: "int",
      header: "Operasyon numarasını giriniz:",
      sendMessageType: "api",
      api: "",
    },
    {
      resType: "int",
      header: "Hata tespit yerinin numarasını giriniz:",
      sendMessageType: "api",
      api: "",
    },
    {
      resType: "string",
      header: "İç/Dış Hata: (I veya O şeklinde tuşlama yapınız)",
      sendMessageType: "direct",
      interactive: {
            type: "button",
            body: {
                text: "İç/Dış Hata: (I veya O şeklinde tuşlama yapınız)",
            },
            action: {
                buttons: [
                    {
                        type: "reply",
                        reply: {
                            id: "ic_button",
                            title: "İç"
                        }
                    },
                  {
                        type: "reply",
                        reply: {
                            id: "dis_button",
                            title: "Dış"
                        }
                    }
                ]
            }
        }
    },
    {
      resType: "string",
      header: "Kalıp montaj numarasını giriniz:",
      sendMessageType: "direct",
    },
    {
      resType: "decimal",
      header: "Hatanın maliyetini giriniz: örn(54.26)",
      sendMessageType: "direct",
      api: "",
    },
    {
      resType: "int",
      header: "Maliyet alanının numarasını giriniz:", //brikaç seçenekli örn: metot montaj.. costfieldid
      sendMessageType: "api",
      listType: "cost",
      listOkey: false,
      api: "",
    },
    {
      resType: "int",
      header: "Birim maliyetinin numarasını giriniz:", //CostMoneyTypeId
      sendMessageType: "api",
      listType: "cost",
      listOkey: false,
      api: "",
    },
    {
      resType: "double",
      header: "Maliyet süresini giriniz: (örn; 11s 50d)", //CostTime
      sendMessageType: "direct",
      listType: "cost",
      listOkey: false,
    },
    {
      resType: "string",
      header: "Maliyet açıklamasını giriniz:", //CostDescription
      sendMessageType: "direct",
      listType: "cost",
      listOkey: false,
    },
    {
      resType: "int",
      header: "Sayfa numarasını giriniz:",
      sendMessageType: "direct",
    },
    {
      resType: "int",
      header: "RevNumber giriniz:", //açılışını bilmemek
      sendMessageType: "direct",
    },
    {
      resType: "string",
      header: "Form numarasını giriniz:",
      sendMessageType: "direct",
    },
    {
      resType: "DateTime",
      header: "Hatanın açılma tarihini giriniz (örn; 16.08.2024 14:47):", //DateStart
      sendMessageType: "direct",
    },
    {
      resType: "DateTime",
      header: "Hatanın kapatılma tarihini giriniz (örn; 16.08.2024 14:47):",
      sendMessageType: "direct",
    },
    {
      resType: "string",
      header: "Hata açıklamasını giriniz:", //ErrorDescription
      sendMessageType: "direct",
    },
    // {
    //   resType: "string",
    //   header: "PartNo giriniz:",
    //   sendMessageType: "direct",
    // },
    // {
    //   resType: "string",
    //   header: "OperationNo giriniz:",
    //   sendMessageType: "direct",
    // },
  ];

  //    public int? PageNumber { get; set; }
  //  public int? RevNumber { get; set; }

  //  public double CostTime { get; set; }

  //  public string? FormNumber { get; set; } = string.Empty;
  //  public string MontageNumber { get; set; } = string.Empty;
  //  public string PartNo { get; set; } = string.Empty;
  //  public string OperationNo { get; set; } = string.Empty;
  //  public string CostDescription { get; set; } = string.Empty;
  //  public string ErrorDescription { get; set; } = string.Empty;
  //  public string ErrorMediaBase64 { get; set; } = string.Empty;

  //  public Guid CustomerId { get; set; }
  //  public Guid ProjectId { get; set; }
  //  public Guid ErrorDetectionLocationId { get; set; }
  //  public Guid ErrorDetectedByUserId { get; set; }
  //  public Guid UnitId { get; set; }
  //  public Guid CostFieldId { get; set; }
  //  public Guid CostMoneyTypeId { get; set; }

  //  public DateTime? DateStart { get; set; }
  //  public DateTime? DateFinish { get; set; }

  //  public char ErrorInOrOut { get; set; }

  //  public decimal CostAmount { get; set; }

  for (let i = 0; i < taskHeaderList.length; i++) {
    const newTask = {
      id: generateRandomId(),
      rowNumber: i,
      header: taskHeaderList[i].header,
      resType: taskHeaderList[i].resType,
      listType: taskHeaderList[i].listType,
      interactive: taskHeaderList[i].interactive,
      listOkey: taskHeaderList[i].listOkey,
      sendMessageType: taskHeaderList[i].sendMessageType,
      api: taskHeaderList[i].api,
      body: null,
      processId: newProcess.id,
      isSaved: false,
    };
    taskList.push(newTask);

    const taskResult = await db.writeTaskFile(newTask);
    if (taskResult.status === messageService.SUCCESS) {
      // console.log(`Task ${i} oluştu`);
    }
  }
  console.log("soğan: ", taskList);
  console.log(`bitti`);
  console.log(`newProcess: ${JSON.stringify(newProcess)}`);

  return {
    body: { process: newProcess, taskList: taskList },
    message: messageService.SUCCESS_PROCESS_AND_TASKS_CREATED,
    status: messageService.SUCCESS,
  };
};

const findMessageById = async (messageId) => {
  const result = await db.readMessageFile();
  console.log("zx");

  if (result.status === messageService.ERROR) {
    return result;
  }

  let messages = result.body;
  // console.log("mesaj listesi: ", messages);

  if (!messages) {
    messages = [];
  }
  console.log("gelen mesaj id: ", messageId);

  const findMessage = messages.find(
    (message) => message.messageId == messageId
  );
  console.log(`mesaj bulundu: ${JSON.stringify(findMessage)}`);

  if (findMessage) {
    return {
      body: findMessage,
      message: messageService.SUCCESS_DATA_FOUND,
      status: messageService.SUCCESS,
    };
  }

  return {
    body: null,
    message: messageService.ERROR_DATA_FOUND,
    status: messageService.ERROR,
  };
};

const findMessageByTaskId = async (taskId) => {
  const result = await db.readMessageFile();
  console.log("zx");

  if (result.status === messageService.ERROR) {
    return result;
  }

  let messages = result.body;
  // console.log("mesaj listesi: ", messages);

  if (!messages) {
    messages = [];
  }

  const findMessage = messages.find((message) => message.taskId == taskId);
  console.log(`mesaj bulundu: ${JSON.stringify(findMessage)}`);

  if (findMessage) {
    return {
      body: findMessage,
      message: messageService.SUCCESS_DATA_FOUND,
      status: messageService.SUCCESS,
    };
  }

  return {
    body: null,
    message: messageService.ERROR_DATA_FOUND,
    status: messageService.ERROR,
  };
};

const createMessage = async (
  messageId,
  taskId = null,
  sentMessageList = null
) => {
  console.log("as");
  const newMessage = {
    id: generateRandomId(),
    messageId: messageId,
    sentMessageList: sentMessageList,
    taskId: taskId,
    body: null,
  };
  const saveMessageResult = await db.writeMessageFile(newMessage);
  console.log("asd");

  if (saveMessageResult.status === messageService.ERROR) {
    return saveMessageResult;
  }
  console.log("asdf");

  return {
    body: newMessage,
    message: messageService.SUCCESS_PROCESS_AND_TASKS_CREATED,
    status: messageService.SUCCESS,
  };
};

const endOfTheTaskList = async (processId, previousTask) => {
  let firstOnTheTaskList = null;
  let flag = true;
  const tasksResult = await db.readTaskFile();

  if (tasksResult.status === messageService.ERROR) {
    return tasksResult;
  }

  const tasks = tasksResult.body;

  let filteredTasks = await tasks.filter(
    (task) => task.processId === processId
  );

  filteredTasks.sort((a, b) => a.number - b.number);

  for (let i = 0; i < filteredTasks.length; i++) {
    const task = filteredTasks[i];

    if (flag == false && task?.listType == previousTask?.listType) {
      firstOnTheTaskList = task;
      break;
    }

    if (flag == true && task?.listType == previousTask?.listType) {
      firstOnTheTaskList = task;
      flag = false;
    }
  }
  if (
    firstOnTheTaskList != null &&
    firstOnTheTaskList?.listType != previousTask?.listType
  ) {
    return {
      body: firstOnTheTaskList,
      message: "Listenin sonuna geldi ve başa dönülüyor.",
      status: messageService.SUCCESS,
    };
  }

  return {
    body: null,
    message: "Liste devam ediyor.",
    status: messageService.ERROR,
  };
};

const differenceTaskListTypeLength = (tasks, currentTask) => {
  let previousLength = null;
  let index = tasks.findIndex((t) => t.id == currentTask.id);
  console.log(index);

  for (let i = 0; i < index; i++) {
    const task = tasks[i];
    task.body = task.body != null ? task.body : [];

    if (task.body.length > currentTask.body.length) {
      return true;
    }
  }
  return false;
};

const nextTask = async (processId, previousTask, userMessage) => {
  let flag = false;
  const tasksResult = await db.readTaskFile();

  if (tasksResult.status === messageService.ERROR) {
    return tasksResult;
  }

  if (tasksResult.body.length == 0) {
    console.log("yumurta");
    return {
      body: null,
      message: messageService.ERROR_NO_TASK,
      status: messageService.ERROR,
    };
  }
  console.log("kalamar");

  const tasks = tasksResult.body;

  let filteredTasks = await tasks.filter(
    (task) => task.processId === processId
  );

  filteredTasks.sort((a, b) => a.number - b.number);

  let lastListType = null;
  let lastTask = null;

  for (let i = 0; i < filteredTasks.length; i++) {
    const task = filteredTasks[i];

    if (task.listType && task.listOkey == false) {
      console.log("fare", task);

      task.body = task.body != null ? task.body : [];
      console.log("ayakkabı", task);

      if (task.body.length == 0) {
        console.log("solucan", task);

        return {
          body: task,
          message: messageService.NEXT_TASK_FOUND,
          status: messageService.SUCCESS,
        };
      } else {
        const listTypeTasks = tasks.filter((t) => t.listType === task.listType);
        let differenceFlag = differenceTaskListTypeLength(listTypeTasks, task);
        console.log("tavuk: ", differenceFlag);

        if (differenceFlag == true) {
          console.log("yılan");

          return {
            body: task,
            message: messageService.NEXT_TASK_FOUND,
            status: messageService.SUCCESS,
          };
        } else {
          console.log("yalın");

          //   return {
          //   body: listTypeTasks[0],
          //   message: messageService.NEXT_TASK_FOUND,
          //   status: messageService.SUCCESS,
          // };
        }
      }

      if (lastListType != task.listType) {
        lastListType = task.listType;
      }
    } else {
      console.log("patates1: ", lastListType);
      console.log("patates2: ", userMessage);
      console.log("patates3: ", !task.body);
      console.log("patates4: ", previousTask != null);

      if (
        lastListType &&
        userMessage == "/skip" &&
        !task.body &&
        previousTask != null
      ) {
        console.log("patates buraya girdi: ", lastListType);

        const listTypeTasks = tasks.filter(
          (tas) => tas.listType === lastListType
        );

        for (let i = 0; i < listTypeTasks.length; i++) {
          let t = listTypeTasks[i];
          t.listOkey = true;
          console.log("patateste task: ", t);

          await updateTask(t);
        }

        return {
          body: task,
          message: messageService.NEXT_TASK_FOUND,
          status: messageService.SUCCESS,
        };
      }

      if (lastListType && !task.body) {
        console.log("yulaf: ", lastListType);

        const listTypeTasks = tasks.filter((t) => t.listType === lastListType);

        return {
          body: listTypeTasks[0],
          message: messageService.NEXT_TASK_FOUND,
          status: messageService.SUCCESS,
        };
      }

      lastListType = null;

      if (!task.body) {
        console.log("çorap");

        return {
          body: task,
          message: messageService.NEXT_TASK_FOUND,
          status: messageService.SUCCESS,
        };
      }
    }
  }

  return {
    body: null,
    message: messageService.ALL_TASK_DONE,
    status: messageService.TASKS_DONE,
  };
};

const updateTask = (task) => {
  const result = db.updateTaskFile(task);

  return result;
};

const updateProcess = (process) => {
  const result = db.updateProcessFile(process);

  return result;
};

// random id üretir
const generateRandomId = () => {
  return uuidv4();
};

export default {
  onGoingProcess,
  updateProcess,
  nextTask,
  updateTask,
  findMessageById,
  findMessageByTaskId,
  createMessage,
  createErrorCard,
  endOfTheTaskList,
  findTasksByProcessId,
};
