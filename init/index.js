const mongoose = require("mongoose");
const initData= require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(()=>{
        console.log("connect to DB");
    })
    .catch((err)=>{
        console.log(err);
    });

async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async() =>{
    await Listing.deleteMany({});
    // sab listings mai owner ko add kr ne ke liye
    initData.data = initData.data.map((obj) => ({...obj, owner: "68ced42b494d2849407dcba6"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();