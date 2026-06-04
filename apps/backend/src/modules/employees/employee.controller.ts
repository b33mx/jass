import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createEmployee, deleteEmployee, getAllEmployees, getEmployeeById, updateEmployee } from './employee.service.js';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'ต้องระบุชื่อ'),
  lastName: z.string().min(1, 'ต้องระบุนามสกุล'),
  wage: z.number().positive('ค่าแรงต้องมากกว่า 0'),
});

const updateNameSchema = z.object({
  firstName: z.string().min(1, 'ต้องระบุชื่อ'),
  lastName: z.string().min(1, 'ต้องระบุนามสกุล'),
});

export async function handleGetAllEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const employees = await getAllEmployees(req.lineUser!.companyId);
    res.json(employees);
  } catch (err) {
    next(err);
  }
}

export async function handleCreateEmployee(req: Request, res: Response, next: NextFunction) {
  const parsed = employeeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const employee = await createEmployee(parsed.data, req.lineUser!.companyId);
    res.status(201).json(employee);
  } catch (err) {
    next(err);
  }
}

export async function handleGetEmployeeById(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'id ไม่ถูกต้อง' });
    return;
  }

  try {
    const employee = await getEmployeeById(id, req.lineUser!.companyId);
    if (!employee) {
      res.status(404).json({ error: 'ไม่พบพนักงาน' });
      return;
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateEmployee(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'id ไม่ถูกต้อง' });
    return;
  }

  const parsed = updateNameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const employee = await updateEmployee(id, parsed.data, req.lineUser!.companyId);
    res.json(employee);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteEmployee(req: Request, res: Response, next: NextFunction) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'id ไม่ถูกต้อง' });
    return;
  }

  try {
    const employee = await deleteEmployee(id, req.lineUser!.companyId);
    if (!employee) {
      res.status(404).json({ error: 'ไม่พบพนักงาน' });
      return;
    }
    res.json({ success: true, employee });
  } catch (err) {
    next(err);
  }
}
