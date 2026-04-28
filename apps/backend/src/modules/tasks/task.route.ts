import { Router } from 'express';
import { handleCreateTasks } from './task.controller.ts';

export const taskRouter = Router();
taskRouter.post('/', handleCreateTasks);
