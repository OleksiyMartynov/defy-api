import { ethers } from "ethers";
export const isValidAccountAddress = (address) => {
    try{
        return ethers.utils.getAddress(address);
    }catch(ex){
        return false;
    }
}