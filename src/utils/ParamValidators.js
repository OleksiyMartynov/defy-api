import { ethers } from "ethers";
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

export const queryToFilter = (query) => {
  let filterFinished = query.finished ? true : false;
  let sort = {};
  if (query.sortByDate) {
    sort.created = "desc";
  } else if (query.sortBySize) {
    sort.stake = "desc";
  }
  return { find: { finished: filterFinished }, sort };
};

export const isBodyValidDebate = (body) => {
  const { address, title, description, tags, stake } = body;
  let cleanAddress;
  try{
    cleanAddress = ethers.utils.getAddress(address);
  }catch(ex){
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
