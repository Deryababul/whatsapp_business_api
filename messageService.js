const messageService = {
INPROGRESS: "INPROGRESS",
  
SUCCESS: "SUCCESS",
SUCCESS_WROTE_FILE_MESSAGE: "File written successfully",
SUCCESS_FIND_FILE_MESSAGE: "Data file found",
SUCCESS_DATA_FOUND: "Data found",
PROCESS_ON_GOING_FOUND: "On going process found",
NEXT_TASK_FOUND: "next task found",
ALL_TASK_DONE: "all tasks completed",
TASKS_DONE: "TASKS_DONE",
SUCCESS_PROCESS_AND_TASKS_CREATED: "process and tasks created",


ERROR: "ERROR",
ERROR_WROTE_FILE_MESSAGE: "Error writing file",
ERROR_FIND_FILE_MESSAGE: "Data file not found",
ERROR_DATA_FOUND: "Data not found",
PROCESS_ON_GOING_NOT_FOUND: "On going process not found",
  
ERROR_PROCESS_DATA_FOUND: "Data found",
PROCESS_UNEXPECTED_ERROR: "Unexpected error occurred while searching for ongoing process",
ERROR_NO_TASK:  "No task for this process was found"

}


const returnBody = (body = null, message, status) => {
  return {
    body: body,
    message: message,
    status: status,
  };
};

export default {messageService, returnBody}
