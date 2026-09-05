import { AppError } from '@/server/errors/app-error'

export async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    throw new AppError('Corpo da requisição inválido.', 400)
  }
}
