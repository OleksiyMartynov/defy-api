import mongoose from "mongoose";
import Debate from "./Debate";
import Opinion from "./Opinion";
import Account from "./Account";
import History from "./History";
import Tag from "./Tag";
import Invoice from "./Invoice";

const models = { Account, Debate, Opinion, History, Tag, Invoice, database:mongoose };
export default models;
