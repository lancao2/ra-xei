'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, decrypt, computeHash, hashPin } from '@/lib/security'

export async function createUser(data: FormData) {
  const name = data.get('name') as string;
  const pixKey = data.get('pixKey') as string;
  const city = data.get('city') as string;
  const pin = data.get('pin') as string;

  if (!name || !pixKey || !city || !pin) {
    throw new Error('Todos os campos são obrigatórios.')
  }

  if (pin.length !== 6) {
    throw new Error('O PIN deve ter exatamente 6 dígitos.')
  }

  try {
    const pixKeyHash = computeHash(pixKey);
    
    // Verificar se o usuário já existe pelo HASH
    const existingUser = await prisma.user.findFirst({ where: { pixKeyHash } });
    if (existingUser) {
      throw new Error('Esta chave Pix já possui uma conta. Tente fazer login.');
    }

    const user = await prisma.user.create({
      data: { 
          name, 
          pixKeyHash, 
          pixKeyEncrypted: encrypt(pixKey),
          city,
          pin: hashPin(pin)
      }
    })

    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      path: '/' 
    });
  } catch (err: any) {
    if (err.message.includes('possui uma conta')) throw err;
    console.error('Create user error:', err);
    throw new Error('Erro ao criar conta. Verifique os dados e tente novamente.');
  }

  redirect('/dashboard');
}

export async function loginUser(data: FormData) {
    const pixKey = data.get('pixKey') as string;
    const pin = data.get('pin') as string;

    if (!pixKey || !pin) {
        throw new Error('Pix e PIN são obrigatórios.');
    }

    try {
        const pixKeyHash = computeHash(pixKey);
        const user = await prisma.user.findFirst({ where: { pixKeyHash } });
        
        if (!user || user.pin !== hashPin(pin)) {
            throw new Error('Chave Pix ou PIN incorretos.');
        }

        const cookieStore = await cookies();
        cookieStore.set('userId', user.id, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            path: '/' 
        });
    } catch (err: any) {
        if (err.message.includes('incorretos')) throw err;
        console.error('Login error:', err);
        throw new Error('Erro ao entrar. Tente novamente mais tarde.');
    }

    redirect('/dashboard');
}

export async function getUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        // Descriptografar a chave para uso na aplicação
        return {
            ...user,
            pixKey: decrypt(user.pixKeyEncrypted)
        };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/');
}

export async function deleteUserAccount() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) throw new Error('Não autorizado');

  try {
    // 1. Deletar todas as cobranças vinculadas
    await prisma.bill.deleteMany({
        where: { userId }
    });

    // 2. Deletar o usuário
    await prisma.user.delete({
        where: { id: userId }
    });

    // 3. Limpar cookies e sair
    cookieStore.delete('userId');
  } catch (err) {
    console.error('Account deletion error:', err);
    throw new Error('Erro ao excluir conta. Tente novamente.');
  }

  redirect('/');
}

export async function createBill(totalValue: number, peopleCount: number) {
  const user = await getUser();
  if (!user) throw new Error('Não autorizado');

  return await prisma.bill.create({
    data: {
      amount: totalValue,
      peopleCount: peopleCount,
      userId: user.id
    }
  });
}

export async function incrementScanCount(billId: string) {
  return await prisma.bill.update({
    where: { id: billId },
    data: { scanCount: { increment: 1 } }
  });
}

export async function markAsPaid(billId: string) {
  return await prisma.bill.update({
    where: { id: billId },
    data: { paidCount: { increment: 1 } }
  });
}

export async function deleteBill(billId: string) {
  try {
    await prisma.bill.delete({
      where: { id: billId },
    });
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Falha ao excluir no banco de dados' };
  }
}

export async function getUserBills() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) return [];

  return await prisma.bill.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBillStatus(billId: string) {
  return await prisma.bill.findUnique({
    where: { id: billId },
    select: { scanCount: true, paidCount: true }
  });
}

export async function getBill(billId: string) {
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: { user: true }
    });

    if (bill && bill.user) {
        return {
            ...bill,
            user: {
                ...bill.user,
                pixKey: decrypt(bill.user.pixKeyEncrypted)
            }
        };
    }
    return bill;
}
