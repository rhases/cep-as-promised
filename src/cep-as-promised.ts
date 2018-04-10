'use strict'

import fetchCorreios from './services/correios'
import fetchViaCep from './services/viacep'
import fetchCepAberto from './services/cepaberto'
import CepPromiseError from './errors/cep-promise'
import { any } from './utils/promise-any';
import * as Q from 'q';

const CEP_SIZE = 8

export default function (cepRawValue) {
  return Q.when(cepRawValue)
    .then(validateInputType)
    .then(removeSpecialCharacters)
    .then(validateInputLength)
    .then(leftPadWithZeros)
    .then(fetchCepFromServices)
    .catch(handleServicesError)
    .catch(throwApplicationError)
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
  return '0'.repeat(CEP_SIZE - cepCleanValue.length) + cepCleanValue
  // return cepCleanValue;
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

function fetchCepFromServices (cepWithLeftPad) {
  return any([
    fetchCorreios(cepWithLeftPad),
    fetchViaCep(cepWithLeftPad),
    fetchCepAberto(cepWithLeftPad) 
  ])
}

function handleServicesError (aggregatedErrors) {
  if (aggregatedErrors.length !== undefined) {
    throw new CepPromiseError({
      message: 'Todos os serviços de CEP retornaram erro.',
      type: 'service_error',
      errors: aggregatedErrors
    })
  }
  throw aggregatedErrors
}

function throwApplicationError ({ message, type, errors }) {
  throw new CepPromiseError({ message, type, errors })
}
