import mongoose from 'mongoose'

export const lgrschema = new mongoose.Schema({

CODE: {
    type: Number,
    // required: true, // Assuming CODE is a mandatory identifier
  },
  ACCOUNT_N: {
    type: String,
    // required: true,
  },
  VC_NUMBER: {
    type: Number, // Can be null, so Number is appropriate
    default: null,
  },
  VC_TYPE: {
    type: String,
    default: '',
  },
  ENTRY_NO: {
    type: Number,
    default: null,
  },
  DEBIT: {
    type: Number,
    default: null, // Can be null
  },
  CREDIT: {
    type: Number,
    default: null, // Can be null
  },
  BALANCE: {
    type: Number,
    default: 0,
  },
  DESCRIBE: {
    type: String,
    default: '',
  },
  DATE: {
    type: Date,
    // required: true, // Assuming DATE is mandatory
  },
  BILL: {
    type: String,
    default: '',
  },
  BOOK: {
    type: String,
    default: '',
  },
  INV_DATE: {
    type: Date,
    default: null, // Can be null
  },
  QUANTITY: {
    type: Number,
    default: null,
  },
  CASH_MEMO: {
    type: Number, // Assuming this is a number like a memo ID
    default: null,
  },
  LEDG_CHECK: {
    type: String,
    default: '',
  },
  MAIN_KEY: {
    type: String,
    
  },
  K1: {
    type: String,
    
  },
  user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }

},{timestamps:true}) 
export const lgr = mongoose.models.lgr || mongoose.model("lgr",lgrschema)