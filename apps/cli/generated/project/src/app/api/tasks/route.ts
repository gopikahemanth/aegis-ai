import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define schema for task creation
const taskSchema = z.object({
  title: z.string().min(1),
  columnId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = taskSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input', 
          errors: validatedData.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      );
    }

    const { title, columnId, priority } = validatedData.data;
    
    // Perform database insertion
    const newTask = await prisma.task.create({
      data: {
        title,
        columnId,
        priority,
        status: 'TODO',
        userId: 'system-user', // Replace with dynamic session user ID in production
      }
    });
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}