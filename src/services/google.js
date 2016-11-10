'use strict'

import fetch from 'isomorphic-fetch'
import ServiceError from '../errors/service.js'
import Promise from 'bluebird'

function fetchGoogleService (cepWithLeftPad) {

  return new Promise((resolve, reject) => {
    const url = `//maps.googleapis.com/maps/api/geocode/json?address=${cepWithLeftPad}`
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
      .then(extractFirstGoogleRequest)
      .then(requestWithLatLng)
      .then(extractSecondGoogleRequest)
      .then(resolvePromise)
      .catch(rejectWithServiceError)

    function requestWithLatLng (cepObject) {
      const url = 
        `//maps.googleapis.com/maps/api/geocode/json?latlng=${cepObject.latLng}`
      const options = {
        method: 'GET',
        mode: 'cors',
        headers: {
          'content-type': 'application/json;charset=utf-8'
        }
      }
      return Promise.props({
        latLngInfo: fetch(url, options)
          .then(analyzeAndParseResponse)
          .then(checkForGoogleError),
        currentCepInfo: cepObject.currentCepInfo
      })
    }

    function extractSecondGoogleRequest (response) {
      const correctAddressComponent = response.latLngInfo.results
        .map(result => {
          return result.address_components
        })
        .filter(address_components => {
          return address_components.filter(ac => { 
            return ac.long_name.replace('-', '') === response.currentCepInfo.cep
          }).length > 0
        })
        .filter(maybeStreet => {
          return maybeStreet.filter(ac => {
            return ac.types.indexOf('route') !== -1
          }).length > 0
        })[0]
      const street = correctAddressComponent.filter(ac => 
        ac.types.indexOf('route') !== -1)[0].short_name
      return Object.assign({}, response.currentCepInfo, { street: street } )
    }

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

    function extractFirstGoogleRequest (responseObject) {
      const lat = responseObject.results[0].geometry.location.lat
      const lng = responseObject.results[0].geometry.location.lng
      return {
        currentCepInfo: {
          cep: extractGoogleAdressComponent(responseObject, 'postal_code').replace('-', ''),
          state: extractGoogleAdressComponent(responseObject, 'administrative_area_level_1'),
          city: extractGoogleAdressComponent(responseObject, 'administrative_area_level_2'),
          neighborhood: extractGoogleAdressComponent(responseObject, 'sublocality'),
          street: extractGoogleAdressComponent(responseObject, 'route')
        },
        latLng: lat + ',' + lng
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

