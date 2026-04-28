import { Router } from 'express';
import { handleCreateTasks } from './task.controller.js';

export const taskRouter = Router();
taskRouter.post('/', handleCreateTasks);
