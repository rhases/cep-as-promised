'use strict'

require('isomorphic-fetch');

import { parseString } from 'xml2js';
import * as _ from 'lodash';
import ServiceError from '../errors/service';
import * as Q from 'q';

export default function fetchCorreiosService (cepWithLeftPad) {
  const url = 'https://apps.correios.com.br/SigepMasterJPA/AtendeClienteService/AtendeCliente'
  const options = {
    method: 'POST',
    body: `<?xml version="1.0"?>\n<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:cli="http://cliente.bean.master.sigep.bsb.correios.com.br/">\n  <soapenv:Header />\n  <soapenv:Body>\n    <cli:consultaCEP>\n      <cep>${cepWithLeftPad}</cep>\n    </cli:consultaCEP>\n  </soapenv:Body>\n</soapenv:Envelope>`,
    //mode: 'no-cors',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'cache-control': 'no-cache'
    }
  }

  return fetch(url, options)
    .then(analyzeAndParseResponse)
    .catch(throwApplicationError)
}

function analyzeAndParseResponse (response) {
  if (response.ok) {
    return response.text()
      .then(parseXML)
      .then(extractValuesFromSuccessResponse)
  }

  return response.text()
    .then(parseXML)
    .then(extractErrorMessage)
    .then(throwCorreiosError)
}

function parseXML (xmlString) {
  var def = Q.defer();
  parseString(xmlString, (err, responseObject) => {
      if (!err) {
        def.resolve(responseObject);
      }
      def.reject(new Error('Não foi possível interpretar o XML de resposta.'))
  });
  
  return def.promise;
}

function extractErrorMessage (xmlObject) {
  return _.get(xmlObject, 'soap:Envelope.soap:Body[0].soap:Fault[0].faultstring[0]')
}

function throwCorreiosError (translatedErrorMessage) {
  throw new Error(translatedErrorMessage)
}

function extractValuesFromSuccessResponse (xmlObject) {
  let addressValues = _.get(xmlObject, 'soap:Envelope.soap:Body[0].ns2:consultaCEPResponse[0].return[0]')

  return {
    cep: _.get(addressValues, 'cep[0]'),
    state: _.get(addressValues, 'uf[0]'),
    city: _.get(addressValues, 'cidade[0]'),
    neighborhood: _.get(addressValues, 'bairro[0]'),
    street: _.get(addressValues, 'end[0]')
  }
}

function throwApplicationError (error) {
  const serviceError = new ServiceError({
    message: error.message,
    service: 'correios'
  })

  if (error.name === 'FetchError') {
    serviceError.message = 'Erro ao se conectar com o serviço dos Correios.'
  }

  throw serviceError
}
