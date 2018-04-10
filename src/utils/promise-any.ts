'use strict'
import * as Q from 'q';

const reverse = (promise) => {
    let defer = Q.defer();
    promise.then(defer.reject, defer.resolve)
    return defer.promise;
}

export function any(iterable) { return reverse(Q.all([...iterable].map(reverse))) }
