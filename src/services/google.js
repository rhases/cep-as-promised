'use strict'

import fetch from 'isomorphic-fetch'
import ServiceError from '../errors/service.js'

function fetchGoogleService (cepWithLeftPad) {

  return new Promise((resolve, reject) => {
    const url = `//maps.googleapis.com/maps/api/geocode/json?address=${cepWithLeftPad}&result_type=street_address&location_type=ROOFTOP&sensor=false`
    const options = {
      method: 'GET',
      mode: 'cors',
      headers: {
        'content-type': 'application/json;charset=utf-8'
      }
    }

    return fetch(url, options)
      .then(analyzeAndParseResponse)
      .then(checkForGoogleError)
      .then(extractCepValuesFromResponse)
      .then(resolvePromise)
      .catch(rejectWithServiceError)

    function analyzeAndParseResponse (response) {
      if (response.ok) {
        return response.json()
      }
      throw Error('Erro ao se conectar com o serviço Google Maps.')
    }

    function checkForGoogleError (responseObject) {
      if (responseObject.error_message) {
        throw new Error('CEP não encontrado na base do Google Maps.')
      }

      return responseObject
    }

    function extractGoogleAdressComponent (responseObject, type) {
      const components = responseObject.results[0].address_components
        .filter(address_component => 
          address_component.types.indexOf(type) !== -1 
        )
      if (components[0]) {
        return components[0].short_name
      } 
      return 'not-found'
    }

    function extractCepValuesFromResponse (responseObject) {
      return {
        cep: extractGoogleAdressComponent(responseObject, 'postal_code').replace('-', ''),       
        state: extractGoogleAdressComponent(responseObject, 'administrative_area_level_1'),
        city: extractGoogleAdressComponent(responseObject, 'administrative_area_level_2'),
        neighborhood: extractGoogleAdressComponent(responseObject, 'sublocality'),
        street: extractGoogleAdressComponent(responseObject, 'route')
      }
    }

    function resolvePromise (cepObject) {
      resolve(cepObject)
    }

    function rejectWithServiceError (error) {
      const serviceError = new ServiceError({
        message: error.message,
        service: 'google'
      })

      if (error.name === 'FetchError') {
        serviceError.message = 'Erro ao se conectar com o serviço Google.'
      }

      reject(serviceError)
    }

  })

}

export default fetchGoogleService

