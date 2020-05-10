import { ethers } from "ethers";
import models from "../models";
export const isValidAccountAddress = (address) => {
  try {
    return ethers.utils.getAddress(address);
  } catch (ex) {
    return false;
  }
};
export const queryToPageInfo = (query) => {
  let qPage = query.page ? query.page : 0;
  let qPageSize = query.pageSize ? query.pageSize : 10;
  let page = Math.max(0, qPage);
  let pageSize = Math.max(0, qPageSize);
  return { page, pageSize };
};

export const queryToFilter = async (query) => {
  let filterFinished = query.finished ? true : false;
  let sort = {};
  let find = {finished: filterFinished}
  if (query.sortByDate) {
    sort.created = "desc";
  } else if (query.sortBySize) {
    sort.stake = "desc";
  }
  if(query.filterCreatorAddress && isValidAccountAddress(query.filterCreatorAddress)){
    const account = await models.Account.accountForAddress(query.filterCreatorAddress);
    find.creator = account._id;
  }
  return { find, sort };
};

export const isValidAddress = (address) =>{
  try{
    if(ethers.utils.getAddress(address)){
      return true;
    }
  }catch(ex){
    return false;
  }
}

export const isBodyValidDebate = (body) => {
  const { address, title, description, tags, stake } = body;

  if(!isValidAddress(address)){
    return { isValid: false, data: "Invalid address" };
  }
  if (!title) {
    return { isValid: false, data: "Invalid title" };
  }
  if (!description) {
    return { isValid: false, data: "Invalid description" };
  }
  if (tags && !tags.length) {
    return { isValid: false, data: "Invalid tags object" };
  } else if (tags && tags.length > 0) {
    for (const tag in tags) {
      if (typeof tag !== "string") {
        return { isValid: false, data: "Invalid tag object" };
      }
    }
  }
  if (isNaN(stake)) {
    return { isValid: false, data: "Invalid stake" };
  }

  return { isValid: true, data: { address, title, description, tags, stake } };
};

export const isBodyValidOpinion = (body)=>{
  const { debateId, address, content, contentType, stake, pro } = body;
  if(!debateId){
    return { isValid: false, data: "Invalid debate id" };
  }
  if(!isValidAddress(address)){
    return { isValid: false, data: "Invalid address" };
  }
  if(!contentType){
    return { isValid: false, data: "Invalid content type" };
  }
  if (isNaN(stake)) {
    return { isValid: false, data: "Invalid stake" };
  }

  return { isValid: true, data: { debateId, address, content, contentType, stake, pro  } };
}
