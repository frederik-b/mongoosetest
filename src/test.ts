import {readFileSync} from 'fs'
import * as mongoose from 'mongoose'
import * as softDelete from 'mongoose-delete'
import * as paginate from 'mongoose-paginate'

const config = {
  db: {
    deploy: true,
    expose: false,
    monitor: false,
    serverList: 'db:27017',
    database: 'mongoosetest',
  connectionOptions: {
    auth: {authSource: 'admin'},
    user: 'root',
    get pass() {
      return readFileSync('/usr/local/opt/secrets/db.key').toString().trim()
    },
    replicaSet: '',
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  optionsString: '',
  doMigrations: false,
  debug: false,
  maximumErrors: 10,
  exitOnMaxFails: true,
  }
}

// set default query options
const mongooseSetOptions = mongoose.Query.prototype.setOptions
mongoose.Query.prototype.setOptions = function(this: any) {
  mongooseSetOptions.apply(this, arguments)

  if (!this.mongooseOptions().hasOwnProperty('lean')) {
    this.mongooseOptions({...this.mongooseOptions(), lean: true})
  }
  if (this.options.upsert && !this.options.hasOwnProperty('setDefaultsOnInsert')) {
    this.options.setDefaultsOnInsert = true
  }

  return this
}

before(async () => {
  await mongoose.connect(
    `mongodb://${config.db.serverList}/${config.db.database}${config.db.optionsString}`,
    config.db.connectionOptions as any,
  )
  await MessageModel.deleteMany({})
})

after(async () => {
  await mongoose.connection.close()
})

const schemaOptions = {
  timestamps: true,
  collation: {locale: 'de'},
  discriminatorKey: 'messageType',
}
const messageSchema = new mongoose.Schema(
  {
    messageType: {type: String, enum: ['claim', 'some', 'other', 'values']},
    text: {type: String, default: ''},
  },
  schemaOptions,
)

async function preHook(this: any) {
  if (!(this instanceof mongoose.Query)) throw new Error('not instance of Query')
}
messageSchema.pre('findOneAndUpdate', preHook)

messageSchema.plugin(paginate)
messageSchema.plugin(softDelete, {deletedAt: true, overrideMethods: true})
const MessageModel = mongoose.model('Message', messageSchema)

const claimMessageSchema = new mongoose.Schema({foo: String}, schemaOptions)
claimMessageSchema.plugin(paginate)
export const ClaimMessageModel = MessageModel.discriminator('claim', claimMessageSchema)

it(`should not update the sender profile info if the id did not change`, async () => {
  await MessageModel.findOneAndUpdate({_id: '400000000000000000000001'}, {[`senderId`]: '000000000000000000000002'}, {upsert: true})
})
