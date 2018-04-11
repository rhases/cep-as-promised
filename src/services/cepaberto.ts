'use strict'

import ServiceError from '../errors/service';

export default function fetchCepAbertoService (cepWithLeftPad) {
  const url = `https://cors.now.sh/http://www.cepaberto.com/api/v3/cep?cep=${cepWithLeftPad}`
  const options: RequestInit = {
    method: 'GET',
    mode: 'cors',
    headers: {
      'content-type': 'application/json;charset=utf-8',
      'Authorization': 'Token token="a9785cc4e6441ba56cc4d35a627998ce"'
    }
  }

  return fetch(url, options)
    .then(analyzeAndParseResponse)
    .then(checkForViaCepError)
    .then(extractCepValuesFromResponse)
    .catch(throwApplicationError)
}

function analyzeAndParseResponse (response) {
  if (response.ok) {
    return response.json()
  }
  throw Error('Erro ao se conectar com o serviço Cep Aberto.')
}

function checkForViaCepError (responseObject) {
  if (!Object.keys(responseObject).length) {
    throw new Error('CEP não encontrado na base do Cep Aberto.')
  }
  return responseObject
}

function extractCepValuesFromResponse (responseObject) {
  return {
    cep: responseObject.cep,
    state: responseObject.estado,
    city: responseObject.cidade,
    neighborhood: responseObject.bairro,
    street: responseObject.logradouro
  }
}

function throwApplicationError (error) {
  const serviceError = new ServiceError({
    message: error.message,
    service: 'cepaberto'
  })

  if (error.name === 'FetchError') {
    serviceError.message = 'Erro ao se conectar com o serviço Cep Aberto.'
  }

  throw serviceError
}
