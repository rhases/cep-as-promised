"use strict";

import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
var chaiSubset = require('chai-subset');

chai.should();
chai.use(chaiAsPromised);
chai.use(chaiSubset)

process.on("unhandledRejection", () => {
    // Do nothing; we test these all the time.
});
process.on("rejectionHandled", () => {
    // Do nothing; we test these all the time.
});