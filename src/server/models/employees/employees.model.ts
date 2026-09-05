import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose'
import { normalizeTextInput } from '@/lib/text'
import { DEFAULT_EMPLOYEE_ROLE, EMPLOYEE_ROLES, type EmployeeRole } from '@/lib/employees/employee-roles'

const employeeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, index: true, set: normalizeTextInput },
    role: { type: String, required: true, enum: EMPLOYEE_ROLES, default: DEFAULT_EMPLOYEE_ROLE, index: true },
    phone: { type: String, trim: true, default: '' },
    active: { type: Boolean, required: true, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown> & { _id?: unknown; id?: string }) => {
        ret.id = String(ret._id)
        delete ret._id
        return ret
      },
    },
  }
)

employeeSchema.index({ name: 1 })
employeeSchema.index({ role: 1 })
employeeSchema.index({ active: 1 })

export type EmployeeModelFields = InferSchemaType<typeof employeeSchema>

export type EmployeeDocumentShape = EmployeeModelFields & {
  _id: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type EmployeeDTO = {
  id: string
  name: string
  role: EmployeeRole
  phone?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export const EmployeeModel: Model<EmployeeDocumentShape> =
  mongoose.models.Employee ?? mongoose.model<EmployeeDocumentShape>('Employee', employeeSchema)
