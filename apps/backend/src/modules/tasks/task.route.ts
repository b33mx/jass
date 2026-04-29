import { Router } from 'express';
import multer from 'multer';
import { handleCreateTasks, handleGetTasksForDate, handleReplaceTasksForDate, handleTriggerSummary, handleUploadImages } from './task.controller.js';

const upload = multer({ storage: multer.memoryStorage() });

export const taskRouter = Router();
taskRouter.get('/', handleGetTasksForDate);
taskRouter.post('/', handleCreateTasks);
taskRouter.put('/', handleReplaceTasksForDate);
taskRouter.post('/summary', handleTriggerSummary);
taskRouter.post('/images', upload.array('images', 5), handleUploadImages);
