declare module 'migrate-mongo' {
  import {Connection} from 'mongoose'
  export const database: {connect: () => Promise<Connection>}
  export const up: (arg0: Connection) => Promise<Array<string>>
  export const down: (arg0: Connection) => Promise<Array<string>>
  export const status: (arg0: Connection) => Promise<Array<{fileName: string; appliedAt: Date}>>
}

declare module 'mongoose-delete' {
  export = _
  import {Schema} from 'mongoose'
  const _: (schema: Schema) => void
}
