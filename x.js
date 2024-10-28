import { Types, Schema, model } from "mongoose";


const st = model("story", story);

const s = new st({
  title: "test",
});

console.log(s.createdAt);
