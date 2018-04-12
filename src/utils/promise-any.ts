'use strict'
import * as Q from 'q';

function reverse<T> (promise):Promise<T> {
    let defer = Q.defer<T>();
    promise.then(defer.reject, defer.resolve)
    return defer.promise;
}

export function any<T>(iterable):Promise<T> { return reverse(Q.all([...iterable].map(reverse))) }
