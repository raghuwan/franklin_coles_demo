/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


import fetch from 'node-fetch';
import { Core } from '@adobe/aio-sdk';
import { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } from '../utils';

// main function that will be executed by Adobe I/O Runtime
async function main(params) {
  // create a Logger
  const logger = Core.Logger('main', {
    level: params.LOG_LEVEL || 'info'
  })

  class CustomCircularList {
    constructor() {
      this.first = null;
      this.last = null;
      this.pointer = null;
      this.count = 0;
    }
    add(data) {
      let node = new Node(data);
      if (this.count == 0) {
        this.first = node;
        this.last = node;
        this.pointer = node;
      } else {
        this.last.next = node;
        this.last = node;
      }
      this.count++;
    }
    addFirst(data) {
      let node = new Node(data);
      if (this.count == 0) {
        this.first = node;
        this.last = node;
      } else {
        node.next = this.first;
        this.first = node;
      }
      this.pointer = node;
      this.count++;
    }
    get() {
      let data = this.pointer;
      this.pointer = this.pointer.next;
      if (this.pointer == null)
        this.pointer = this.first;
      return data;
    }
  }

  class Node {
    constructor(data) {
      this.data = data;
      this.next = null;
    }
  }

  class SellerSchedule {
    constructor(publishLink, duration) {
      this.publishLink = publishLink;
      this.duration = duration;
    }
  }

  // 'info' is the default level if not set
  logger.info('Calling the main action')

  // log parameters, only if params.LOG_LEVEL === 'debug'
  logger.debug(stringParameters(params))

  // check for missing request input parameters and headers
  const requiredParams = []
  const requiredHeaders = [ /*add require headers*/ ]
  var name = params.name || 'stranger';
  var place = params.place || 'unknown';
  var storeid = params.storeid || "Coles_Aus_123";
  var numofslot = params.numofslot || 18;
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
  logger.info('Got the error1')
  if (errorMessage) {
    // return and log client errors
    logger.info('Got the error2')
    return errorResponse(400, errorMessage, logger)
  }

  // extract the user Bearer token from the Authorization header
  //const token = getBearerToken(params)

  // replace this with the api you want to access
  const apiEndpoint = 'https://adobeioruntime.net/api/v1'

  const data = await fetch("https://main--screens-ad-management--mchandak29.hlx.live/seller-slots.json");
  const sellerData = await data.json();
  let slotsRes = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 2; j++) {
      slotsRes[i] = [];
    }
  }
  sellerData["data"].forEach(slot => {
    let sellerSchedule = slot["Seller Schedule"];
    for (let j = 1; j <= 6; j++) {
      let slotNum = slot["Slot " + j];
      if ("Yes" === slotNum) {
        slotsRes[j - 1].push(sellerSchedule);
      }
    }
  });
  const adMap = new Map();
  for (let i = 0; i < 6; i++) {
    const sellerAdList = new CustomCircularList();
    const lists = slotsRes[i];
    for (let sellerUrl of lists) {
      const sellersAddsData = await fetch(sellerUrl);
      const sellersAdds = await sellersAddsData.json();
      const adData = sellersAdds["data"];
      adData.forEach(ad => {
        const storeNum = ad["store number"];
        const isNational = "Yes" === ad["NATIONAL"];
        const isEmergency = "Yes" === ad["EMERGENCY"];
        const duration = ad["duration"];
        let publishLink = ad["Published Link"];
        if (publishLink === null) {
          publishLink = ad["Published URL"];
        }
        if (isEmergency || isNational || (storeid === storeNum)) {
          const obj = {'Published Link':publishLink, 'Duration':duration};
          if (isEmergency) {
            sellerAdList.addFirst(obj);
          } else {
            sellerAdList.add(obj);
          }
        }
      });
    }
    if (i != 1) {
      adMap.set(i, sellerAdList);
    }
  }
  const playlist = [];
  let n = 0;
  for (let i = 0; i < 3 && n < numofslot; i++) {
    for (let j = 0; j < 6 && n < numofslot; j++) {
      if (j == 0 || j == 1) {
        playlist[n++] = adMap.get(0).get().data;
      } else {
        playlist[n++] = adMap.get(j).get().data;
      }
    }
  }
  const playlistJson = JSON.stringify({
    "data": playlist
  });
  let response = {
    statusCode: 200,
    body: playlistJson
  }
  // log the response status code
  logger.info(`${response.statusCode}: successful request`)
  return response

}

const _main = main;
export {_main as main};
