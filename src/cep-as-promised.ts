'use strict'

require('isomorphic-fetch');

import fetchCorreios from './services/correios'
import fetchViaCep from './services/viacep'
import fetchCepAberto from './services/cepaberto'
import fetchCepAbertoBrowser from './services/cepaberto-browser'
import CepPromiseError from './errors/cep-promise'
import { any } from './utils/promise-any';
import * as Q from 'q';
import { CEP } from './cep';
const CEP_SIZE = 8

export default function cep(cepRawValue: string | number): Promise<CEP>{
  let promise = Q.when(cepRawValue)
    .then(validateInputType)
    .then(removeSpecialCharacters)
    .then(validateInputLength)
    .then(leftPadWithZeros)
    .then(fetchCepFromServices)
    .catch<CEP>(handleServicesError)
    .catch<CEP>(throwApplicationError)
  return promise as Promise<CEP>;
}

export function cepBrowser(cepRawValue: string | number): Promise<CEP> {
  return Q.when(cepRawValue)
    .then(validateInputType)
    .then(removeSpecialCharacters)
    .then(validateInputLength)
    .then(leftPadWithZeros)
    .then(fetchCepFromServicesBrowser)
    .catch<CEP>(handleServicesError)
    .catch<CEP>(throwApplicationError)
}

function validateInputType (cepRawValue) {
  const cepTypeOf = typeof cepRawValue

  if (cepTypeOf === 'number' || cepTypeOf === 'string') {
    return cepRawValue
  }

  throw new CepPromiseError({
    message: 'Erro ao inicializar a instância do CepPromise.',
    type: 'validation_error',
    errors: [{
      message: 'Você deve chamar o construtor utilizando uma String ou um Number.',
      service: 'cep_validation'
    }]
  })
}

function removeSpecialCharacters (cepRawValue) {
  return cepRawValue.toString().replace(/\D+/g, '')
}

function leftPadWithZeros (cepCleanValue) {
  for (var i = 0; i < CEP_SIZE - cepCleanValue.length; i++){
    cepCleanValue = '0' + cepCleanValue;
  }
  return cepCleanValue;
}

function validateInputLength (cepWithLeftPad) {
  if (cepWithLeftPad.length <= CEP_SIZE) {
    return cepWithLeftPad
  }

  throw new CepPromiseError({
    message: `CEP deve conter exatamente ${CEP_SIZE} caracteres.`,
    type: 'validation_error',
    errors: [{
      message: `CEP informado possui mais do que ${CEP_SIZE} caracteres.`,
      service: 'cep_validation'
    }]
  })
}

function fetchCepFromServices (cepWithLeftPad): Promise<CEP> {
  return  any<CEP>([
    fetchCorreios(cepWithLeftPad),
    fetchViaCep(cepWithLeftPad),
    fetchCepAberto(cepWithLeftPad) 
  ])
}

function fetchCepFromServicesBrowser(cepWithLeftPad) {
  return any([
    fetchViaCep(cepWithLeftPad),
    fetchCepAbertoBrowser(cepWithLeftPad)
  ])
}

function handleServicesError(aggregatedErrors): Q.IWhenable<CEP> {
  if (aggregatedErrors.length !== undefined) {
    throw new CepPromiseError({
      message: 'Todos os serviços de CEP retornaram erro.',
      type: 'service_error',
      errors: aggregatedErrors
    })
  }
  throw aggregatedErrors
}

function throwApplicationError({ message, type, errors }): Q.IWhenable<CEP> {
  throw new CepPromiseError({ message, type, errors })
}
