import mongoose from 'mongoose'

const masschema = new mongoose.Schema({
  CODE: {
    type: Number,
    required: true // CODE is mandatory, but not unique per user
  },
  ACCOUNT_N: {
    type: String,
    required: true
  },
  TITLE: {
    type: String,
    default: '' // Default to empty string if not provided
  },
  YR_BAL: {
    type: Number,
    default: 0
  },
  AMOUNT: {
    type: Number,
    default: 0
  },
  MAIN_CODE: {
    type: String,
    required: true
  },
  HEAD_NAME: {
    type: String,
    required: true
  },
  LEVEL: {
    type: String,
    default: ''
  },
  ST_NUMBER: {
    type: String,
    default: ''
  },
  ST_DATE: {
    type: Date,
    default: null // Can be null if not provided
  },
  ADDRESS1: {
    type: String,
    default: ''
  },
  ADDRESS2: {
    type: String,
    default: ''
  },
  CITY: {
    type: String,
    default: ''
  },
  PHONE: {
    type: String,
    default: ''
  },
  DEP_RATE: {
    type: Number,
    default: 0
  },
  REV_CODE: {
    type: String,
    default: ''
  },
  OUT_BAL: {
    type: Number,
    default: 0
  },
  PAGE: {
    type: Number,
    default: 0
  },
  LAST_BAL: {
    type: Number,
    default: 0
  },
  TAX_TYPE: {
    type: String,
    default: ''
  },
  TIN: {
    type: String,
    default: ''
  },
  K1: {
    type: String,
    default: ''
  },
  STATE: {
    type: String,
    default: ''
  },
  CATEGORY: {
    type: String,
    default: ''
  },
  STATE_CODE: {
    type: String,
    default: ''
  },
  PAN: {
    type: String,
    default: ''
  },
  PINCODE: {
    type: String,
    default: ''
  },
  DISTANCE: {
    type: Number,
    default: 0
  },
  user: {
    type: String,
    required: true
  }

},{timestamps: true })

export const mas = mongoose.models.mas || mongoose.model("mas",masschema);